#![cfg_attr(not(feature = "std"), no_std)]

mod messages;
mod meta;

pub use messages::{Message, MessageEntry, MessageType};
pub use meta::{Channel, MessageMetadata};
