//! Describes a message format and encryption/decryption primitives for it.
//! Encryption and decryption is done with a Diffie-Hellman algorithm.

use nolik_cypher::{BytesCypher, Cypher, CypherError};
use parity_scale_codec::{Decode, Encode};
use scale_info::TypeInfo;

use sodiumoxide::crypto::box_::{Nonce, PublicKey, SecretKey};

#[allow(dead_code)]
#[derive(Debug, Encode, Decode, TypeInfo, Clone, PartialEq, Default)]
pub enum MessageType {
	#[default]
	RawData,
	File,
}

impl Cypher for MessageType {
	fn encrypt(&self, _: &Nonce, _: &PublicKey, _: &SecretKey) -> Self {
		self.clone()
	}

	fn decrypt(&self, _: &Nonce, _: &PublicKey, _: &SecretKey) -> Result<Self, CypherError> {
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
	use sodiumoxide::crypto::box_;

	#[test]
	fn encrypt_decrypt_message() {
		// Encryption and decryption using a Diffie-Hellman algorithm
		let (sender_pk, sender_sk) = box_::gen_keypair();
		let (receiver_pk, receiver_sk) = box_::gen_keypair();

		let nonce = box_::gen_nonce();

		let message = Message {
			entries: vec![MessageEntry {
				key: "key".into(),
				value: "value".into(),
				kind: MessageType::default(),
			}],
		};

		let encrypted_message = message.encrypt(&nonce, &receiver_pk, &sender_sk);
		let decrypted_message = encrypted_message
			.decrypt(&nonce, &sender_pk, &receiver_sk)
			.expect("could not decrypt a test message");

		assert_eq!(message, decrypted_message);
	}
}
