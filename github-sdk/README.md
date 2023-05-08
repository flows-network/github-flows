# GitHub Integration for [Flows.network](https://test.flows.network)

## Quick Start

```rust
use github_flows::{
    get_octo, listen_to_event,
    octocrab::models::{events::payload::EventPayload, reactions::ReactionContent},
    GithubLogin,
};

#[no_mangle]
#[tokio::main(flavor = "current_thread")]
pub async fn run() {
    // `some_login` must be authed in flows.network
    listen_to_event(&GithubLogin::Provided(String::from("some_login")), "some_owner", "some_repo", vec!["issue_comment"], handler).await;
}

async fn handler(payload: EventPayload) {
    if let EventPayload::IssueCommentEvent(e) = payload {
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
> github-flows = "0.2"
> tokio_wasi = { version = "1.25.1", features = ["macros", "rt"] }
> ...
> ```

[listen_to_event()] is responsible for registering a listener for
`some_owner/some_repo`. When a new `issue_number` Event
coming, the callback `handler` is called with received
`EventPayload` then [get_octo()] is used to get a
[Octocrab](https://docs.rs/octocrab/latest/octocrab/struct.Octocrab.html)
Instance to call GitHub api
