//! Describes a message format and encryption/decryption primitives for it.
//! Encryption and decryption is done with a Diffie-Hellman algorithm.

use nolik_cypher::Cypher;
use parity_scale_codec::{Decode, Encode};
use scale_info::TypeInfo;
use thiserror::Error;

use sodiumoxide::crypto::{
	box_,
	box_::{Nonce, PublicKey, SecretKey},
};

#[allow(dead_code)]
#[derive(Debug, Encode, Decode, TypeInfo, Clone, PartialEq, Default)]
pub enum MessageType {
	#[default]
	RawData,
	File,
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

#[derive(Error, Debug)]
pub enum CypherError {
	#[error("Could not decrypt data for {0:?}")]
	DecryptionFailed(PublicKey),
	#[error("Could not parse nonce {0:?}")]
	InvalidNonce(Vec<u8>),
	#[error("Could not parse pubkey {0:?}")]
	InvalidPubkey(Vec<u8>),
}

pub trait Cypher
where
	Self: Sized,
{
	fn encrypt(&self, nonce: &Nonce, pk: &PublicKey, sk: &SecretKey) -> Self;
	fn decrypt(&self, nonce: &Nonce, pk: &PublicKey, sk: &SecretKey) -> Result<Self, CypherError>;
}

impl<T: Cypher> Cypher for Vec<T> {
	fn encrypt(&self, nonce: &Nonce, pk: &PublicKey, sk: &SecretKey) -> Self {
		self.iter().map(|x| x.encrypt(nonce, pk, sk)).collect()
	}

	fn decrypt(&self, nonce: &Nonce, pk: &PublicKey, sk: &SecretKey) -> Result<Self, CypherError> {
		self.iter().map(|x| x.decrypt(nonce, pk, sk)).collect()
	}
}

impl Cypher for MessageType {
	fn encrypt(&self, _: &Nonce, _: &PublicKey, _: &SecretKey) -> Self {
		self.clone()
	}

	fn decrypt(&self, _: &Nonce, _: &PublicKey, _: &SecretKey) -> Result<Self, CypherError> {
		Ok(self.clone())
	}
}

pub trait BytesCypher {
	fn encrypt(&self, nonce: &Nonce, pk: &PublicKey, sk: &SecretKey) -> Vec<u8>;

	fn decrypt(
		&self,
		nonce: &Nonce,
		pk: &PublicKey,
		sk: &SecretKey,
	) -> Result<Vec<u8>, CypherError>;
}

impl BytesCypher for [u8] {
	fn encrypt(&self, nonce: &Nonce, pk: &PublicKey, sk: &SecretKey) -> Vec<u8> {
		box_::seal(self, nonce, pk, sk)
	}

	fn decrypt(
		&self,
		nonce: &Nonce,
		pk: &PublicKey,
		sk: &SecretKey,
	) -> Result<Vec<u8>, CypherError> {
		box_::open(self, nonce, pk, sk).map_err(|_| CypherError::DecryptionFailed(*pk))
	}
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
