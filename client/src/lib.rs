/// subxt metadata -f bytes > substrate_metadata.scale
#[subxt::subxt(
	runtime_metadata_path = "../client/substrate_metadata.scale",
	derive_for_all_types = "PartialEq, Clone"
)]
pub mod polkadot {}

use crypto_box::{PublicKey, SecretKey};
use metadata::{Channel, Message, MessageMetadata};
use nolik_cypher::{CypherError, SalsaNonce};
pub use polkadot::runtime_types::pallet_nolik::pallet::{
	Channel as PolkadotChannel, MessageMetadata as PolkadotMessageMetadata,
};

impl PolkadotMessageMetadata {
	pub fn new_encrypted(
		origin: &PublicKey,
		public_nonce: &SalsaNonce,
		sender_pk: &PublicKey,
		recipients: &[&PublicKey],
		message: &Message,
	) -> Result<(Self, SalsaNonce), CypherError> {
		let (meta, secret_nonce) =
			MessageMetadata::new_encrypted(origin, public_nonce, sender_pk, recipients, message)?;
		Ok((Self::from(meta), secret_nonce))
	}

	pub fn decrypt(&self, receiver_sk: &SecretKey) -> Result<Self, CypherError> {
		let meta = MessageMetadata {
			nonce: self.nonce,
			broker: self.broker,
			hash: self.hash,
			channels: self
				.channels
				.iter()
				.map(|c| Channel { nonce: c.nonce.clone(), parties: c.parties.clone() })
				.collect(),
		};

		let meta = meta.decrypt(receiver_sk)?;
		Ok(Self::from(meta))
	}

	pub fn from(meta: MessageMetadata) -> Self {
		PolkadotMessageMetadata {
			nonce: meta.nonce,
			broker: meta.broker,
			hash: meta.hash,
			channels: meta
				.channels
				.into_iter()
				.map(|c| PolkadotChannel { nonce: c.nonce, parties: c.parties })
				.collect(),
		}
	}
}
