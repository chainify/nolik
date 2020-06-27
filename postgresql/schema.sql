create table transactions
(
	id varchar(255) not null
		constraint transactions_pk
			primary key,
	height integer not null,
	type integer not null,
	sender varchar(255) not null,
	sender_public_key varchar(255) not null,
	recipient varchar(255) not null,
	amount bigint,
	asset_id varchar(255) default NULL::character varying,
	fee_asset_id varchar(255) default NULL::character varying,
	fee_asset varchar(255),
	fee bigint,
	attachment varchar(255),
	version integer not null,
	timestamp timestamp default CURRENT_TIMESTAMP not null,
	cnfy_id varchar(255),
	attachment_hash varchar(255) not null,
	sender_public_key_hash varchar(255)
);

create index transactions_fee_asset_id_index
	on transactions (fee_asset_id);

create index transactions_recipient_index
	on transactions (recipient);

create index transactions_sender_index
	on transactions (sender);

create index transactions_asset_id_index
	on transactions (asset_id);

create index transactions_tx_id_index
	on transactions (cnfy_id);

create index transactions_attachment_hash_index
	on transactions (attachment_hash);

create index transactions_attachment_index
	on transactions (attachment);

create index transactions_timestamp_index
	on transactions (timestamp);

create index transactions_sender_public_key_hash_index
	on transactions (sender_public_key_hash);

create table proofs
(
	tx_id varchar(255) not null
		constraint proofs_transactions_id_fk
			references transactions
				on update cascade on delete cascade,
	proof varchar(255),
	id varchar(255) not null
		constraint proofs_pk
			primary key
);

create unique index proofs_tx_id_proof_uindex
	on proofs (tx_id, proof);

create table cdms
(
	id varchar(255) not null
		constraint cdms_pk
			primary key,
	tx_id varchar(255) not null
		constraint cdms_transactions_id_fk
			references transactions
				on update cascade on delete cascade,
	recipient text not null,
	message text not null,
	message_hash varchar(255),
	timestamp timestamp default CURRENT_TIMESTAMP,
	thread_hash varchar(255) not null,
	blockchain varchar(255),
	network varchar(255),
	type varchar(2),
	subject text,
	subject_hash varchar(255),
	re_subject_hash varchar(255),
	re_message_hash varchar(255),
	fwd_subject_hash varchar(255),
	fwd_message_hash varchar(255),
	version varchar(255),
	recipient_hash varchar(255)
);

create index cdms_tx_id_index
	on cdms (tx_id);

create index cdms_hash_index
	on cdms (message_hash);

create index cdms_recipient_hash_index
	on cdms (recipient_hash);

create unique index cdms_tx_id_recipient_hash_thread_hash_uindex
	on cdms (tx_id, recipient_hash, message_hash, thread_hash);

create table senders
(
	id varchar(255) not null
		constraint s_pk
			primary key,
	sender text,
	signature text,
	verified boolean default false,
	timestamp timestamp default CURRENT_TIMESTAMP,
	cdm_id varchar(255) not null
		constraint senders_cdms_id_fk
			references cdms
				on update cascade on delete cascade,
	sender_hash varchar(255)
);

create unique index senders_signature_sender_hash_uindex
	on senders (signature, sender_hash);

create index senders_sender_hash_index
	on senders (sender_hash);

