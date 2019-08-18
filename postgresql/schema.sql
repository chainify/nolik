create schema public;

comment on schema public is 'standard public schema';

alter schema public owner to chainify;

create table if not exists transactions
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
	attachment_hash varchar(255) not null
);

alter table transactions owner to chainify;

create index if not exists transactions_fee_asset_id_index
	on transactions (fee_asset_id);

create index if not exists transactions_recipient_index
	on transactions (recipient);

create index if not exists transactions_sender_index
	on transactions (sender);

create index if not exists transactions_asset_id_index
	on transactions (asset_id);

create index if not exists transactions_tx_id_index
	on transactions (cnfy_id);

create index if not exists transactions_attachment_hash_index
	on transactions (attachment_hash);

create index if not exists transactions_attachment_index
	on transactions (attachment);

create index if not exists transactions_timestamp_index
	on transactions (timestamp);

create table if not exists proofs
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

alter table proofs owner to chainify;

create unique index if not exists proofs_tx_id_proof_uindex
	on proofs (tx_id, proof);

create table if not exists cdms
(
	id varchar(255) not null
		constraint cdms_pk
			primary key,
	tx_id varchar(255) not null
		constraint cdms_transactions_id_fk
			references transactions
				on update cascade on delete cascade,
	recipient varchar(255) not null,
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
	fwd_message_hash varchar(255)
);

alter table cdms owner to chainify;

create index if not exists cdms_tx_id_index
	on cdms (tx_id);

create index if not exists cdms_recipient_index
	on cdms (recipient);

create index if not exists cdms_hash_index
	on cdms (message_hash);

create unique index if not exists cdms_tx_id_recipient_hash_thread_hash_uindex
	on cdms (tx_id, recipient, message_hash, thread_hash);

create table if not exists senders
(
	id varchar(255) not null
		constraint s_pk
			primary key,
	sender varchar(255),
	signature text,
	verified boolean default false,
	timestamp timestamp default CURRENT_TIMESTAMP,
	cdm_id varchar(255) not null
		constraint senders_cdms_id_fk
			references cdms
				on update cascade on delete cascade
);

alter table senders owner to chainify;

create index if not exists senders_sender_index
	on senders (sender);

create unique index if not exists senders_sender_signature_uindex
	on senders (sender, signature);

