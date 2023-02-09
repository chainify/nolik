mod cypher;
mod messages;
mod metadata;

use parity_scale_codec::{Decode, Encode};
use sodiumoxide::crypto::{box_, box_::Nonce};
use sp_core::offchain::StorageKind;
use sp_keyring::AccountKeyring;
use std::sync::Arc;
use subxt::{
	client::default_rpc_client,
	error::Error as subxtError,
	rpc::{rpc_params, types, RpcClientT},
	tx::PairSigner,
	OnlineClient, PolkadotConfig,
};

use cypher::Cypher;
use messages::{Message, MessageEntry, MessageType};
use metadata::{polkadot, MessageMetadata, TryFromSlice};

fn to_hex(bytes: impl AsRef<[u8]>) -> String {
	format!("0x{}", hex::encode(bytes.as_ref()))
}

/// Fetch the raw bytes for a given storage key
pub async fn get_offchain_storage(
	client: Arc<dyn RpcClientT>,
	key: &[u8],
) -> Result<Option<types::StorageData>, subxtError> {
	let params = rpc_params![StorageKind::PERSISTENT, to_hex(key)];
	let res = client.request_raw("offchain_localStorageGet", params.build()).await?;
	let data = serde_json::from_str(res.get())?;
	Ok(data)
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
	tracing_subscriber::fmt::init();

	let url = "ws://127.0.0.1:9944";
	let client = Arc::new(default_rpc_client(url).await?);
	let api = OnlineClient::<PolkadotConfig>::from_rpc_client(client.clone()).await?;
	let signer = PairSigner::new(AccountKeyring::Alice.pair());

	let nonce = box_::gen_nonce();

	let (sender_pk, sender_sk) = box_::gen_keypair();
	let (receiver_pk, receiver_sk) = box_::gen_keypair();

	let message = Message {
		entries: vec![MessageEntry {
			key: "key".into(),
			value: "value".into(),
			kind: MessageType::default(),
		}],
	};

	let (encrypted_metadata, secret_nonce) = MessageMetadata::new_encrypted(
		signer.account_id(),
		&nonce,
		&sender_pk,
		&[&receiver_pk],
		&message,
	);

	let encrypted_message = message.encrypt(&secret_nonce, &receiver_pk, &sender_sk);

	let tx = polkadot::tx()
		.nolik()
		.send_message(encrypted_metadata.clone(), encrypted_message.encode());

	let events = api
		.tx()
		.sign_and_submit_then_watch_default(&tx, &signer)
		.await?
		.wait_for_finalized_success()
		.await?;

	let transfer_event = events.find_first::<polkadot::nolik::events::MessageSent>()?;

	if let Some(event) = transfer_event {
		println!("Message successfully sent: {event:?}");

		let decrypted_metadata = event.metadata.decrypt(&receiver_sk)?;

		let decrypted_secret_nonce = Nonce::try_from_slice(
			&decrypted_metadata.channels.first().expect("Couldn't decrypt any channel").nonce,
		)?;
		assert_eq!(decrypted_secret_nonce, secret_nonce);

		let receiver_data = get_offchain_storage(client.clone(), &event.key)
			.await?
			.ok_or("No off-chain data found")?;
		let receiver_message = Message::decode(&mut &receiver_data.0[..])?;
		let receiver_message = receiver_message.decrypt(&secret_nonce, &sender_pk, &receiver_sk)?;
		assert_eq!(message, receiver_message);
	} else {
		println!("Failed to find MessageSent Event");
	}

	Ok(())
}
