extern crate proc_macro;

// use proc_macro2::TokenStream;
use quote::{quote, quote_spanned};
use syn::{
	parse_macro_input, parse_quote, spanned::Spanned, Data, DeriveInput, Fields, GenericParam,
	Generics,
};
enum Direction {
	Encrypt,
	Decrypt,
}

pub fn impl_derive_cypher(input: proc_macro::TokenStream) -> proc_macro::TokenStream {
	// Parse the input tokens into a syntax tree.
	let input = parse_macro_input!(input as DeriveInput);

	// Used in the quasi-quotation below as `#name`.
	let name = input.ident;

	// Add a bound `T: Cypher` to every type parameter T.
	let generics = add_trait_bounds(input.generics);
	let (impl_generics, ty_generics, where_clause) = generics.split_for_impl();

	// Generate an expression to sum up the heap size of each field.
	// let sum = heap_size_sum(&input.data);

	let encrypted = cypher_fields(&input.data, Direction::Encrypt);
	let decrypted = cypher_fields(&input.data, Direction::Decrypt);

	let expanded = quote! {
		// The generated impl.
		impl #impl_generics Cypher for #name #ty_generics #where_clause {
			fn encrypt(&self, nonce: &Nonce, pk: &PublicKey, sk: &SecretKey) -> Self {
				Self {#encrypted}
			}

			fn decrypt(&self, nonce: &Nonce, pk: &PublicKey, sk: &SecretKey) -> Result<Self, CypherError> {
				Ok(Self{#decrypted})
			}
		}
	};

	// Hand the output tokens back to the compiler.
	proc_macro::TokenStream::from(expanded)
}

// Add a bound `T: Cypher` to every type parameter T.
fn add_trait_bounds(mut generics: Generics) -> Generics {
	for param in &mut generics.params {
		if let GenericParam::Type(ref mut type_param) = *param {
			type_param.bounds.push(parse_quote!(Cypher));
		}
	}
	generics
}

fn cypher_fields(data: &Data, direction: Direction) -> proc_macro2::TokenStream {
	match *data {
		Data::Struct(ref data) => match data.fields {
			Fields::Named(ref fields) => {
				let recurse = fields.named.iter().map(|f| {
					let name = &f.ident;
					match direction {
						Direction::Encrypt => quote_spanned! {f.span()=>
							#name: self.#name.encrypt(nonce, pk, sk)
						},
						Direction::Decrypt => quote_spanned! {f.span()=>
							#name: self.#name.decrypt(nonce, pk, sk)?
						},
					}
				});
				quote! {
					#(#recurse,)*
				}
			},
			_ => unimplemented!(),
		},
		Data::Enum(_) | Data::Union(_) => unimplemented!(),
	}
}
