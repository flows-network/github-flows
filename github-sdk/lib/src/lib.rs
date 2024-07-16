#![doc = include_str!(concat!(env!("CARGO_MANIFEST_DIR"), "/README.md"))]

pub use octocrab::{self, models::events::payload::EventPayload};

use once_cell::sync::OnceCell;

pub use github_flows_macros::*;

use flowsnet_platform_sdk::write_error_log;

lazy_static::lazy_static! {
    static ref GH_API_PREFIX: String = String::from(
        std::option_env!("GH_API_PREFIX").unwrap_or("http://github.flows.network/api")
    );
}

extern "C" {
    // Return the user id of the flows platform
    fn get_flows_user(p: *mut u8) -> i32;

    // Return the flow id
    fn get_flow_id(p: *mut u8) -> i32;

    fn set_output(p: *const u8, len: i32);
    fn set_error_code(code: i16);
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

/// The GitHub login name that has been connected to
/// [Flows.network](https://flows.network) platform.
///
/// If set as `Default`, and you have connected only one GitHub account,
/// then whose login will be used.
///
/// If you want to specify a dedicated account, please set login name by `Provided`.
///
/// If there are more than one connected GitHub account, and this is set as `Default`,
/// you will receive an undetermined error.
///
pub enum GithubLogin {
    Default,
    Provided(String),
}

#[allow(rustdoc::bare_urls)]
/// Create a listener for *https://github.com/`owner`/`repo`*.
///
/// If you have not install
/// [Flows.network platform](https://flows.network)'s app to your GitHub,
/// you will receive an error in the flow's building log or running log.
///
pub async fn listen_to_event(
    github_login: &GithubLogin,
    owner: &str,
    repo: &str,
    events: Vec<&str>,
) {
    let login = match github_login {
        GithubLogin::Default => "",
        GithubLogin::Provided(s) => s.as_str(),
    };
    unsafe {
        let flows_user = _get_flows_user();
        let flow_id = _get_flow_id();

        let res = reqwest::get(format!(
            "{}/{}/{}/listen?owner={}&repo={}&login={}&handler_fn={}&{}",
            GH_API_PREFIX.as_str(),
            flows_user,
            flow_id,
            owner,
            repo,
            login,
            "__github__on_event_received",
            events
                .iter()
                .map(|e| format!("events={}", e))
                .collect::<Vec<String>>()
                .join("&")
        ))
        .await
        .unwrap();

        let status = res.status();
        match status.is_success() {
            true => {
                let output = format!(
                    "[{}] Listening to events `{}` on `{}/{}`",
                    std::env!("CARGO_CRATE_NAME"),
                    events.join(","),
                    owner,
                    repo
                );
                set_output(output.as_ptr(), output.len() as i32);
            }
            false => {
                write_error_log!(String::from_utf8_lossy(res.bytes().await.unwrap().as_ref()));
                set_error_code(status.as_u16() as i16);
            }
        }
    }
}

static INSTANCE: OnceCell<octocrab::Octocrab> = OnceCell::new();

/// Get a Octocrab Instance with GitHub Integration base_url
///
pub fn get_octo<'a>(github_login: &GithubLogin) -> &'static octocrab::Octocrab {
    let login = match github_login {
        // "_" as convension literal for default login
        GithubLogin::Default => "_",
        GithubLogin::Provided(s) => s.as_str(),
    };

    INSTANCE.get_or_init(|| {
        let flows_user = unsafe { _get_flows_user() };
        octocrab::Octocrab::builder()
            .base_uri(format!(
                "{}/{}/proxy/{}/",
                GH_API_PREFIX.as_str(),
                flows_user,
                login
            ))
            .unwrap_or_else(|e| {
                panic!(
                    "setting up base_url({}) failed: {}",
                    GH_API_PREFIX.as_str(),
                    e
                )
            })
            .build()
            .expect("Octocrab build failed")
    })
}
