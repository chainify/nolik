//! Describes a message format and encryption/decryption primitives for it.
//! Encryption and decryption is done with a Diffie-Hellman algorithm.

use parity_scale_codec::{Decode, Encode};
use scale_info::TypeInfo;

#[allow(dead_code)]
#[derive(Debug, Encode, Decode, TypeInfo, Clone, PartialEq, Default)]
pub enum MessageType {
	#[default]
	RawData,
	File,
}

#[derive(Debug, Encode, Decode, TypeInfo, Clone, PartialEq)]
pub struct Message {
	pub entries: Vec<MessageEntry>,
}

#[derive(Debug, Encode, Decode, TypeInfo, Clone, PartialEq)]
pub struct MessageEntry {
	pub key: Vec<u8>,
	pub value: Vec<u8>,
	pub kind: MessageType,
}
