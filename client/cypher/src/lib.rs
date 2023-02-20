use thiserror::Error;

use crypto_box::{
	aead::{Aead, Nonce},
	PublicKey, SalsaBox, SecretKey,
};

pub type SalsaNonce = Nonce<SalsaBox>;

#[doc(inline)]
pub use cypher_macro::Cypher;

#[derive(Error, Debug)]
pub enum CypherError {
	#[error("Could not encrypt data for {0:?}")]
	EncryptionFailed(PublicKey),
	#[error("Could not decrypt data for {0:?}")]
	DecryptionFailed(PublicKey),
	#[error("Could not parse nonce {0:?}")]
	UnexpectedNonceType(SalsaNonce),
	#[error("Could not parse pubkey {0:?}")]
	InvalidPubkey(Vec<u8>),
}

pub trait Cypher
where
	Self: Sized,
{
	fn encrypt(
		&self,
		nonce: &SalsaNonce,
		pk: &PublicKey,
		sk: &SecretKey,
	) -> Result<Self, CypherError>;
	fn decrypt(
		&self,
		nonce: &SalsaNonce,
		pk: &PublicKey,
		sk: &SecretKey,
	) -> Result<Self, CypherError>;
}

impl<T: Cypher> Cypher for Vec<T> {
	fn encrypt(
		&self,
		nonce: &SalsaNonce,
		pk: &PublicKey,
		sk: &SecretKey,
	) -> Result<Self, CypherError> {
		self.iter().map(|x| x.encrypt(nonce, pk, sk)).collect()
	}

	fn decrypt(
		&self,
		nonce: &SalsaNonce,
		pk: &PublicKey,
		sk: &SecretKey,
	) -> Result<Self, CypherError> {
		self.iter().map(|x| x.decrypt(nonce, pk, sk)).collect()
	}
}

pub trait BytesCypher {
	fn encrypt(
		&self,
		nonce: &SalsaNonce,
		pk: &PublicKey,
		sk: &SecretKey,
	) -> Result<Vec<u8>, CypherError>;

	fn decrypt(
		&self,
		nonce: &SalsaNonce,
		pk: &PublicKey,
		sk: &SecretKey,
	) -> Result<Vec<u8>, CypherError>;
}

impl BytesCypher for [u8] {
	fn encrypt(
		&self,
		nonce: &SalsaNonce,
		pk: &PublicKey,
		sk: &SecretKey,
	) -> Result<Vec<u8>, CypherError> {
		let sbox = SalsaBox::new(pk, sk);
		sbox.encrypt(nonce, self).map_err(|_| CypherError::EncryptionFailed(pk.clone()))
	}

	fn decrypt(
		&self,
		nonce: &SalsaNonce,
		pk: &PublicKey,
		sk: &SecretKey,
	) -> Result<Vec<u8>, CypherError> {
		let sbox = SalsaBox::new(pk, sk);
		sbox.decrypt(nonce, self).map_err(|_| CypherError::DecryptionFailed(pk.clone()))
	}
}
