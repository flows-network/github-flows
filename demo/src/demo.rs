use github_flows::{listen_to_event, get_octo, Event};

#[no_mangle]
#[tokio::main(flavor = "current_thread")]
pub async fn run() {
    listen_to_event(handler)
}

async fn handler(event: Event) {
        let octo = get_octo();

        octo.issues("jetjinser", "github-flows").create_comment(1, "Hello, World!").await;
}
