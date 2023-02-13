use http_req::request;
pub use octocrab;

use octocrab::{models::Event, Octocrab};
use once_cell::sync::OnceCell;

const GH_API_PREFIX: &str = "http://github-flows.vercel.app/api";

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

pub fn revoke_listeners() {
    unsafe {
        let mut flows_user = Vec::<u8>::with_capacity(100);
        let c = get_flows_user(flows_user.as_mut_ptr());
        flows_user.set_len(c as usize);
        let flows_user = String::from_utf8(flows_user).unwrap();

        let mut flow_id = Vec::<u8>::with_capacity(100);
        let c = get_flow_id(flow_id.as_mut_ptr());
        if c == 0 {
            panic!("Failed to get flow id");
        }
        flow_id.set_len(c as usize);
        let flow_id = String::from_utf8(flow_id).unwrap();

        let mut writer = Vec::new();

        // TODO: need params
        let res = request::get(
            format!("{}/{}/{}/revoke", GH_API_PREFIX, flows_user, flow_id),
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

// TODO: real listen wt
pub fn listen_to_xxx<F>(callback: F)
where
    F: Fn(Event),
{
    unsafe {
        match is_listening() {
            // Calling register
            1 => {
                let mut flows_user = Vec::<u8>::with_capacity(100);
                let c = get_flows_user(flows_user.as_mut_ptr());
                flows_user.set_len(c as usize);
                let flows_user = String::from_utf8(flows_user).unwrap();

                let mut flow_id = Vec::<u8>::with_capacity(100);
                let c = get_flow_id(flow_id.as_mut_ptr());
                if c == 0 {
                    panic!("Failed to get flow id");
                }
                flow_id.set_len(c as usize);
                let flow_id = String::from_utf8(flow_id).unwrap();

                let mut writer = Vec::new();
                // TODO: need params
                let res = request::get(
                    format!("{}/{}/{}/listen", GH_API_PREFIX, flows_user, flow_id),
                    &mut writer,
                )
                .unwrap();

                match res.status_code().is_success() {
                    true => {
                        if let Ok(event) = serde_json::from_slice::<Event>(&writer) {
                            callback(event)
                        }
                    }
                    false => {
                        set_error_log(writer.as_ptr(), writer.len() as i32);
                    }
                }
            }
            _ => {
                if let Some(event) = event_from_subcription() {
                    callback(event)
                }
            }
        }
    }
}

pub fn get_octo() -> &'static Octocrab {
    static INSTANCE: OnceCell<Octocrab> = OnceCell::new();

    INSTANCE.get_or_init(|| {
        Octocrab::builder()
            .base_url(GH_API_PREFIX)
            .unwrap_or_else(|e| panic!("setting up base_url({}) failed: {}", GH_API_PREFIX, e))
            .build()
            .expect("Octocrab build failed")
    })
}

fn event_from_subcription() -> Option<Event> {
    unsafe {
        let l = get_event_body_length();
        let mut event_body = Vec::<u8>::with_capacity(l as usize);
        let c = get_event_body(event_body.as_mut_ptr());
        assert!(c == l);
        event_body.set_len(c as usize);
        match serde_json::from_slice::<Event>(&event_body) {
            Ok(e) => Some(e),
            Err(_) => None,
        }
    }
}
