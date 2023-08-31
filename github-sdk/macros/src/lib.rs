use proc_macro::TokenStream;
use quote::{quote, ToTokens};

#[proc_macro_attribute]
pub fn event_handler(_: TokenStream, item: TokenStream) -> TokenStream {
    let ast: syn::ItemFn = syn::parse(item).unwrap();
    let func_ident = ast.sig.ident.clone();

    let gen = quote! {
        mod notion_flows_macros {
            extern "C" {
                pub fn get_event_body_length() -> i32;
                pub fn get_event_body(p: *mut u8) -> i32;
            }

        }

        fn __github_event_received() -> Option<EventPayload> {
            unsafe {
                let l = notion_flows_macros::get_event_body_length();
                let mut event_body = Vec::<u8>::with_capacity(l as usize);
                let c = notion_flows_macros::get_event_body(event_body.as_mut_ptr());
                assert!(c == l);
                event_body.set_len(c as usize);

                match serde_json::from_slice::<EventPayload>(&event_body) {
                    Ok(e) => Some(e),
                    Err(_) => None,
                }
            }
        }

        #[no_mangle]
        #[tokio::main(flavor = "current_thread")]
        pub async fn __github__on_event_received() {
            if let Some(body) = __github_event_received() {
                #func_ident(body).await;
            }
        }
    };

    let ori_run_str = ast.to_token_stream().to_string();
    let x = gen.to_string() + &ori_run_str;
    x.parse().unwrap()
}
