use github_flows::{
    get_octo, listen_to_event, octocrab::models::events::payload::EventPayload, Event,
};

#[no_mangle]
#[tokio::main(flavor = "current_thread")]
pub async fn run() {
    listen_to_event("jetjinser", "github-flows", vec!["issue_comment"], handler).await;
}

async fn handler(event: Event) {
    let body = if let Some(EventPayload::IssueCommentEvent(e)) = event.payload {
        e.comment
            .body
            .unwrap_or("oops, there is no comment body".to_string())
    } else {
        "oops, it is not a IssueCommentEvent".to_string()
    };

    let octo = get_octo();

    octo.issues("jetjinser", "github-flows")
        .create_comment(1, format!("Ciao~!\nYou just comment:\n{}", body).as_str())
        .await
        .unwrap();
}