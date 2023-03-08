#![doc = include_str!(concat!(env!("CARGO_MANIFEST_DIR"), "/README.md"))]

pub use octocrab::{self, models::events::payload::EventPayload};

use http_req::request;
use once_cell::sync::OnceCell;

use std::future::Future;

// const GH_API_PREFIX: &str = "http://github-flows.vercel.app/api";
const GH_API_PREFIX: &str = "http://35.88.34.250:6670/api";

extern "C" {
    // Flag if current running is for listening(1) or message receving(0)
    fn is_listening() -> i32;

    // Return the user id of the flows platform
    fn get_flows_user(p: *mut u8) -> i32;

    // Return the flow id
    fn get_flow_id(p: *mut u8) -> i32;

    fn get_event_body_length() -> i32;
    fn get_event_body(p: *mut u8) -> i32;
    fn set_error_log(p: *const u8, len: i32);
}

unsafe fn _get_flows_user() -> String {
    let mut flows_user = Vec::<u8>::with_capacity(100);
    let c = get_flows_user(flows_user.as_mut_ptr());
    flows_user.set_len(c as usize);
    String::from_utf8(flows_user).unwrap()
}

unsafe fn _get_flow_id() -> String {
    let mut flow_id = Vec::<u8>::with_capacity(100);
    let c = get_flow_id(flow_id.as_mut_ptr());
    if c == 0 {
        panic!("Failed to get flow id");
    }
    flow_id.set_len(c as usize);
    String::from_utf8(flow_id).unwrap()
}

/// Revoke previous registered listener of current flow.
///
/// Most of the time you do not need to call this function. As inside
/// the [listen_to_event()] it will revoke previous registered
/// listener, so the only circumstance you need this function is when
/// you want to change the listener from GitHub to others.
pub fn revoke_listeners(owner: &str, repo: &str, events: Vec<&str>) {
    unsafe {
        let flows_user = _get_flows_user();
        let flow_id = _get_flow_id();

        let mut writer = Vec::new();
        let res = request::get(
            format!(
                "{}/{}/{}/revoke?owner={}&repo={}&{}",
                GH_API_PREFIX,
                flows_user,
                flow_id,
                owner,
                repo,
                events
                    .iter()
                    .map(|e| format!("events={}", e))
                    .collect::<Vec<String>>()
                    .join("&")
            ),
            &mut writer,
        )
        .unwrap();

        match res.status_code().is_success() {
            true => (),
            false => {
                set_error_log(writer.as_ptr(), writer.len() as i32);
            }
        }
    }
}

#[allow(rustdoc::bare_urls)]
/// Create a listener for *https://github.com/`owner`/`repo`*.
///
/// If you have not install
/// [Flows.network platform](https://test.flows.network)'s app to your GitHub,
/// you will receive an error in the flow's building log or running log.
///
/// Before creating the listener, this function will revoke previous
/// registered listener of current flow so you don't need to do it manually.
///
/// `callback` is a callback function which will be called when new `Event` is received.
pub async fn listen_to_event<F, Fut>(owner: &str, repo: &str, events: Vec<&str>, callback: F)
where
    F: FnOnce(EventPayload) -> Fut,
    Fut: Future<Output = ()>,
{
    unsafe {
        match is_listening() {
            // Calling register
            1 => {
                let flows_user = _get_flows_user();
                let flow_id = _get_flow_id();

                let mut writer = Vec::new();
                let res = request::get(
                    format!(
                        "{}/{}/{}/listen?owner={}&repo={}&{}",
                        GH_API_PREFIX,
                        flows_user,
                        flow_id,
                        owner,
                        repo,
                        events
                            .iter()
                            .map(|e| format!("events={}", e))
                            .collect::<Vec<String>>()
                            .join("&")
                    ),
                    &mut writer,
                )
                .unwrap();

                match res.status_code().is_success() {
                    true => {
                        if let Ok(event) = serde_json::from_slice::<EventPayload>(&writer) {
                            callback(event).await;
                        }
                    }
                    false => {
                        set_error_log(writer.as_ptr(), writer.len() as i32);
                    }
                }
            }
            _ => {
                if let Some(event) = event_from_subcription() {
                    callback(event).await;
                }
            }
        }
    }
}

static INSTANCE: OnceCell<octocrab::Octocrab> = OnceCell::new();

/// Get a Octocrab Instance with GitHub Integration base_url
/// if `login` is `None`, it will be flows.network username
pub fn get_octo(login: Option<String>) -> &'static octocrab::Octocrab {
    INSTANCE.get_or_init(|| {
        let flows_user = unsafe { _get_flows_user() };
        let login = login.unwrap_or(flows_user.clone());
        octocrab::Octocrab::builder()
            .base_url(format!("{}/{}/proxy/{}/", GH_API_PREFIX, flows_user, login))
            .unwrap_or_else(|e| panic!("setting up base_url({}) failed: {}", GH_API_PREFIX, e))
            .build()
            .expect("Octocrab build failed")
    })
}

fn event_from_subcription() -> Option<EventPayload> {
    unsafe {
        let l = get_event_body_length();
        let mut event_body = Vec::<u8>::with_capacity(l as usize);
        let c = get_event_body(event_body.as_mut_ptr());
        assert!(c == l);
        event_body.set_len(c as usize);
        match serde_json::from_slice(&event_body) {
            Ok(e) => Some(e),
            Err(_) => None,
        }
    }
}
