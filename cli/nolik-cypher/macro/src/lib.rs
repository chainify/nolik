//! This crate implements the macro for `cypher` and should not be used directly.

mod impl_derive;
use proc_macro::TokenStream;

#[proc_macro_derive(Cypher)]
pub fn derive_encyphe(input: TokenStream) -> TokenStream {
	impl_derive::impl_derive_cypher(input)
}
