use github_flows::{get_octo, listen_to_event, octocrab::models::events::payload::EventPayload};
use slack_flows::send_message_to_channel;

#[no_mangle]
#[tokio::main(flavor = "current_thread")]
pub async fn run() {
    listen_to_event("jetjinser", "github-flows", vec!["issue_comment"], handler).await;
}

async fn handler(payload: EventPayload) {
    let body = if let EventPayload::IssueCommentEvent(e) = payload {
        e.comment
            .body
            .unwrap_or("oops, there is no comment body".to_string())
    } else {
        "oops, it is not a IssueCommentEvent".to_string()
    };

    send_message_to_channel("ham-5b68442", "general", body.clone());

    let octo = get_octo();

    let comment = octo
        .issues("jetjinser", "github-flows")
        .create_comment(1, format!("Ciao~!\nYou just comment:\n{}", body).as_str())
        .await
        .unwrap();

    send_message_to_channel(
        "ham-5b68442",
        "general",
        comment.body.unwrap_or("no-body".to_string()),
    );
}
