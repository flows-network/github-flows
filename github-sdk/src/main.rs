use octocrab::Octocrab;
use reqwest::header::ACCEPT;

#[tokio::main(flavor = "current_thread")]
async fn main() -> octocrab::Result<()> {
    let octocrab = Octocrab::builder()
        .base_url("http://localhost:9000")?
        .add_header(ACCEPT, "application/json".to_string())
        .build()?;

    let repo = octocrab.repos("rust-lang", "rust").get().await?;

    let repo_metrics = octocrab
        .repos("rust-lang", "rust")
        .get_community_profile_metrics()
        .await?;

    println!(
        "{} has {} stars and {}% health percentage",
        repo.full_name.unwrap(),
        repo.stargazers_count.unwrap_or(0),
        repo_metrics.health_percentage
    );

    Ok(())
}
