#![cfg_attr(not(feature = "std"), no_std)]

mod messages;
mod meta;

#[cfg(feature = "std")]
pub use inner_std::*;
pub use messages::{Message, MessageEntry, MessageType};
pub use meta::{Channel, MessageMetadata};

#[cfg(feature = "std")]
mod inner_std {
	use crate::{Message, MessageMetadata};
	use crypto_box::{
		aead::{AeadCore, OsRng},
		PublicKey, SalsaBox, SecretKey,
	};
	pub use nolik_cypher::{BytesCypher, Cypher, CypherError, SalsaNonce};
	use serde::{Deserialize, Serialize};
	use std::{
		ffi::CString,
		mem,
		os::raw::{c_char, c_void},
	};

	pub enum MessageAction {
		Encrypt,
		Decrypt,
	}

	#[derive(Serialize, Deserialize, Debug)]
	struct MetadataEncryptParams {
		pub origin: [u8; 32],
		pub public_nonce: [u8; 24],
		pub sender_pk: [u8; 32],
		pub recipients: Vec<[u8; 32]>,
		pub message: Message,
	}

	#[derive(Serialize, Deserialize, Debug, Default)]
	struct MetadataEncryptReturn {
		pub metadata: MessageMetadata,
		pub secret_nonce: [u8; 24],
		pub error: String,
	}

	#[derive(Serialize, Deserialize, Debug)]
	struct MetadataDecryptParams {
		pub metadata: MessageMetadata,
		pub receiver_sk: [u8; 32],
	}

	#[derive(Serialize, Deserialize, Debug, Default)]
	struct MetadataDecryptReturn {
		pub metadata: MessageMetadata,
		pub error: String,
	}

	#[derive(Serialize, Deserialize, Debug, Default)]
	struct MessageInput {
		pub message: Message,
		pub nonce: [u8; 24],
		pub pk: [u8; 32],
		pub sk: [u8; 32],
	}

	#[derive(Serialize, Deserialize, Debug, Default)]
	struct MessageReturn {
		pub message: Message,
		pub error: String,
	}

	#[no_mangle]
	pub extern "C" fn allocate(size: usize) -> *mut c_void {
		let mut buffer = Vec::with_capacity(size);
		let pointer = buffer.as_mut_ptr();
		mem::forget(buffer);

		pointer as *mut c_void
	}

	#[no_mangle]
	pub extern "C" fn deallocate(pointer: *mut c_void, capacity: usize) {
		unsafe {
			let _ = Vec::from_raw_parts(pointer, 0, capacity);
		}
	}

	fn allocate_string(s: &str) -> *mut c_char {
		unsafe { CString::from_vec_unchecked(s.as_bytes().to_vec()) }.into_raw()
	}

	macro_rules! serialize_and_allocate {
		( $val:expr ) => {{
			let serialized = serde_json::to_string($val).unwrap_or_else(|e| e.to_string());
			allocate_string(&serialized)
		}};
	}

	macro_rules! unwrap_or_return {
		( $e:expr, $return_struct:ident ) => {
			match $e {
				Ok(x) => x,
				Err(err) => {
					let ret = $return_struct { error: err.to_string(), ..Default::default() };
					return serialize_and_allocate!{&ret};
				},
			}
		};
	}

	#[no_mangle]
	pub extern "C" fn new_encrypted_message(input: *mut c_char, capacity: usize) -> *mut c_char {
		let input = unsafe { Vec::from_raw_parts(input as *mut u8, 0, capacity) };
		let MetadataEncryptParams { origin, public_nonce, sender_pk, recipients, message } =
			unwrap_or_return! {serde_json::from_slice(&input), MetadataEncryptReturn};
		let recipients: Vec<_> = recipients.iter().map(|pk| PublicKey::from(*pk)).collect();

		let (metadata, secret_nonce) = unwrap_or_return! {MessageMetadata::new_encrypted(
			&PublicKey::from(origin),
			&SalsaNonce::from_slice(&public_nonce),
			&PublicKey::from(sender_pk),
			recipients.iter().collect::<Vec<_>>().as_slice(),
			&message,
		) , MetadataEncryptReturn};

		let secret_nonce = secret_nonce.to_vec().try_into().map_err(|_| "nonce size is not valid");
		let secret_nonce: [u8; 24] = unwrap_or_return! {secret_nonce, MetadataEncryptReturn};
		let encrypted = MetadataEncryptReturn { metadata, secret_nonce, ..Default::default() };
		serialize_and_allocate! {&encrypted}
	}

