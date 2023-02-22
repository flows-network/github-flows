# GitHub Integration for [Flows.network](https://test.flows.network)

## Quick Start

```rust
use github_flows::{
    get_octo, listen_to_event,
    octocrab::models::{events::payload::EventPayload, reactions::ReactionContent},
};

#[no_mangle]
#[tokio::main(flavor = "current_thread")]
pub async fn run() {
    listen_to_event("some_owner", "some_repo", vec!["issue_comment"], handler).await;
}

async fn handler(payload: EventPayload) {
    if let EventPayload::IssueCommentEvent(e) = payload {
        let issue_number = e.comment.id.0;

        // installed app login
        let octo = get_octo(Some(String::from("jetjinser")));

        let _reaction = octo
            .issues("jetjinser", "github-flows")
            .create_reaction(issue_number, ReactionContent::Rocket)
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
channel `some_owner` of workspace `some_repo`. When a new `issue_number` Event
coming, the callback `handler` is called with received
`EventPayload` then [get_octo()] is used to get a
[Octocrab](https://docs.rs/octocrab/latest/octocrab/struct.Octocrab.html)
Instance to call GitHub api
