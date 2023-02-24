mod utils;

use std::convert::TryInto;
use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

use crypto_box::{
	aead::{AeadCore, Nonce, OsRng},
	PublicKey, SalsaBox, SecretKey,
};
use js_sys::{Array, Map, Uint8Array};
use nolik_metadata::{
	Channel, Cypher, Message, MessageAction, MessageEntry, MessageMetadata, MessageType, KEY_SIZE,
	NONCE_SIZE,
};

fn js_value_to_array<const N: usize>(value: JsValue) -> Result<[u8; N], JsValue> {
	let value: Uint8Array = value.dyn_into()?;
	let value: [u8; N] = value
		.to_vec()
		.try_into()
		.map_err(|_| JsError::new(&format!("wrong size of array {}", N)))?;
	Ok(value)
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
	map.set(&"channels".into(), &JsValue::from(channels));

	map
}

fn js_map_to_metadata(map: Map) -> Result<MessageMetadata, JsValue> {
	let mut channels = vec![];
	let chans: Array = map.get(&"channels".into()).dyn_into()?;
	for ch in chans.iter() {
		let ch: Map = ch.dyn_into()?;
		let nonce: Uint8Array = ch.get(&"nonce".into()).dyn_into()?;

		let mut parties = vec![];
		let parts: Array = ch.get(&"parties".into()).dyn_into()?;
		for part in parts.iter() {
			let part: Uint8Array = part.dyn_into()?;
			parties.push(part.to_vec());
		}

		channels.push(Channel { nonce: nonce.to_vec(), parties })
	}

	let nonce = js_value_to_array::<NONCE_SIZE>(map.get(&"nonce".into()))?;
	let broker = js_value_to_array::<KEY_SIZE>(map.get(&"broker".into()))?;
	let hash = js_value_to_array::<KEY_SIZE>(map.get(&"hash".into()))?;

	let meta = MessageMetadata { nonce, broker, hash, channels };
	Ok(meta)
}

fn message_from_js(map: Map) -> Result<Message, JsValue> {
	let mut entries = vec![];
	let es: Array = map.get(&"entries".into()).dyn_into()?;
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
	Ok(Message { entries })
}

fn message_to_js(message: &Message) -> Result<Map, JsValue> {
	let entries = Array::new();
	for entry in &message.entries {
		let e = Map::new();
		e.set(&"key".into(), &Uint8Array::from(entry.key.as_ref()));
		e.set(&"value".into(), &Uint8Array::from(entry.value.as_ref()));
		entries.push(&e);
	}

	let map = Map::new();
	map.set(&"entries".into(), &entries);
	Ok(map)
}

#[wasm_bindgen]
pub fn new_encrypted_metadata(
	origin: Uint8Array,
	public_nonce: Uint8Array,
	sender_pk: Uint8Array,
	recipients: Array, // array of pubkeys
	message: Map,
) -> Result<Map, JsValue> {
	utils::set_panic_hook();

	let mut reps = vec![];
	for recipient in recipients.iter() {
		let pk = recipient.dyn_into::<Uint8Array>()?;
		let pk = PublicKey::from(js_value_to_array::<KEY_SIZE>(pk.into())?);
		reps.push(pk);
	}

	let origin = PublicKey::from(js_value_to_array::<KEY_SIZE>(origin.into())?);
	let public_nonce = public_nonce.to_vec();
	let public_nonce = Nonce::<SalsaBox>::from_slice(public_nonce.as_slice());
	let sender_pk = PublicKey::from(js_value_to_array::<KEY_SIZE>(sender_pk.into())?);

	let (meta, secret_nonce) = MessageMetadata::new_encrypted(
		&origin,
		&public_nonce,
		&sender_pk,
		&reps.iter().collect::<Vec<_>>(),
		&message_from_js(message)?,
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
	let secret_key = js_value_to_array::<KEY_SIZE>(secret_key.into())?;
	let meta = meta
		.decrypt(&SecretKey::from(secret_key))
		.map_err(|e| JsError::new(&format!("{}", e)))?;
	Ok(metadata_to_js_map(&meta))
}

#[wasm_bindgen]
pub struct KeyPair(SecretKey);

#[wasm_bindgen]
impl KeyPair {
	#[wasm_bindgen(constructor)]
	pub fn new() -> KeyPair {
		KeyPair(SecretKey::generate(&mut OsRng))
	}

	#[wasm_bindgen(getter)]
	pub fn public(&self) -> Uint8Array {
		Uint8Array::from(self.0.public_key().as_ref())
	}

	#[wasm_bindgen(getter)]
	pub fn secret(&mut self) -> Uint8Array {
		Uint8Array::from(&self.0.as_bytes()[..])
	}
}

#[wasm_bindgen]
pub fn generate_nonce() -> Uint8Array {
	let nonce = SalsaBox::generate_nonce(&mut OsRng);
	Uint8Array::from(nonce.as_ref())
}

fn on_message(
	message: Map,
	nonce: Uint8Array,
	pk: Uint8Array,
	sk: Uint8Array,
	do_what: MessageAction,
) -> Result<Map, JsValue> {
	utils::set_panic_hook();

	let m = message_from_js(message)?;

	let nonce = nonce.to_vec();
	let nonce = Nonce::<SalsaBox>::from_slice(nonce.as_slice());
	let pk = PublicKey::from(js_value_to_array::<KEY_SIZE>(pk.into())?);
	let sk = SecretKey::from(js_value_to_array::<KEY_SIZE>(sk.into())?);

	let m = match do_what {
		MessageAction::Encrypt =>
			m.encrypt(nonce, &pk, &sk).map_err(|e| JsError::new(&format!("{}", e)))?,
		MessageAction::Decrypt =>
			m.decrypt(nonce, &pk, &sk).map_err(|e| JsError::new(&format!("{}", e)))?,
	};

	message_to_js(&m)
}

#[wasm_bindgen]
pub fn encrypt_message(
	message: Map,
	secret_nonce: Uint8Array,
	receiver_pk: Uint8Array,
	sender_sk: Uint8Array,
) -> Result<Map, JsValue> {
	on_message(message, secret_nonce, receiver_pk, sender_sk, MessageAction::Encrypt)
}

#[wasm_bindgen]
pub fn decrypt_message(
	message: Map,
	secret_nonce: Uint8Array,
	sender_pk: Uint8Array,
	receiver_sk: Uint8Array,
) -> Result<Map, JsValue> {
	on_message(message, secret_nonce, sender_pk, receiver_sk, MessageAction::Decrypt)
}
