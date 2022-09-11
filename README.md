# Nolik

Nolik is a protocol that allows to send data from peer to peer without a third party.
To achieve that the protocol uses the combination of Blockchain and IPFS technologies.
The blockchain is build based on a [Substrate framework](https://github.com/chainify/substrate-nolik-dev.git) with a custom [pallet](https://github.com/chainify/pallet-nolik.git).
The project supported by Web3 Foundation Grant program.
To know more about the protocol feel free to check the [grant application](https://github.com/w3f/Grants-Program/blob/master/applications/Nolik.md) documentation.

To interact with the node, send and receive messages use [nolik-cli](https://github.com/chainify/nolik-cli.git) app.

### Important disclosure
This project is still in the development phase.
At this point it can be used as a proof of concept.
Feel free to try it out, but use it at your own risk.


## Setup
Clone Nolik repository
 
`git clone https://github.com/chainify/nolik`

### Setting a bootstrap node
 
Pull docker images
 
`docker compose -f docker-compose.alice.yml pull`

Run Substrate ans IPFS nodes

`docker compose -f docker-compose.alice.yml up -d`

This will run a PoA-based blockchain node with a validator role.
It will start generation blocks if at least one peer will connect to the node.

To print and follow the logs run

`docker logs -f nolik-node --tail 200`

After the node starts you can see the similar output in the logs:
```
2022-09-11 20:53:47 Substrate Node
2022-09-11 20:53:47 ✌️  version 0.1.3-dev-unknown
2022-09-11 20:53:47 ❤️  by Chainify <https://github.com/chainify>, 2017-2022
2022-09-11 20:53:47 📋 Chain specification: Local Testnet
2022-09-11 20:53:47 🏷  Node name: Alice
2022-09-11 20:53:47 👤 Role: AUTHORITY
2022-09-11 20:53:47 💾 Database: RocksDb at /tmp/alice/chains/local_testnet/db/full
2022-09-11 20:53:47 ⛓  Native runtime: node-nolik-100 (node-nolik-1.tx1.au1)
2022-09-11 20:53:49 Using default protocol ID "sup" because none is configured in the chain specs
2022-09-11 20:53:49 🏷  Local node identity is: 12D3KooWEyoppNCUx8Yx66oV9fJnriXwCcXwDDUA2kj6vnc6iDEp
2022-09-11 20:53:49 💻 Operating system: linux
2022-09-11 20:53:49 💻 CPU architecture: x86_64
2022-09-11 20:53:49 💻 Target environment: gnu
2022-09-11 20:53:49 💻 CPU: Intel(R) Xeon(R) CPU E5-2630 v4 @ 2.20GHz
2022-09-11 20:53:49 💻 CPU cores: 2
2022-09-11 20:53:49 💻 Memory: 1977MB
2022-09-11 20:53:49 💻 Kernel: 5.15.0-40-generic
2022-09-11 20:53:49 💻 Linux distribution: Ubuntu 22.04.1 LTS
2022-09-11 20:53:49 💻 Virtual machine: yes
2022-09-11 20:53:49 📦 Highest known block at #1465
2022-09-11 20:53:49 〽️ Prometheus exporter started at 127.0.0.1:9615
2022-09-11 20:53:49 Running JSON-RPC HTTP server: addr=127.0.0.1:9933, allowed origins=Some(["http://localhost:*", "http://127.0.0.1:*", "https://localhost:*", "https://127.0.0.1:*", "https://polkadot.js.org"])
2022-09-11 20:53:49 Running JSON-RPC WS server: addr=0.0.0.0:9944, allowed origins=Some(["http://localhost:*", "http://127.0.0.1:*", "https://localhost:*", "https://127.0.0.1:*", "https://polkadot.js.org"])
2022-09-11 20:53:49 creating instance on iface 172.18.0.3
2022-09-11 20:53:49 discovered: 12D3KooWRDHQNBDTKi69VkkcmnPtZpbJwrPEaXMowAju8TpRPPi3 /ip4/172.18.0.2/tcp/4001
2022-09-11 20:53:49 discovered: 12D3KooWRDHQNBDTKi69VkkcmnPtZpbJwrPEaXMowAju8TpRPPi3 /ip4/127.0.0.1/tcp/4001
2022-09-11 20:53:49 discovered: 12D3KooWRDHQNBDTKi69VkkcmnPtZpbJwrPEaXMowAju8TpRPPi3 /ip4/172.18.0.2/udp/4001/quic
2022-09-11 20:53:49 discovered: 12D3KooWRDHQNBDTKi69VkkcmnPtZpbJwrPEaXMowAju8TpRPPi3 /ip4/127.0.0.1/udp/4001/quic
2022-09-11 20:53:54 💤 Idle (2 peers), best: #1465 (0x9e7c…3551), finalized #1463 (0xc9a8…f3b8), ⬇ 1.3kiB/s ⬆ 1.3kiB/s
```

Please notice that this node has a Local Identity `12D3KooWEyoppNCUx8Yx66oV9fJnriXwCcXwDDUA2kj6vnc6iDEp`.
It is required to connect to the node from the Client node (see below).
Also notice that the node name is Alice with a role Authority.
The Idle (2 peers) output shows how many Client nodes are connected to the BootNode.

### Setting a client node
This node should run locally on your computer.

Pull docker images

`docker compose -f docker-compose.bob.yml pull`

Run Substrate ans IPFS nodes

`docker compose -f docker-compose.bob.yml up -d`

This will start a PoA-based blockchain node with a validator role. 
It will start generation blocks after connecting to the BootNode.

To print and follow the logs run

`docker logs -f nolik-node --tail 200`

After the node starts you can see the similar output in the logs:

```
2022-09-11 20:59:55 Substrate Node
2022-09-11 20:59:55 ✌️  version 0.1.3-dev-unknown
2022-09-11 20:59:55 ❤️  by Chainify <https://github.com/chainify>, 2017-2022
2022-09-11 20:59:55 📋 Chain specification: Local Testnet
2022-09-11 20:59:55 🏷  Node name: Bob
2022-09-11 20:59:55 👤 Role: AUTHORITY
2022-09-11 20:59:55 💾 Database: RocksDb at /tmp/bob/chains/local_testnet/db/full
2022-09-11 20:59:55 ⛓  Native runtime: node-nolik-100 (node-nolik-1.tx1.au1)
2022-09-11 20:59:56 You're running on a system with a broken `madvise(MADV_DONTNEED)` implementation. This will result in lower performance.
2022-09-11 20:59:59 Using default protocol ID "sup" because none is configured in the chain specs
2022-09-11 20:59:59 🏷  Local node identity is: 12D3KooWSApPpRFBJg6QiG1wupC5PPezKaHT5F33goffDSDXD2DM
2022-09-11 20:59:59 💻 Operating system: linux
2022-09-11 20:59:59 💻 CPU architecture: x86_64
2022-09-11 20:59:59 💻 Target environment: gnu
2022-09-11 20:59:59 💻 Memory: 7951MB
2022-09-11 20:59:59 💻 Kernel: 5.10.76-linuxkit
2022-09-11 20:59:59 💻 Linux distribution: Ubuntu 22.04.1 LTS
2022-09-11 20:59:59 💻 Virtual machine: no
2022-09-11 20:59:59 📦 Highest known block at #1525
2022-09-11 20:59:59 〽️ Prometheus exporter started at 127.0.0.1:9615
2022-09-11 20:59:59 Running JSON-RPC HTTP server: addr=127.0.0.1:9933, allowed origins=Some(["http://localhost:*", "http://127.0.0.1:*", "https://localhost:*", "https://127.0.0.1:*", "https://polkadot.js.org"])
2022-09-11 20:59:59 Running JSON-RPC WS server: addr=0.0.0.0:9944, allowed origins=Some(["http://localhost:*", "http://127.0.0.1:*", "https://localhost:*", "https://127.0.0.1:*", "https://polkadot.js.org"])
2022-09-11 20:59:59 creating instance on iface 172.28.0.2
2022-09-11 20:59:59 discovered: 12D3KooWQBxcvq7qHsPgE3hakuQmMWUZYFWjt1ssYXioeg341S9L /ip4/172.28.0.3/tcp/4001
2022-09-11 20:59:59 discovered: 12D3KooWQBxcvq7qHsPgE3hakuQmMWUZYFWjt1ssYXioeg341S9L /ip4/127.0.0.1/tcp/4001
2022-09-11 20:59:59 discovered: 12D3KooWQBxcvq7qHsPgE3hakuQmMWUZYFWjt1ssYXioeg341S9L /ip4/172.28.0.3/udp/4001/quic
2022-09-11 20:59:59 discovered: 12D3KooWQBxcvq7qHsPgE3hakuQmMWUZYFWjt1ssYXioeg341S9L /ip4/127.0.0.1/udp/4001/quic
2022-09-11 20:59:59 Accepting new connection 1/100
2022-09-11 21:00:04 💤 Idle (1 peers), best: #1527 (0xe40a…7f89), finalized #1525 (0x1224…400f), ⬇ 2.8kiB/s ⬆ 2.4kiB/s
```

Notice that the node name is Bob with a role Authority.
The Idle (1 peers) means that this Client node successfully connected to the BootNode.

To configure a custom network and connection to your BootNode update the command in the `docker-compose.bob.yml` file.

`command: bash -c "./target/release/node-nolik --ws-external --base-path /tmp/bob --chain local --bob --port 30333 --bootnodes /ip4/77.223.96.13/tcp/30333/p2p/12D3KooWEyoppNCUx8Yx66oV9fJnriXwCcXwDDUA2kj6vnc6iDEp --validator --rpc-methods=unsafe"`

You need to replace a BootNode IP `77.223.96.13` address and a BootNode ID `12D3KooWEyoppNCUx8Yx66oV9fJnriXwCcXwDDUA2kj6vnc6iDEp` with your configuration.

