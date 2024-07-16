# GitHub Integration for [Flows.network](https://flows.network)

## Quick Start

```rust
use github_flows::{
    event_handler, get_octo, listen_to_event,
     octocrab::models::{
        reactions::ReactionContent,
        webhook_events::{WebhookEvent, WebhookEventPayload},
    }
    GithubLogin,
};

#[no_mangle]
#[tokio::main(flavor = "current_thread")]
pub async fn on_deploy() {
    // `some_login` must be authed in flows.network
    listen_to_event(&GithubLogin::Provided(String::from("some_login")), "some_owner", "some_repo", vec!["issue_comment"]).await;
}

#[event_handler]
async fn handler(event: Result<WebhookEvent, serde_json::Error>) {
    let payload = event.unwrap();
    if let WebhookEventPayload::IssueComment(e) = payload.specific {
        let comment_id = e.comment.id.0;

        // installed app login
        let octo = get_octo(&GithubLogin::Provided(String::from("some_login")));

        let _reaction = octo
            .issues("some_owner", "some_repo")
            .create_comment_reaction(comment_id, ReactionContent::Rocket)
            .await
            .unwrap();
    };
}
```

> Note that the tokio used here is
> [tokio_wasi](https://docs.rs/tokio_wasi/latest/tokio/)
> with `macros` and `rt` features

## example `Cargo.toml`

> ```toml
> [package]
> name = "demo"
> version = "0.1.0"
> edition = "2021"
>
> [lib]
> path = "src/demo.rs"
> crate-type = ["cdylib"]
>
> [dependencies]
> github-flows = "0.6"
> tokio_wasi = { version = "1.25.1", features = ["macros", "rt"] }
> serde_json = "1"
> ...
> ```

[listen_to_event](https://docs.rs/github-flows/latest/github_flows/fn.listen_to_event.html) is responsible for registering a listener for
`some_owner/some_repo`. When a new `issue_number` Event
coming, the fn `handler` decorated by [event_handler](https://docs.rs/github-flows/latest/github_flows/attr.event_handler.html) macro is called with received
`EventPayload` then [get_octo](https://docs.rs/github-flows/latest/github_flows/fn.get_octo.html) is used to get a
[Octocrab](https://docs.rs/octocrab/latest/octocrab/struct.Octocrab.html)
Instance to call GitHub api
