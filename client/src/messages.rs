//! Describes a message format and encryption/decryption primitives for it.
//! Encryption and decryption is done with a Diffie-Hellman algorithm.

use nolik_cypher::{BytesCypher, Cypher, CypherError, SalsaNonce};
use parity_scale_codec::{Decode, Encode};
use scale_info::TypeInfo;

use crypto_box::{PublicKey, SecretKey};

#[allow(dead_code)]
#[derive(Debug, Encode, Decode, TypeInfo, Clone, PartialEq, Default)]
pub enum MessageType {
	#[default]
	RawData,
	File,
}

impl Cypher for MessageType {
	fn encrypt(&self, _: &SalsaNonce, _: &PublicKey, _: &SecretKey) -> Result<Self, CypherError> {
		Ok(self.clone())
	}

	fn decrypt(&self, _: &SalsaNonce, _: &PublicKey, _: &SecretKey) -> Result<Self, CypherError> {
		Ok(self.clone())
	}
}

#[derive(Debug, Encode, Decode, TypeInfo, Clone, PartialEq, Cypher)]
pub struct Message {
	pub entries: Vec<MessageEntry>,
}

#[derive(Debug, Encode, Decode, TypeInfo, Clone, PartialEq, Cypher)]
pub struct MessageEntry {
	pub key: Vec<u8>,
	pub value: Vec<u8>,
	pub kind: MessageType,
}

#[cfg(test)]
mod tests {
	use super::*;
	use crate::messages::{Message, MessageEntry, MessageType};
	use crypto_box::{
		aead::{AeadCore, OsRng},
		SalsaBox,
	};

	#[test]
	fn encrypt_decrypt_message() {
		// Encryption and decryption using a Diffie-Hellman algorithm
		let sender_sk = SecretKey::generate(&mut OsRng);
		let sender_pk = sender_sk.public_key();
		let receiver_sk = SecretKey::generate(&mut OsRng);
		let receiver_pk = receiver_sk.public_key();

		let nonce = SalsaBox::generate_nonce(&mut OsRng);

		let message = Message {
			entries: vec![MessageEntry {
				key: "key".into(),
				value: "value".into(),
				kind: MessageType::default(),
			}],
		};

		let encrypted_message = message.encrypt(&nonce, &receiver_pk, &sender_sk).unwrap();
		let decrypted_message = encrypted_message
			.decrypt(&nonce, &sender_pk, &receiver_sk)
			.expect("could not decrypt a test message");

		assert_eq!(message, decrypted_message);
	}
}
