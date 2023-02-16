use github_flows::Event;
use http_req::request;

// const GH_API_PREFIX: &str = "https://github-flows.vercel.app/api";
const GH_API_PREFIX: &str = "http://35.88.34.250:6670/api";

extern "C" {
    fn get_event_body_length() -> i32;
    fn get_event_body(p: *mut u8) -> i32;
    fn set_flows(p: *const u8, len: i32);
}

#[no_mangle]
pub unsafe fn message() {
    if let Some(e) = event_from_subcription() {
        let mut writer = Vec::new();
        let res = request::get(
            format!(
                "{}/event/{}?events={:?}",
                GH_API_PREFIX, e.repo.name, e.r#type
            ),
            &mut writer,
        )
        .unwrap();

        if res.status_code().is_success() {
            if let Ok(flows) = String::from_utf8(writer) {
                set_flows(flows.as_ptr(), flows.len() as i32);
            }
        }
    }
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
