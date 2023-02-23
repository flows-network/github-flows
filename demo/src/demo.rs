use github_flows::{
    get_octo, listen_to_event,
    octocrab::models::{events::payload::EventPayload, reactions::ReactionContent},
};
use slack_flows::send_message_to_channel;

#[no_mangle]
#[tokio::main(flavor = "current_thread")]
pub async fn run() {
    listen_to_event(
        "jetjinser",
        "github-flows",
        vec!["issue_comment", "issues"],
        handler,
    )
    .await;
}

async fn handler(payload: EventPayload) {
    let octo = get_octo(Some(String::from("jetjinser")));
    let issues = octo.issues("jetjinser", "github-flows");

    let reaction = match payload {
        EventPayload::IssuesEvent(e) => {
            let issue_id = e.issue.number;
            Some(
                issues
                    .create_reaction(issue_id, ReactionContent::Rocket)
                    .await,
            )
        }
        EventPayload::IssueCommentEvent(e) => {
            let comment_id = e.comment.id.0;
            Some(
                issues
                    .create_comment_reaction(comment_id, ReactionContent::Rocket)
                    .await,
            )
        }
        _ => None
    };

    if let Some(re) = reaction {
        match re {
            Ok(c) => send_message_to_channel("ham-5b68442", "general", c.created_at.to_rfc2822()),
            Err(e) => send_message_to_channel("ham-5b68442", "general", e.to_string()),
        }
    }
}