	#[no_mangle]
	pub extern "C" fn decrypt_metadata(input: *mut c_char, capacity: usize) -> *mut c_char {
		let input = unsafe { Vec::from_raw_parts(input as *mut u8, 0, capacity) };
		let MetadataDecryptParams { metadata, receiver_sk } =
			unwrap_or_return! {serde_json::from_slice(&input), MetadataDecryptReturn};
		let receiver_sk = SecretKey::from(receiver_sk);
		let metadata = unwrap_or_return! {metadata.decrypt(&receiver_sk), MetadataDecryptReturn};

		let decrypted = MetadataDecryptReturn { metadata, ..Default::default() };
		serialize_and_allocate! {&decrypted}
	}

	fn on_message(input: *mut c_char, capacity: usize, action: MessageAction) -> *mut c_char {
		let input = unsafe { Vec::from_raw_parts(input as *mut u8, 0, capacity) };
		let MessageInput { message, nonce, pk, sk } =
			unwrap_or_return! {serde_json::from_slice(&input), MessageReturn};
		let nonce = SalsaNonce::from_slice(&nonce);
		let pk = PublicKey::from(pk);
		let sk = SecretKey::from(sk);
		let message = unwrap_or_return! {match action {
			MessageAction::Encrypt => message.encrypt(&nonce, &pk, &sk),
			MessageAction::Decrypt => message.decrypt(&nonce, &pk, &sk),
		}, MessageReturn};
		let ret = MessageReturn { message, ..Default::default() };
		serialize_and_allocate! {&ret}
	}

	#[no_mangle]
	pub extern "C" fn encrypt_message(input: *mut c_char, capacity: usize) -> *mut c_char {
		on_message(input, capacity, MessageAction::Encrypt)
	}

	#[no_mangle]
	pub extern "C" fn decrypt_message(input: *mut c_char, capacity: usize) -> *mut c_char {
		on_message(input, capacity, MessageAction::Decrypt)
	}

	#[derive(Serialize, Deserialize, Debug, Default)]
	struct KeyPair {
		pub public: [u8; 32],
		pub secret: [u8; 32],
	}

	#[no_mangle]
	pub extern "C" fn generate_keypair() -> *mut c_char {
		let secret = SecretKey::generate(&mut OsRng);
		let pair = KeyPair { public: *secret.public_key().as_bytes(), secret: *secret.as_bytes() };
		serialize_and_allocate! {&pair}
	}

	#[derive(Serialize, Deserialize, Debug, Default)]
	struct NonceWrap {
		data: [u8; 24],
		error: String,
	}

	#[no_mangle]
	pub extern "C" fn generate_nonce() -> *mut c_char {
		let nonce = SalsaBox::generate_nonce(&mut OsRng);
		let nonce = nonce.to_vec().try_into().map_err(|_| "nonce size is not valid");
		let data: [u8; 24] = unwrap_or_return! {nonce, NonceWrap };
		serialize_and_allocate! {&NonceWrap{data, ..Default::default()}}
	}

	#[cfg(feature = "custom")]
	pub use custom::*;

	// use "custom" getrandom feature to call host RNG
	#[cfg(feature = "custom")]
	mod custom {
		use getrandom::{self, register_custom_getrandom};

		extern "C" {
			// call host OS random number generator
			fn random_bytes(dest: *mut u8, len: usize);
		}

		pub fn getrandom_custom(dest: &mut [u8]) -> Result<(), getrandom::Error> {
			unsafe { random_bytes(dest.as_mut_ptr(), dest.len()) };
			Ok(())
		}

		register_custom_getrandom!(getrandom_custom);
	}
}
