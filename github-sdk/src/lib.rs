pub use octocrab;

use octocrab::Octocrab;
use once_cell::sync::OnceCell;

const BASE_URL: &str = "http://localhost:3000";

pub fn get_octocrab() -> &'static Octocrab {
    static INSTANCE: OnceCell<Octocrab> = OnceCell::new();

    INSTANCE.get_or_init(|| {
        Octocrab::builder()
            .base_url(BASE_URL)
            .unwrap_or_else(|e| panic!("setting up base_url({}) failed: {}", BASE_URL, e))
            .build()
            .expect("Octocrab build failed")
    })
}

// TODO: listen event
