# Pallet Nolik
A [Substrate](https://substrate.io) FRAME pallet for sending encrypted messages between blockchain accounts

> THIS IS A DEV VERSION!
> DO NOT USE IT IN PRODUCTION!

## Overview
Nolik is a protocol for delivering digital content for web 3.0.
It is designed to connect people without any form of censorship or third-party control.
That is possible due to a combination of blockchain and [IPFS](https://ipfs.io) technologies and a [serviceless](#serviceless) approach.

Pallet logic allows the creation of rules for programmable messages and embeds them to any Substrate-based chain.
With that, it is possible to control who to receive messages from on a cryptographic (blockchain) level.
That can be done due to the ability to create whitelists (or blacklists) of senders.

## Key Features
The protocol allows to:
* Communicate without servers or service as a third-party
* Start messaging without disclosing the identity
* Create an unlimited number of addresses (like emails)
* Stay protected from a middleware attack
* Protect messages from unauthorized access with a decentralized end-to-end encryption
* Prove that the message was sent at a particular date and time
* Prove that the message was sent from a particular sender and stay protected from a phishing attack
* Prove that the message was sent by a particular sender
* Prove that the message was sent to a particular recipient or recipients
* Prove that the message was not modified
* Attach tokens (like NFTs) to messages
* Use different clients to get access to messages

## ServiceLess
This approach stands for removing third parties or any form of centralization.

Key principles:
- No single point of failure
- No power of one human over another
- No need to trust the application

Regarding Nolik protocol, these rules work because:
- There are no back-end servers, domain names, apps in the store.
The message is composed, encrypted, sent, and received on the client-side.
The blockchain is used as a transport layer that broadcasts the IPFS hash.
The file with encrypted content is stored in the IPFS network.
- Encryption
  - Every piece of information is encrypted and can be decrypted only by participants of the conversation.
  That is guaranteed by a public-key encryption algorithm.
  - Encryption keys are generated on the client-side without third-party involvement or permission and no one can get access to them but you.
  - The public key of a user is his address at the same time.
- Sending permissions
  - The message can be sent and broadcasted only if the sender has a right to do it.
  The rights are set by the recipient and configured with a whitelist and a blacklist of senders.
  If the sender has a right to send the message it will be broadcasted through the network, otherwise, it will be rejected.
  - Create whitelists and blacklists or senders.
- Download the code from GitHub, compile it and use it.
No need to trust that the open-source code is similar to the downloaded app.

This simple but powerful combination allows communication between users without a third party.

## Installation

Include this line to `/runtime/Cargo.toml`
```
pallet-nolik = { version = "0.1.2-dev", default-features = false, git = "https://github.com/chainify/substrate-nolik-dev/tree/main/pallets/nolik" }
```
In the same file add
```
[features]
default = ["std"]
std = [
  //-- snip --//
  "pallet-nolik/std",
  //-- snip --//
]
```
Go to `/runtime/lib.rs` and include this line
```
pub use pallet_nolik;
```
Also include this block
```
parameter_types! {
    pub const MaxAddressOwners: u8 = 99;
    pub const MaxWhiteListAddress: u16 = 9999;
    pub const MaxBlackListAddress: u16 = 9999;
}

impl pallet_nolik::Config for Runtime {
    type Event = Event;
    type MaxAddressOwners = MaxAddressOwners;
    type MaxWhiteListAddress = MaxWhiteListAddress;
    type MaxBlackListAddress = MaxBlackListAddress;
}
```

You can find the basic pallet configuration in the `parameter_types!` block.
- `MaxAddressOwners` is for the maximum number of owners of a particular address
- `MaxWhiteListAddress` is for the maximum number of addresses in the whitelist of a particular address
- `MaxBlackListAddress` is for the maximum number of addresses in the blacklist of a particular address


### Substrate node with a built-in Nolik pallet
Feel free to download the Substrate blockchain with an embedded Nolik pallet.
```
git clone https://github.com/chainify/substrate-nolik-dev.git
```



### Run in Docker

You can also use Docker with everything set up.

First, install [Docker](https://docs.docker.com/get-docker/) and
[Docker Compose](https://docs.docker.com/compose/install/).

Then, in the [substrate-nolik-dev repo](https://github.com/chainify/substrate-nolik-dev.git) run the following command to start a single node development chain.

```
docker compose up -d
```

This command will download the [substrate-nolik-dev](https://hub.docker.com/r/chainify/substrate-nolik-dev) docker image, and then start a local development network. You can
also replace the default command
(`./target/release/node-nolik --dev --ws-external`)
by appending your own. A few useful ones are as follow.

```
# Compile the code
docker compose build

# Display and follow the logs
docker logs -f node-nolik -n 200
```

### Using with UI
After launching the node go to [PolkadotJS](https://polkadot.js.org/apps) page.
In the top left corner, in the `DEVELOPMENT` section select the _Local Node_.
After a successful connection, you will be able to try out the extrinsics in the Nolik pallet.

Go to the `Developer` section in the top center of the page and select `Extrinsincs` menu and then chouse `nolik` extrinsic.

## Extrinsics

### addOwner
Required parameters:
- `address` - a Blake2 128 Hash.
It's a hash of an address that should be owned by a particular account.
One address can have multiple owners.
The maximum number of owners is specified in `MaxAddressOwners` parameter.
Only the owner of an address can add new owners.
If an address does not have any owners anyone can become the owner.
The message can be sent only from an address that has an owner.
Each time the message is sent, the network validates the owner before broadcasting the message.

### addToWhiteList
- `addTo` - a Blake2 128 Hash.
It's a hash of an address that adds other addresses to its whitelist.
A whitelist is a set of addresses that have permission to send the message to a particular address.
If the whitelist is empty the message will be accepted from any sender unless it is not in the blacklist.
If the whitelist is not empty the message will be accepted only from addresses in list.
- `newAddress` - a Blake 128 Hash. It's a hash of an address that is going to be added to the white the list.
The same address cannot be on the whitelist and in the blacklist at the same time.

### addToBlackList
- `addTo` - a Blake2 128 Hash.
It's a hash of an address that adds other addresses to its blacklist.
A blacklist is a set of addresses that DO NOT have permission to send the message to a particular address.
If the blacklist is empty the message will be accepted from any sender unless there are no whitelist restrictions.
- `newAddress` - a Blake 128 Hash. It's a hash of an address that is going to be added to the blacklist.
The same address cannot be on the blacklist and in the whitelist at the same time.

### sendMessage
- `sender` - a Blake 128 Hash. It's a hash of an address that sends the message.
This address should be owned by the account.
If it is not owned the message will be rejected by the network.
- `recipient` - a Blake 128 Hash. It's a hash of an address that should receive the message.
The message will be received only if the sender has a right to send the message.
Those rights are controlled by the recipient through a whitelist and a blacklist of senders.
If the sender does not have a right to send the message it will be rejected by the network.
- `ipfsId` - an IPFS hash of a file that contains the message to the recipient.

## Testing
The main functionality is covered by unit tests.
To run the tests use the command:

`cargo test`

## Sample scenario
Use this sample scenario to try out the extrinsics.
1. Select `ALICE` as an account
2. Select `addOwner` method
3. Provide address `33955c59b47da83d1cade50f724a6993`
4. Sign and submit the transaction

Now Alice is the owner of `33955c59b47da83d1cade50f724a6993` address

5. Switch account to `BOB`
6. Select `addOwner` method
7. Provide address `de4bd602c18641eb56ee1104ba76c5f2`
8. Sign and submit the transaction
9. Provide another address `4d4c14c40d1b7ecb942455794693fa68`
10. Sign and submit the transaction

Now Bob is the owner of `de4bd602c18641eb56ee1104ba76c5f2` and `4d4c14c40d1b7ecb942455794693fa68` addresses

11. Switch back to `ALICE`
12. Select `addToBlackList` method
13. Provide `addTo` address `33955c59b47da83d1cade50f724a6993`
14. Provide `newAddress` address `de4bd602c18641eb56ee1104ba76c5f2`
15. Sign and submit the transaction
16. Select `addToWhiteList` method
17. Provide `addTo` address `33955c59b47da83d1cade50f724a6993`
18. Provide `newAddress` address `4d4c14c40d1b7ecb942455794693fa68`
19. Sign the transaction

At this point of time Alice added address `de4bd602c18641eb56ee1104ba76c5f2` to the blacklist and `4d4c14c40d1b7ecb942455794693fa68` address to the whitelist.

20. Switch back to `BOB`
21. Select `sendMessage` method
21. Provide `sender` address `de4bd602c18641eb56ee1104ba76c5f2`
22. Provide `recipient` address `33955c59b47da83d1cade50f724a6993`
23. Provide `ipfsId` hash `QmcpfNLr43wdKMLbJ4nu4yBDKDxQggSRcLVEoUYFcjJNZR`
24. Sign and submit the transaction

The transaction will fail because address `de4bd602c18641eb56ee1104ba76c5f2` is in the blacklist

25. Change `sender` address to `4d4c14c40d1b7ecb942455794693fa68`
26. Sign and submit the transaction

The message will be sent because `4d4c14c40d1b7ecb942455794693fa68` is in the whitelist

27. Switch account to `CHARLIE`
28. Sign and submit the same transaction

In this scenario `CHARLIE` wants to send the message on behalf of `BOB` providing `4d4c14c40d1b7ecb942455794693fa68` address.
The transaction will fail because `CHARLIE` does not own `4d4c14c40d1b7ecb942455794693fa68` address.



