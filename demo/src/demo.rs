use github_flows::{
    get_octo, listen_to_event, octocrab::models::events::payload::EventPayload, Event,
};
use slack_flows::send_message_to_channel;

#[no_mangle]
#[tokio::main(flavor = "current_thread")]
pub async fn run() {
    listen_to_event("jetjinser", "github-flows", vec!["issue_comment"], handler).await;
}

async fn handler(event: Event) {
    send_message_to_channel("ham-5b68442", "general", "test".to_string());

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
