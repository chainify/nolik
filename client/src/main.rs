use clap::Parser;
use crypto_box::{
	aead::{AeadCore, OsRng},
	PublicKey, SalsaBox, SecretKey,
};
use nolik_cypher::{Cypher, SalsaNonce};
use parity_scale_codec::{Decode, Encode};
use sp_core::{crypto::Pair, offchain::StorageKind};

use sp_keyring::AccountKeyring;
use std::{path::PathBuf, sync::Arc};
use subxt::{
	client::default_rpc_client,
	error::Error as subxtError,
	rpc::{rpc_params, types, RpcClientT},
	tx::PairSigner,
	OnlineClient, PolkadotConfig,
};

use nolik_cli::{polkadot, PolkadotMessageMetadata};
use nolik_metadata::{Message, MessageEntry, MessageType};

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

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
	/// Node address
	#[arg(long, default_value = "127.0.0.1")]
	host: String,

	/// Port
	#[arg(long, default_value_t = 9944)]
	port: u16,

	/// Message entries, message key is set to "key"
	#[arg(long)]
	entries: Option<Vec<String>>,

	/// Specify secretkey path to sign a message.
	#[arg(long, value_name = "PATH")]
	pub secretkey_path: PathBuf,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
	tracing_subscriber::fmt::init();
	let args = Args::parse();

	let secret = std::fs::read_to_string(args.secretkey_path)?;
	let secret = sp_core::sr25519::Pair::from_seed_slice(
		&hex::decode(secret.trim())
			.map_err(|e| format!("Could't decode secret from hex: {}", e))?,
	)
	.expect("Secreet seed is not valid");

	let url = format!("ws://{}:{}", args.host, args.port);
	let client = Arc::new(default_rpc_client(url).await?);
	let api = OnlineClient::<PolkadotConfig>::from_rpc_client(client.clone()).await?;
	let signer = PairSigner::new(secret);

	let nonce = SalsaBox::generate_nonce(&mut OsRng);

	let sender_sk = SecretKey::generate(&mut OsRng);
	let sender_pk = sender_sk.public_key();
	let receiver_sk = SecretKey::generate(&mut OsRng);
	let receiver_pk = receiver_sk.public_key();

	let message = Message {
		entries: vec![MessageEntry {
			key: "key".into(),
			value: "value".into(),
			kind: MessageType::default(),
		}],
	};

	let (encrypted_metadata, secret_nonce) = PolkadotMessageMetadata::new_encrypted(
		&PublicKey::from(AccountKeyring::Alice.public().0),
		&nonce,
		&sender_pk,
		&[&receiver_pk],
		&message,
	)?;

	let encrypted_message = message.encrypt(&secret_nonce, &receiver_pk, &sender_sk)?;

	let tx = polkadot::tx()
		.nolik()
		.send_message(encrypted_metadata.clone(), encrypted_message.encode());

	let sub_ext = api.tx().create_signed(&tx, &signer, Default::default()).await?;
	let events = sub_ext.submit_and_watch().await?.wait_for_finalized_success().await?;

	let transfer_event = events.find_first::<polkadot::nolik::events::MessageSent>()?;

	if let Some(event) = transfer_event {
		println!("Message successfully sent: {event:?}");

		let decrypted_metadata = event.metadata.decrypt(&receiver_sk)?;

		let decrypted_secret_nonce = SalsaNonce::from_slice(
			&decrypted_metadata.channels.first().expect("Couldn't decrypt any channel").nonce,
		);
		assert_eq!(decrypted_secret_nonce.as_slice(), secret_nonce.as_slice());

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
