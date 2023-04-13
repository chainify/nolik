# Pallet Nolik
A [Substrate](https://substrate.io) FRAME pallet for sending encrypted messages between blockchain accounts

## Overview
Nolik is a protocol for secure and verifiable data echange between parties that do not trust each other.
It is designed to connect people without any form of censorship or third-party control.

## Key Features
The protocol allows to:
* Communicate without a trusted third-party
* Start messaging without disclosing the identity
* Create an unlimited number of addresses (like emails)
* Stay protected from a middleware attack
* Protect messages from unauthorized access with a decentralized end-to-end encryption
* Prove that the message was sent at a particular date and time
* Prove that the message was sent by a particular sender
* Prove that the message was sent to a particular recipient or recipients
* Prove that the message was not modified
* Use different clients to get access to messages


### Substrate node with a built-in Nolik pallet
Feel free to download the Substrate blockchain with an embedded Nolik pallet.
```
git clone https://github.com/chainify/substrate-nolik-dev.git
```

### Using with UI
After launching the node go to [PolkadotJS](https://polkadot.js.org/apps) page.
In the top left corner, in the `DEVELOPMENT` section select the _Local Node_.
After a successful connection, you will be able to try out the extrinsics in the Nolik pallet.

Go to the `Developer` section in the top center of the page and select `Extrinsincs` menu and then chouse `nolik` extrinsic.

## Extrinsics

### SendMessage
Required parameters
- `MessageMetadata` - a structure that stands for message metatada, that includes encrypted sender snd recipients, as well a secret nonce to decrypt the message
- `message` - an ecrypted message represented as vector of bytes (Vec<u8>), which is going to be sagev to the local offchain storage.


## Testing
The main functionality is covered by unit tests.
To run the tests use the command:

`cargo test`