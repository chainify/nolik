//! Describes a message format and encryption/decryption primitives for it.
//! Encryption and decryption is done with a Diffie-Hellman algorithm.

#[cfg(feature = "std")]
use base64::{engine::general_purpose, Engine as _};
#[cfg(feature = "std")]
use crypto_box::{PublicKey, SecretKey};
#[cfg(feature = "std")]
use nolik_cypher::{BytesCypher, Cypher, CypherError, SalsaNonce};
#[cfg(feature = "std")]
use serde::{Deserialize, Deserializer, Serialize, Serializer};

use codec::{Decode, Encode};
use scale_info::prelude::vec::Vec;

#[allow(dead_code)]
#[derive(Debug, Encode, Decode, Clone, PartialEq, Default)]
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
pub enum MessageType {
	#[default]
	RawData,
	File,
}

#[cfg(feature = "std")]
impl Cypher for MessageType {
	fn encrypt(&self, _: &SalsaNonce, _: &PublicKey, _: &SecretKey) -> Result<Self, CypherError> {
		Ok(self.clone())
	}

	fn decrypt(&self, _: &SalsaNonce, _: &PublicKey, _: &SecretKey) -> Result<Self, CypherError> {
		Ok(self.clone())
	}
}

#[cfg_attr(feature = "std", derive(Cypher, Serialize, Deserialize))]
#[derive(Debug, Encode, Decode, Clone, Default, PartialEq)]
pub struct Message {
	pub entries: Vec<MessageEntry>,
}

#[cfg_attr(feature = "std", derive(Cypher, Serialize, Deserialize))]
#[derive(Debug, Encode, Decode, Clone, Default, PartialEq)]
pub struct MessageEntry {
	#[cfg_attr(
		feature = "std",
		serde(serialize_with = "as_base64", deserialize_with = "from_base64")
	)]
	pub key: Vec<u8>,
	#[cfg_attr(
		feature = "std",
		serde(serialize_with = "as_base64", deserialize_with = "from_base64")
	)]
	pub value: Vec<u8>,
	pub kind: MessageType,
}

#[cfg(feature = "std")]
fn as_base64<S>(key: &[u8], serializer: S) -> Result<S::Ok, S::Error>
where
	S: Serializer,
{
	serializer.serialize_str(&general_purpose::STANDARD.encode(key))
}

#[cfg(feature = "std")]
fn from_base64<'a, D>(deserializer: D) -> Result<Vec<u8>, D::Error>
where
	D: Deserializer<'a>,
{
	use serde::de::Error;
	String::deserialize(deserializer).and_then(|string| {
		general_purpose::STANDARD
			.decode(&string)
			.map_err(|err| Error::custom(err.to_string()))
	})
}

#[cfg(feature = "std")]
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
