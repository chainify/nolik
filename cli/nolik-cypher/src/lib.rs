use thiserror::Error;

use sodiumoxide::crypto::{
	box_,
	box_::{Nonce, PublicKey, SecretKey},
};

#[doc(inline)]
pub use cypher_macro::Cypher;

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
