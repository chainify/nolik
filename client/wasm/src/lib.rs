mod utils;

use std::convert::TryInto;
use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

use crypto_box::{aead::Nonce, PublicKey, SalsaBox, SecretKey};
use js_sys::{Array, Map, Uint8Array};
use nolik_metadata::{Channel, Message, MessageEntry, MessageMetadata, MessageType};

fn js_value_to_array<const N: usize>(value: JsValue) -> Result<[u8; N], JsValue> {
	let value: Uint8Array = value.dyn_into()?;
	let value: [u8; N] = value
		.to_vec()
		.try_into()
		.map_err(|_| JsError::new(&format!("wrong size of a array {}", N)))?;
	Ok(value)
}

fn pubkey_from_slice(slice: &[u8]) -> Result<PublicKey, JsValue> {
	let data: [u8; 32] = slice
		.try_into()
		.map_err(|_| JsValue::from_str(&format!("Could't parse pubkey {:?}", slice)))?;
	Ok(PublicKey::from(data))
}

fn metadata_to_js_map(meta: &MessageMetadata) -> Map {
	let map = Map::new();

	let val = Uint8Array::from(meta.nonce.as_slice());
	map.set(&"nonce".into(), &JsValue::from(val));

	let val = Uint8Array::from(meta.broker.as_slice());
	map.set(&"broker".into(), &JsValue::from(val));

	let val = Uint8Array::from(meta.hash.as_slice());
	map.set(&"hash".into(), &JsValue::from(val));

	let channels = Array::new();
	for ch in &meta.channels {
		let channel = Map::new();
		let val = Uint8Array::from(ch.nonce.as_slice());
		channel.set(&"nonce".into(), &JsValue::from(val));

		let parties = Array::new();
		for par in &ch.parties {
			parties.push(&Uint8Array::from(par.as_slice()));
		}
		channel.set(&"parties".into(), &parties);

		channels.push(&channel);
	}
	map
}

fn js_map_to_metadata(map: Map) -> Result<MessageMetadata, JsValue> {
	let nonce = js_value_to_array::<24>(map.get(&"nonce".into()))?;
	let broker = js_value_to_array::<32>(map.get(&"broker".into()))?;
	let hash = js_value_to_array::<32>(map.get(&"hash".into()))?;

	let mut channels = vec![];
	let chans: Array = map.get(&"channels".into()).dyn_into()?;
	for ch in chans.iter() {
		let ch: Map = ch.dyn_into()?;
		let nonce = js_value_to_array::<24>(ch.get(&"nonce".into()))?;

		let mut parties = vec![];
		let parts: Array = map.get(&"parties".into()).dyn_into()?;
		for part in parts.iter() {
			let part: Uint8Array = part.dyn_into()?;
			parties.push(part.to_vec());
		}

		channels.push(Channel { nonce: nonce.into(), parties })
	}

	let meta = MessageMetadata { nonce, broker, hash, channels };
	Ok(meta)
}

#[wasm_bindgen]
pub fn new_encrypted_metadata(
	origin: &[u8],
	public_nonce: &[u8],
	sender_pk: &[u8],
	recipients: Array, // array of pubkeys
	message: Map,
) -> Result<Map, JsValue> {
	utils::set_panic_hook();

	let mut reps = vec![];
	for recipient in recipients.iter() {
		let pk = recipient.dyn_into::<Uint8Array>()?;
		let pk = PublicKey::from(pubkey_from_slice(&pk.to_vec())?);
		reps.push(pk);
	}

	let origin = PublicKey::from(pubkey_from_slice(origin.as_ref())?);
	let public_nonce = Nonce::<SalsaBox>::from_slice(public_nonce);
	let sender_pk = PublicKey::from(pubkey_from_slice(sender_pk.as_ref())?);

	let mut entries = vec![];
	let es: Array = message.get(&"entries".into()).dyn_into()?;
	for e in es.iter() {
		let e: Map = e.dyn_into()?;
		let key: Uint8Array = e.get(&"key".into()).dyn_into()?;
		let value: Uint8Array = e.get(&"value".into()).dyn_into()?;
		entries.push(MessageEntry {
			key: key.to_vec(),
			value: value.to_vec(),
			kind: MessageType::RawData,
		});
	}

	let (meta, secret_nonce) = MessageMetadata::new_encrypted(
		&origin,
		&public_nonce,
		&sender_pk,
		&reps.iter().collect::<Vec<_>>(),
		&Message { entries },
	)
	.map_err(|e| JsError::new(&format!("{}", e)))?;

	let map = metadata_to_js_map(&meta);

	let val = Uint8Array::from(secret_nonce.as_slice());
	map.set(&"secret_nonce".into(), &JsValue::from(val));

	Ok(map)
}

#[wasm_bindgen]
pub fn decrypt_metadata(metadata: Map, secret_key: Uint8Array) -> Result<Map, JsValue> {
	utils::set_panic_hook();

	let meta = js_map_to_metadata(metadata)?;
	let secret_key = js_value_to_array::<32>(secret_key.into())?;
	let meta = meta
		.decrypt(&SecretKey::from(secret_key))
		.map_err(|e| JsError::new(&format!("{}", e)))?;
	Ok(metadata_to_js_map(&meta))
}
