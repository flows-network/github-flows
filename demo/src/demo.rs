use github_flows::{
    get_octo, listen_to_event,
    octocrab::models::{events::payload::EventPayload, reactions::ReactionContent},
};
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

    let reaction = octo
        .issues("jetjinser", "github-flows")
        .create_reaction(1, ReactionContent::Rocket)
        .await;

    match reaction {
        Ok(c) => send_message_to_channel("ham-5b68442", "general", c.created_at.to_rfc2822()),
        Err(e) => send_message_to_channel("ham-5b68442", "general", e.to_string()),
    }
}
