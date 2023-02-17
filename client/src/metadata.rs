/// subxt metadata -f bytes > substrate_metadata.scale
#[subxt::subxt(
	runtime_metadata_path = "../client/substrate_metadata.scale",
	derive_for_all_types = "PartialEq, Clone"
)]
pub mod polkadot {}
use subxt::utils::AccountId32;

use crate::messages::{Message, MessageEntry};
use blake2::{digest::Update, Digest};
pub use polkadot::runtime_types::pallet_nolik::pallet::{Channel, MessageMetadata};

use nolik_cypher::{BytesCypher, CypherError};
use sodiumoxide::crypto::{
	box_,
	box_::{Nonce, PublicKey, SecretKey},
};

pub trait TryFromSlice
where
	Self: Sized,
{
	fn try_from_slice(bs: &[u8]) -> Result<Self, CypherError>;
}

impl TryFromSlice for Nonce {
	fn try_from_slice(bs: &[u8]) -> Result<Self, CypherError> {
		Nonce::from_slice(bs).ok_or_else(|| CypherError::InvalidNonce(bs.into()))
	}
}

impl TryFromSlice for PublicKey {
	fn try_from_slice(bs: &[u8]) -> Result<Self, CypherError> {
		PublicKey::from_slice(bs).ok_or_else(|| CypherError::InvalidPubkey(bs.into()))
	}
}

impl MessageMetadata {
	/// Creates encrypted metadata using Diffie-Hellman scheme with extra secret nonce
	pub fn new_encrypted(
		origin: &AccountId32,
		public_nonce: &Nonce,
		sender_pk: &PublicKey,
		recipients: &[&PublicKey],
		message: &Message,
	) -> (MessageMetadata, Nonce) {
		let secret_nonce = box_::gen_nonce();
		let (broker_pk, broker_sk) = box_::gen_keypair();

		let mut parties = vec![sender_pk];
		parties.extend(recipients);

		let encrypted_channels = parties
			.iter()
			.map(|party_pk| Channel {
				nonce: secret_nonce.0.encrypt(public_nonce, party_pk, &broker_sk),
				parties: parties
					.iter()
					.map(|p| p.0.encrypt(&secret_nonce, party_pk, &broker_sk))
					.collect(),
			})
			.collect();

		(
			MessageMetadata {
				nonce: public_nonce.0,
				broker: broker_pk.0,
				hash: Self::compute_root_hash(
					origin,
					public_nonce,
					sender_pk,
					&broker_pk,
					&secret_nonce,
					recipients,
					message,
				)
				.finalize()
				.into(),
				channels: encrypted_channels,
			},
			secret_nonce,
		)
	}

	/// Create a root hash of all metadata and message entries
	pub fn compute_root_hash(
		origin: &AccountId32,
		public_nonce: &Nonce,
		sender_pk: &PublicKey,
		broker_pk: &PublicKey,
		secret_nonce: &Nonce,
		recipients: &[&PublicKey],
		message: &Message,
	) -> blake2::Blake2s256 {
		let mut hash = blake2::Blake2s256::new();

		let origin_hash = Self::hash_with_nonce(origin.as_ref(), secret_nonce);
		let public_nonce_hash = Self::hash_with_nonce(public_nonce.as_ref(), secret_nonce);
		let secret_nonce_hash = Self::hash_with_nonce(secret_nonce.as_ref(), secret_nonce);
		let broker_pk_hash = Self::hash_with_nonce(broker_pk.as_ref(), secret_nonce);
		let sender_pk_hash = Self::hash_with_nonce(sender_pk.as_ref(), secret_nonce);

		let mut recipients_hash = blake2::Blake2s256::new();
		for recipient in recipients {
			let recipient_pk_hash = Self::hash_with_nonce(recipient.as_ref(), secret_nonce);
			Update::update(&mut recipients_hash, recipient_pk_hash.as_ref());
		}
		Update::update(&mut recipients_hash, secret_nonce.as_ref());

		let mut entries_hash = blake2::Blake2s256::new();
		for MessageEntry { key, value, kind: _ } in &message.entries {
			let key_hash = Self::hash_with_nonce(key.as_ref(), secret_nonce);
			let value_hash = Self::hash_with_nonce(value.as_ref(), secret_nonce);
			Update::update(&mut entries_hash, &key_hash);
			Update::update(&mut entries_hash, &value_hash);
		}
		Update::update(&mut entries_hash, secret_nonce.as_ref());

		Update::update(&mut hash, &origin_hash);
		Update::update(&mut hash, &public_nonce_hash);
		Update::update(&mut hash, &secret_nonce_hash);
		Update::update(&mut hash, &broker_pk_hash);
		Update::update(&mut hash, &sender_pk_hash);
		Update::update(&mut hash, &recipients_hash.finalize());
		Update::update(&mut hash, &entries_hash.finalize());
		hash
	}

	pub fn hash_with_nonce(data: &[u8], nonce: &Nonce) -> Vec<u8> {
		let mut hash = blake2::Blake2s256::new();
		Update::update(&mut hash, data);
		Update::update(&mut hash, nonce.as_ref());
		hash.finalize().to_vec()
	}

	/// Decrypt metadata channels that are possible to decrypt and return
	pub fn decrypt(&self, receiver_sk: &SecretKey) -> Result<Self, CypherError> {
		let public_nonce = Nonce::try_from_slice(&self.nonce)?;
		let broker_pk = PublicKey::try_from_slice(&self.broker)?;

		let mut channels = vec![];

		for channel in &self.channels {
			let secret_nonce = match channel.nonce.decrypt(&public_nonce, &broker_pk, receiver_sk) {
				Ok(nonce) => Nonce::try_from_slice(&nonce)?,
				_ => {
					// can't decrypt - not receiver's entry, try next one
					continue
				},
			};

			channels.push(Channel {
				nonce: secret_nonce.0.into(),
				parties: channel
					.parties
					.iter()
					.map(|p| p.decrypt(&secret_nonce, &broker_pk, receiver_sk))
					.collect::<Result<_, _>>()?,
			});
		}

		Ok(MessageMetadata { channels, ..*self })
	}
}

#[cfg(test)]
mod tests {
	use super::*;
	use crate::messages::{Message, MessageEntry, MessageType};
	use nolik_cypher::Cypher;
	use sp_keyring;
	use subxt::utils::AccountId32;

	#[test]
	fn encrypt_decrypt_with_metadata() {
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

		let signer: AccountId32 = sp_keyring::sr25519::Keyring::Alice.public().into();
		let (encrypted_metadata, secret_nonce) =
			MessageMetadata::new_encrypted(&signer, &nonce, &sender_pk, &[&receiver_pk], &message);

		let encrypted_message = message.encrypt(&secret_nonce, &receiver_pk, &sender_sk);

		let decrypted_metadata = encrypted_metadata.decrypt(&receiver_sk).unwrap();

		let decrypted_secret_nonce = Nonce::try_from_slice(
			&decrypted_metadata.channels.first().expect("Couldn't decrypt any channel").nonce,
		)
		.unwrap();
		assert_eq!(decrypted_secret_nonce, secret_nonce);

		let receiver_message =
			encrypted_message.decrypt(&secret_nonce, &sender_pk, &receiver_sk).unwrap();
		assert_eq!(message, receiver_message);
	}
}
