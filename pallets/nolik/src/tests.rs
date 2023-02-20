use crate::mock::*;
use frame_support::{assert_err, assert_ok, sp_io};
use nolik_metadata::{Channel, MessageMetadata};
use sp_runtime::{offchain::StorageKind, traits::BadOrigin};

use rand::{thread_rng, Rng};

#[test]
fn send_message() {
	let mut ext = new_test_ext();

	let mut rng = thread_rng();
	let metadata = MessageMetadata {
		nonce: rng.gen(),
		broker: rng.gen(),
		hash: rng.gen(),
		channels: vec![
			Channel {
				nonce: "encrypted_nonce_1".into(),
				parties: vec!["encrypted_pubkey11".into(), "encrypted_pubkey12".into()],
			},
			Channel {
				nonce: "encrypted_nonce_2".into(),
				parties: vec!["encrypted_pubkey21".into(), "encrypted_pubkey22".into()],
			},
		],
	};
	let message = "my_encrypted_message".as_bytes().to_vec();
	let address: u64 = 1;

	let counter: u128 = 0;
	let mut key = vec![];

	ext.execute_with(|| {
		// try to send unsigned
		assert_err!(
			Nolik::send_message(RuntimeOrigin::none(), metadata.clone(), message.clone()),
			BadOrigin
		);

		assert_eq!(Nolik::message_counter(), counter);
		assert_ok!(Nolik::send_message(RuntimeOrigin::signed(address), metadata, message.clone()));
		assert_eq!(Nolik::message_counter(), counter + 1);
		key = Nolik::derived_key(&address, counter);
	});

	ext.persist_offchain_overlay();

	ext.execute_with(|| {
		let data = sp_io::offchain::local_storage_get(StorageKind::PERSISTENT, &key);
		assert_eq!(data, Some(message));
	});
}
