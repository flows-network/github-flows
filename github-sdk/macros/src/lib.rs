use proc_macro::TokenStream;
use quote::{quote, ToTokens};

#[proc_macro_attribute]
pub fn event_handler(_: TokenStream, item: TokenStream) -> TokenStream {
    let ast: syn::ItemFn = syn::parse(item).unwrap();
    let func_ident = ast.sig.ident.clone();

    let gen = quote! {
        mod github_flows_macros {
            extern "C" {
                pub fn get_event_body_length() -> i32;
                pub fn get_event_body(p: *mut u8) -> i32;
                pub fn get_event_headers_length() -> i32;
                pub fn get_event_headers(p: *mut u8) -> i32;
            }

        }

        fn __github_event_headers() -> Option<Vec<(String, String)>> {
            unsafe {
                let l = github_flows_macros::get_event_headers_length();
                let mut event_body = Vec::<u8>::with_capacity(l as usize);
                let c = github_flows_macros::get_event_headers(event_body.as_mut_ptr());
                assert!(c == l);
                event_body.set_len(c as usize);

                match serde_json::from_slice(&event_body) {
                    Ok(e) => Some(e),
                    Err(_) => None,
                }
            }
        }


        fn __github_event_received() -> Result<github_flows::octocrab::models::webhook_events::WebhookEvent, serde_json::Error> {
            unsafe {
                let headers = __github_event_headers();
                let event_name = headers
                    .unwrap_or_default()
                    .into_iter()
                    .find(|header| header.0.to_ascii_lowercase() == "x-github-event") // X-GitHub-Event
                    .unwrap_or((String::new(), String::new()))
                    .1;

                let l = github_flows_macros::get_event_body_length();
                let mut event_body = Vec::<u8>::with_capacity(l as usize);
                let c = github_flows_macros::get_event_body(event_body.as_mut_ptr());
                assert!(c == l);
                event_body.set_len(c as usize);

                github_flows::octocrab::models::webhook_events::WebhookEvent::try_from_header_and_body(&event_name, &event_body)
            }
        }

        #[no_mangle]
        #[tokio::main(flavor = "current_thread")]
        pub async fn __github__on_event_received() {
            let webhook_event = __github_event_received();
            #func_ident(webhook_event).await;
        }
    };

    let ori_run_str = ast.to_token_stream().to_string();
    let x = gen.to_string() + &ori_run_str;
    x.parse().unwrap()
}
