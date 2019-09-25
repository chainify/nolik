# Nolik Instant messenger

Nolik is a decentralized P2P messegnger.

Unlike email or Slack, can:
* guarantee the sending and receiving of messages
* ensure that the content of messages is not accessed by third parties, even by the application developers team
* ensure that the sending time and content of the message will not be modified in the future
* accompany each message with a digital signature
* create a local copy of your encrypted files

Perfect use cases:
* corporate messaging
* private online consulting (for example medical/psychological chat)
* privacy-first communications (for example chat of a journalist with the source)
* making contracts remotely (because a digital signature is used for every message)

You can use the public version of Nolik a [https://nolik.im](https://nolik.im) or deploy private messenger in your environment.

### Chainify IPFS nodes:
* /ip4/165.22.150.171/tcp/4001/ipfs/QmUTByvwDUfbPbrvNs7PGRkitvwsUbtpGxE8XFSdUYdcw2
* /ip4/206.81.23.202/tcp/4001/ipfs/QmZwT8BebHoQFjcBLMR6Y3novMqD9Q8bz13oC5v3yfUBGx

## Content
* [Quick Start](https://github.com/chainify/nolik#quick-start)
* [CDM Protocol](https://github.com/chainify/nolik#cdm-protocol)
  * [How it works](https://github.com/chainify/nolik#how-it-works)
  * [CDM file sample](https://github.com/chainify/nolik#cdm-file-sample)
  * [CDM file structure](https://github.com/chainify/nolik#cdm-file-structure)
  * [Proofs](https://github.com/chainify/nolik#proofs)
* [Microservices architecture](https://github.com/chainify/nolik#microservices-architecture)
  * [Microservices description](https://github.com/chainify/nolik#microservices-description)
  * [Configuration of a microservice](https://github.com/chainify/nolik#configuration-of-a-microservice)
  * [Stucture of .env file](https://github.com/chainify/nolik#stucture-of-env-file)

* [Production mode](https://github.com/chainify/nolik#production-mode)
  * [SSL Setup](https://github.com/chainify/nolik#ssl-setup)
  * [IPFS Configuration](https://github.com/chainify/nolik#ipfs-configuration)
  * [PostgreSQL configuration](https://github.com/chainify/nolik#postgresql-configuration)
  * [Start production environment](https://github.com/chainify/nolik#start-production-environment)
* [License](https://github.com/chainify/nolik#licence)

## Quick start

Current architecture needs [Docker](https://docker.com) to be installed on your machine. Docker will be used for running microservices in separate containers. It is also a great tool to make sure that the application works on every platform.

### Install docker on Ubuntu
```
apt-get update
apt-get install -y docker.io
apt-get install -y docker-compose
```
For other platforms check the docker guides at [https://docs.docker.com/install/](https://docs.docker.com/install/)


### Clone Nolik repository

Pick any directory, for example, `/opt`. 

```
cd /opt
git clone https://github.com/chainify/nolik.git nolik
cd nolik
```

### Issue you custom token at Waves Platform blockchain
To issue tokens you  will need to pay 1 WAVES. 

1. Create an account if needed. Use this [official guide](https://docs.wavesplatform.com/en/waves-client/account-management/creating-an-account.html). You can get free testnet WAVES tokens at the [official faucet](https://wavesexplorer.com/testnet/faucet).
2. Get WAVES token. Use this [official guide](https://wavesplatform.com/products-token).
2. Issue your token. Use this [official guide](https://docs.wavesplatform.com/en/waves-client/assets-management/issue-an-asset.html).
2. Upgrade your token to `sponsored` status. Use this [official guide](https://docs.wavesplatform.com/en/waves-client/assets-management/sponsored-transaction.html). It is up to you which amount per transaction (per 0.001 WAVES) to choose. At Chainify we  use 0.001 CNFY per 0.001 WAVES.

### Configure the environment
1. Replace `nolik.loc` with your host is needed.
2. Update `.env` file. Make sure to change `API_HOST`, `ASSET_ID`, and `POSTGRES_PASSWORD`. You can find a complete `.env` file description below.
3. Create local foldersfor IPFS storage
```
cd ~
mkdir .data && cd .data
mkdir nolik && cd nolik
mkdir ipfs && cd ipfs
mkdir data staging
```
If you chouse another location make sure to update `docker-compose.yml` file and change IPFS volumes parameters:
```
ipfs:
    image: ipfs/go-ipfs:latest
    container_name: nolik-ipfs
    volumes:
      - ~/.data/nolik/ipfs/data:/data/ipfs
      - ~/.data/nolik/ipfs/staging:/export
```

### Start containers in development mode
```
docker-compose build
docker-compose up -d
```

### Create Postgresql schema
1. Connect to postgresqldatabase with your favorit IDE
2. Run SQL scripts from https://github.com/chainify/nolik/blob/master/postgresql/schema.sql

### Check that parser works
Display parser container output
```
docker logs -f nolik-parser --tail 200
```
If everithong installed correclry you sould see something like this
```
[2019-08-18 13:54:55 +0000] [1] [INFO] Goin' Fast @ http://0.0.0.0:8080
[2019-08-18 13:54:55 +0000] [9] [INFO] Autostart Success!
[2019-08-18 13:54:55 +0000] [9] [INFO] CDM Version: 0.7
[2019-08-18 13:54:55 +0000] [9] [INFO] Starting worker [9]
[2019-08-18 13:54:55 +0000] [9] [INFO] Start height: 636605, last block: 636655
[2019-08-18 13:54:55 +0000] [9] [INFO] ----------------------------------------
[2019-08-18 13:54:55 +0000] [9] [INFO] Height range 636605 - 636610
[2019-08-18 13:54:56 +0000] [9] [INFO] Saved 2 transactions
[2019-08-18 13:54:56 +0000] [9] [INFO] Parsing time: 0.3797760009765625 sec
[2019-08-18 13:54:56 +0000] [9] [INFO] ----------------------------------------
```
`Saved 2 transactions` means that diring last 5 blocks 2 (or n) 2 transactions colored with your custom token were parsed.

You can visit your Nolik client and send your first message.

## CDM protocol

CDM (Chainify Decentralized Messaging) protocol is designed for privacy-first communicatoins.

The protocol allows:

1. To deliver messages with 100% guarantee as to delivery with no central server involved.
2. To use end-to-end encryption without a central server.
3. Validate the sender with the digital signature.
3. To store messages securely forever and for free.
for anyone to verify that a message (i) was dispatched by a particular user, (ii) was actually delivered.
4. Access to messages only for sender and recipient (no third-parties involvement).
5. Access to messaging through an unlimited number of interfaces or clients from various vendors.

### How it works

1. Alice and Bob are going to have a conversation using Nolik. Each of them already installed the [Waves Keeper](https://wavesplatform.com/products-keeper) browser extension and created accounts. To use Nolik Alice and Bob simply log in with Waves Keeper and get personalized content without any registration.
2. Alice needs to know Bob's public key, which she can get directly from Bob or public sources.
3. Alice wrights a message and encrypts it with Bob's public key. To do that Alice creates a shared key based on Diffie Hellman algorithm.
4. Alice creates a CDM file of a certain structure (an example is below).
5. Alice saves that file to IPFS network and gets the IPFS hash (a unique hash based on file content). That hash is also used to read file content in IPFS network.
6. That IPFS hash is attached to the blockchain transaction and broadcasts to the blockchain network. That transaction is *colored* with a custom token (at Chainify we use [CNFY token](https://wavesexplorer.com/tx/6U3wmEJQzoeeYmCLvwCEWwQY17HwXLRYiMnST9wKBSL5)). Coloring allows to pick relevant transactions, parse them and save them to the database.
7. Bob receives the transaction, which is delivered by API and decodes it with Waves Keeper extension.

### CDM file sample

CDM file is a regular XML file with a certain structure. The file is saved to IPFS network and can be reached with a unique address which is generated based on the file content. The same file content will generate the same address (IPFS Hash).

CDM file example: [https://nolik.im/ipfs/QmYLWaaWKesqGTdRjggLkRa25xgBZVqWi56tyfKqpD3pU6](https://nolik.im/ipfs/QmYLWaaWKesqGTdRjggLkRa25xgBZVqWi56tyfKqpD3pU6)


```
<?xml version="1.0"?>
<cdm>
    <version>0.7</version>
    <blockchain>Waves</blockchain>
    <network>Mainnet</network>
    <messages>
        <message>
            <subject>
                <ciphertext>
                  f43y5Mc88CS7cE8AXWGU7h9RbgqnUWwJW1j1w9RYDGKJgTk1pgq99VSHiyev2hd5QtrDKtj6AktCnH5njCPrGWqpmZZubdviqNCEsMGNGrFAjVEwRm4WCVwHoqjXRjsMaBafcYWfBddxc22q6Rhfbe1ioXPWnv9mPLBPmptLyu5nU8yMXFMBBURSS87QuZyoX8iWGkswzCNtaiMBeJ8LXfw21WcV5PH4eT2UEFreooHY1shejC25ZjzWTuK4uj2jYrgF7dGkUBWG72rZUocpcaAztJYt3sRKFrWK1AY8JUhocmQSMUFXWDy5ebbLb
                </ciphertext>
                <sha256>
                  32a5ffa09db0d79f5c688bd7873872f63e1c83554459ee4212833378700263c5
                </sha256>
            </subject>
            <cc>
                <publickey>
                  cEdRrkTRMkd61UdQHvs1c2pwLfuCXVTA4GaABmiEqrP
                </publickey>
            </cc>
            <body>
                <ciphertext>
                  ZTxLXhXZfKvybjxMqj1kQkkyt8RYtVkXTGNCQm3PS84cyMoDSCjRGczGJPtAnzC1EYhT7Doaw7r3CvaSz1prP9jEjuxJRrh8csWYdx2MSw59htUhdQEc3K4MPkbQJDPUp2vFzWwaF1xPFWcexstv34tMa29XNNafesN93jeMoejcVFXrcw8nV8qKHmdxPUXmeSBwnC2YXKn3zFUYXRU8iYKe4YnLsgdjLzdmR1RVnMEm5ntSSH56dkgZztFWTW3SHgWNMZ6Ndb4L2giE6csTXz3y7qMFNiEXgZMxoC4j6NBD7Wmaqiw7Xx7aK7sBwa3dujsQkFHMF7ni
                </ciphertext>
                <sha256>
                  42664969222d1c0d3f0c39d456085598baf1a9a92945e6a6c07dd281ce8d9603
                </sha256>
            </body>
            <regarding>
                <subjecthash>
                  195a2c235dbf2e810351e2bd7854d932c9f4e9af594141770f37a7a6ba2b8009
                </subjecthash>
                <messagehash>
                  4f82a327abe79be67dfa128efe275b8f49dbb6392385fd658bebcb1e6be60f25
                </messagehash>
            </regarding>>
            <forwarded>
                <subjecthash>
                  d39c9c8b36aec904cd11b7608d19a531bae328c0759bd93c9a9246c8cccd70ec
                </subjecthash>
                <messagehash>
                  42664969222d1c0d3f0c39d456085598baf1a9a92945e6a6c07dd281ce8d9603
                </messagehash>
            </forwarded>
        </message>
    </messages>
</cdm>
```

#### CDM file structure

* **version** - a version of CDM protocol.
* **blockchain** - a blockchain provider. CDM protocol is blockchain-agnostic.
* **network** - a network type `mainnet`, `testnet` or `private`.
* **messges** - list of messages to send. CDM protocol allows having `one-to-one`, `one-to-many`, `many-to-many` conversation.
* **message** - a block which will be stored a separate message.
* **subject** - a subject of a message. 
  * **ciphertext** - the subject encrypted with recipient's public key.
  * **sha256** - the SHA256 hash of original unencrypted subject. Can be used for validating that the sent information was not modified. It can also be used for making sure that every recipient received the same subject.
* **body** - a subject of a message.
  * **ciphertext** - the message text encrypted with recipient's public key. 
  * **sha256** - the SHA256 hash of original unencrypted message text. Can be used for validating that the sent information was not modified. It can also be used for making sure that every recipient received the same message text.
* **to** - a `direct` recipient of a message.
  * **publickey** - the public key of the recipient.
* **cc** - a recipient that is informed with a `carbon copy`.
  * **publickey** - the public key of the recipient.
* **regarding** - the message that is `replied` with the current message.
  * **subjecthash** - the SHA256 of the subject.
  * **messagehash** - the SHA256 of the message text.
* **forwarded** - the message that is `forwarded` with the current message.
  * **subjecthash** - the SHA256 of the subject.
  * **messagehash** - the SHA256 of the message text.


It is important to mention that `subject` and `message text` are salted with a random SHA256 hash, which is attached at the end of the text.

For example
```
Hello, how are you?@135b1943bf9f50622d0b6ac8dd924f897447c4d894c405386966d0e5ee6e469a
```
That is done for better security. Without salt, it would be possible to hack the conversation with brute-forcing, because hash of the phrase `Hello, how are you?` will always be the same. The `@135b1943bf9f50622d0b6ac8dd924f897447c4d894c405386966d0e5ee6e469a` part can be easily removed on the client side.

### Proofs

With CDM protocol it is possible to cryptographically prove that:
1. That Nolik (or anybody else) has access to the content of messages. Every CDM file is public and can be reviewed by anyone. The content of `subject` and `body` fields is encrypted. Nolik as a service provider did not generate and distribute encryption keys and does not store any encryption keys as well. Alice can double-check that Nolik did not modify data by validating the signature. Also, Alice and Bob can deploy a personal version of Nolik.
2. The message was sent by Alice and only Alice. The IPFS hash is attached to the blockchain transaction which is signed by Alice. It means that anyone can validate the signature knowing the transaction data, the signature and Alice's public key. All that information is publicly available. Example: [https://wavesexplorer.com/tx/5e9Vj6hqpQxmzkDBSMW9WN8uz16U6jRNXSAkLDnvDCKJ](https://wavesexplorer.com/tx/5e9Vj6hqpQxmzkDBSMW9WN8uz16U6jRNXSAkLDnvDCKJ)
3. The message was sent on a particular date. Every transaction is part of a particular block with a particular height (serial number). Each block is generated periodically based on blockchain architecture and consensus algorithm. It is publicly known when each block isgenerated and added to the distributed ledger. Example: [https://wavesexplorer.com/blocks/1666988](https://wavesexplorer.com/blocks/1666988)
4. The message was not modified. The blockchain transaction is stored forever on every blockchain node, and cannot be deleted or modified.
5. The message was sent by Alice and received by Bob. The CDM file is attached to the blockchain transaction, which can be reviewed by anyone. If the CDM file is publicly available it means that anyone can see it, which proves:
  * that the message that was sent by Alice
  * that the message that was sent to Bob or Bob, Carol, and Dave
  * that the message has a particular content (can be checked with SHA256 algorithm)
6. The message was replied or forwarded. Each message is salted and has a unique hash. If the message is replied or forwarded, the same hash will appear in the CDM file, that is attached to a new blockchain transaction.


## Microservices architecture

Nolik uses a microservice architecture which means that each service runs in a separate container. The structure of microservises is build in `docker-compose` files. Feel free to modify microservices and update the code base. Here is the list of available microservices from `nolik` directory:
```
drwxr-xr-x 10 root root 4096 Aug 15 08:22 .
drwxr-xr-x  5 root root 4096 Aug 14 09:38 ..
-rw-r--r--  1 root root  428 Aug 14 10:52 .env
drwxr-xr-x  8 root root 4096 Aug 14 10:53 .git
-rw-r--r--  1 root root    0 Aug 14 09:38 .gitignore
-rw-r--r--  1 root root 2193 Aug 14 09:38 README.md
-rw-r--r--  1 root root 3567 Aug 14 10:52 docker-compose.prod.yml
-rw-r--r--  1 root root 3608 Aug 14 10:52 docker-compose.yml
drwxr-xr-x  2 root root 4096 Aug 14 09:38 ipfs
drwxr-xr-x  3 root root 4096 Aug 14 10:52 nginx
drwxr-xr-x  3 root root 4096 Aug 14 09:38 parser
drwxr-xr-x  2 root root 4096 Aug 14 09:38 postgresql
drwxr-xr-x  2 root root 4096 Aug 14 09:38 redis
drwxr-xr-x  4 root root 4096 Aug 14 09:43 server
drwxr-xr-x  9 root root 4096 Aug 14 10:08 web
```

In the current architecture, all microservices run on the same node. That is done for easy and quick launch, however, the better option is to separate microservices in different nodes. For example, a bit complicated architecture would look like:

* **Node A**: Load balancer
* **Nodes B, C, D**: Containers `nginx`, `web`, `parser`, `server`, `ipfs` with replication, `healthcheck` (from docker-compose files)
* **Hosting provider**: Services for `postgres`,  `redis` databases

### Microservices description

* **web** - is a web client for Nolik. It is built with Next.js and Mobx frameworks. In development mode this container uses web sockets, and as a default uses 3001 port for that. It can be configured in `.env` file. In development mode, web-client will run a local server and auto-refresh a page on code update. In production mode, web-client will build and run the static files, which is much faster option. To use Nolik, each user has to install Waves Keeper - a browser extension that securely stores private keys. The incoming and outgoing messages are encrypted and decrypted on a client-side. For better performance, Nolik has a built-in caching layer based on LevelDB. Currently, users broadcast transaction directly from Nolik client.

* **server** - is an API endpoint for Nolik. It allows getting structured information about incoming and outgoing messages. API is also can be used for dropping client cache. In order to do that just update the `API_VERSION` parameter from `.env` file.

* **parser** - is a tool for finding your transactions in the blockchain and saving them to the database. The message is encrypted and Nolik does not know the decryption keys (only Alice and Bob know them and store them in Waves Keeper extension). Parser saves the blockchain transaction only to increasing productivity.

* **ipfs** - is an IPFS node that allows saving and storing files based on IPFS protocol. After successful saving IPFS endpoint returns a unique hash - the file address that is generated based on file content (same file => same hash). That address is used for reading the file content. The IPFS hash is attached to blockchain transaction that is broadcasted to the blockchain network.

* **postgresql** - is a Postgresql database that is used for storing parsed blockchain transactions. Blockchain allows not to worry about replication. In case of a database failure, the parser will recover the same information from the blockchain.

* **redis** - is a Redis database container, which is used for storing a set of online users.

* **nginx** is a proxy that allows accessing Nolik web client and IPFS node from outside of docker network. Inproduction mode nginx requires SSL certificates.

* **autoheal** is a container that checks the health of parser every 10 seconds and restarts it if something is wrong.

### Configuration of a microservice

In `docker-compose` file, each service has more or less the same structure. For example, this is a structure of a `web` container:

```
web:
  build: ./web
  image: chainify/nolik-web
  container_name: nolik-web
  volumes:
    - ./web:/opt
  environment:
    - CDM_VERSION=${CDM_VERSION}
    - ASSET_ID=${ASSET_ID}
    - CLIENT_SECRET=${CLIENT_SECRET}
    - API_HOST=${API_HOST}
    - NETWORK=${NETWORK}
    - WS_PORT=3001
  restart: unless-stopped
  networks:
    internal:
      ipv4_address: 10.7.0.3
  command: bash -c "npm install -y && npm run dev"
```

* **web** - is the name of a service. It is also used in `nginx` configuration files.
* **build** - is a folder of a microservice with a `Dockerfile` in it.
* **image** - is the name of a public container which is available at [Docker hub](https://hub.docker.com). It allows pulling built container using the `git pull` command.
* **container_name** - is just a name of the container in a list of running services which you can see running `docker ps` command. That is helpful if you need to remove or restart specific service.
* **volumes** - this option allows to mount a folder or a file from a local environment into a docker container. That will allow using the same files in different environments at the same time. In this example `./web:/opt` means mount everything inside `./web` folder to `/opt` folder inside a docker container.
* **environment** - the set of variables that are passed inside a docker container. A full list of variables and their description is available below.
* **restart** - the restart policy for docker container. The `unless-stopped` means that the container will be restarted automatically on every launch of Docker daemon unless it was not stopped manually. In production mode, the preferred option is `always`. Other options are described in [docker documentation](https://docs.docker.com/compose/compose-file/#restart).
* **networks** - is the configuration of a particular network for a microservice environment. In this case, we use an `internal` network with providing every container with a local IP address. That is done for a specific case - providing IPv4 address as a parameter for connection to IPFS node.

Another example is a `nginx` container from `docker-compose.prod.yml`.
```
nginx:
    build:
      context: ./nginx
      dockerfile: Dockerfile.prod
    image: chainify/nolik-nginx
    container_name: nolik-nginx
    ports:
      - 80:80
      - 443:443
    depends_on:
      - web
      - api
      - parser
      - ipfs
      - postgres
      - redis
    networks:
      internal:
        ipv4_address: 10.7.0.2
    restart: always
```

Mostly the parameters are the same, however, there are important differences.
* **build** - in this case, the `build` parameter has two child options:
  * **context** - same as earlier, it is just a folder of a microservice with a `Dockerfile` in it.
  * **dockerfile** - the name of specific Dockerfile for a particular environment. In this case, `nginx` container has two dockerfiles, for each environment type. For production mode, `Dockerfile.prod` is used.
* **ports** - a list of  ports available from a local server. Each port has a different scenario inside Nginx config files.
* **depends_on** - a list of containers that must be launched before nginx container starts;

A full list of container configuration flags and options is listed in [docker documentation](https://docs.docker.com/compose/compose-file/).

#### Microservices configuration in .env file
In `docker-compose` files, some containers have a list of `environment` options, for example, `ASSET_ID=${ASSET_ID}`. The left side `ASSET_ID` is the name of a variable that is passed to the docker container. The right part `${ASSET_ID}` is a reference to the `.env` file, which can be found in the root folder. Initially, it is preconfigured for a `development` mode.

```
## APP
ENV=development
API_HOST=http://nolik.loc
ORIGINS=http://nolik.loc,http://app.loc:3400
CDM_VERSION=0.7
API_VERSION=1.0.25
WS_PORT=3001

## BLOCKCHAIN
NETWORK=testnet
NODE_URL=https://testnodes.wavesnodes.com
ASSET_ID=3E81de4KGhDaAja8pvgxSoyr1JCSmu1xTReVpeo4EFA9
START_HEIGHT=636570

## POSTGRESQL DB
POSTGRES_DB=chainify
POSTGRES_USER=chainify
POSTGRES_PASSWORD=chainify

## REDIS DB
REDIS_URL=redis://redis

## CLIENT
CLIENT_PREFIX=chainify
CLIENT_SECRET=nolik_dev_secret
```

#### Stucture of .env file

* **ENV** defines your environment to be `development` or `production`.
* **API_HOST** is a URL of your API endpoint.
* **ORIGINS** is a list of valid hosts separated with a comma.
* **CDM_VERSION** is a version of a CDM protocol. It is used in `web`, `server` and `parser` containers. It is handy to update a protocol version in one place and make the change in different containers at the same time.
* **API_VERSION** the version of API. Useful for dropping cache on a client if some changes to API output are made.
* **WS_PORT** is a web socket port which is needed in development mode for Next.js framework.

* **NETWORK** defines your blockchain network type to be `testnet` or `mainnet`.
* **NODE_URL** the URL of Waves Blockchain node.
* **ASSET_ID** is an ID of your asset issued on Waves Platform.
* **START_HEIGHT** is a starting height for the parser to start with. It makes sense to start from the height of your token issuing.

* **POSTGRES_DB** the name of your Postgresql database.
* **POSTGRES_USER** your Postgresql user.
* **POSTGRES_PASSWORD** your Postgresql password.

* **REDIS_URL** your Redis database connection string.

* **CLIENT_PREFIX** is a prefix for encryption and decryption of your messages.
* **CLIENT_SECRET** is a random string that is used for authentication in Waves Keeper.

After updating `.env` file changes will take effect only after restarting related containers. You can easily do that with the following commands:
* For development mode:
```
cd ./nolik
docker-compose up -d
```
* For production mode:
```
cd ./nolik
docker-compose -f docker-compose.prod.yml up -d
```


<!-- *  **web** - a container for Nolik web-client. In development mode will run a local server and auto-refresh a page on code update. In production mode will build and run static invironment, which is much faster to use.
* **nginx** - a proxy -->

## Production mode

There are two options to run Nolik - `development` and `production` mode. To run Nolik in a particular environment you should configure `.env` file and run the proper `docker-compose` file.

Depending on your environment configuration you might need to update `server/config.ini` and `parser/congig.ini` files as well.

### SSL setup
The production environment is preconfigured to use SSL certificates with additional Diffie Hellman Ephemeral Parameters, which is a [recommended practice](https://raymii.org/s/tutorials/Strong_SSL_Security_On_nginx.html) for stronger security.

You can see the list of required files in `nolik/nginx/Dockerfile.prod`:
```
FROM nginx:latest

COPY nginx.prod.conf /etc/nginx/nginx.conf
COPY ssl_params.conf /etc/nginx/ssl_params.conf

COPY ssl/dhparam.pem /etc/nginx/dhparam.pem
COPY ssl/nolik.im.crt /etc/nginx/nolik.im.crt
COPY ssl/nolik.im.key /etc/nginx/nolik.im.key
```

Before you start create `ssl`  folder inside `nolik` folder:
```
cd ./nolik/nginx
mkdir ssl && cd ssl
```

#### Diffie Hellman Ephemeral Parameters
In order to generate DHE parameter run the folowing command:
```
openssl dhparam -out dhparam.pem 4096
```
Please keep in mind that this procedure is time-concuming.


#### Copy SSL certificates
Issue SSL certificates and copy `domain.com.crt` and `domain.com.key` files to `ssl` directory
```
cd ./nolik/nginx/ssl
nano domain.com.crt
nano domain.com.key
```

### IPFS configuration
It is a good practice to mount an external volume to your server. That will allow to resize and add an extra size to IPFS storage without stopping the container (depends on hosting provider).

In `docker-compose.prod.yml` file **REPLACE** `/mnt/volume_fra1_02/.ipfs/data` and `/mnt/volume_fra1_02/.ipfs/staging` with your actual volumes location.
```
ipfs:
    image: ipfs/go-ipfs:latest
    container_name: nolik-ipfs
    volumes:
      - /mnt/volume_fra1_02/.ipfs/data:/data/ipfs
      - /mnt/volume_fra1_02/.ipfs/staging:/export
```

In multi-node configuration IPFS nodes should be connected to each other and replicate saved data. Let's assume that we have two nodes: **Node A** nd **Node B**

#### Data replication

1. Get current IPFS node credentials by running
```
docker exec -it nolik-ipfs ipfs id
```
You should see similar output:
```
{
	"ID": "QmZwT8BebHoQFjcBLMR6Y3novMqD9Q8bz13oC5v3yfUBGx",
	"PublicKey": "CAASpgIwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDVMe1zPouKfgYU/5wEDJMUl78YcJXH8N8nQpz2MdEHSXpi24BX2Y62rvaJ8wmEaKtlQahx1p916JTA83aLxfYT1OEOQg9vCdNhD5fCaLfnlk99K6JYbpaCwt9UVy/vpxCPp6Iaekj+Tle3mC6CxGrg4gJstX/f7AofZtvJmepTegiwtpIGQO/dgjop/6lbE1Lm4Lh5f0x1P5mQ5qgRON6i5uB8VnEq+b2KXH4vWgSIFVBf4p+WmWykaCCgfWR/12SLTD48XIn6xHRElc/gOxIUXZ3BBMo7UmIPLTINVIFOHItfUAQKGk6fn71yXCTC5aGQJ66C73WcbBQ86wof9SCrAgMBAAE=",
	"Addresses": [
		"/ip4/127.0.0.1/tcp/4001/ipfs/QmZwT8BebHoQFjcBLMR6Y3novMqD9Q8bz13oC5v3yfUBGx",
		"/ip4/10.7.0.7/tcp/4001/ipfs/QmZwT8BebHoQFjcBLMR6Y3novMqD9Q8bz13oC5v3yfUBGx",
		"/ip4/206.81.23.202/tcp/4001/ipfs/QmZwT8BebHoQFjcBLMR6Y3novMqD9Q8bz13oC5v3yfUBGx"
	],
	"AgentVersion": "go-ipfs/0.4.22/",
	"ProtocolVersion": "ipfs/0.1.0"
}
```

Copy the following line:
```
/ip4/206.81.23.202/tcp/4001/ipfs/QmZwT8BebHoQFjcBLMR6Y3novMqD9Q8bz13oC5v3yfUBGx
```

Now connect to the Node B and connect to Node A:
```
docker exec -it nolik-ipfs ipfs bootstrap add /ip4/206.81.23.202/tcp/4001/ipfs/QmZwT8BebHoQFjcBLMR6Y3novMqD9Q8bz13oC5v3yfUBGx
docker exec -it nolik-ipfs ipfs swarm connect /ip4/206.81.23.202/tcp/4001/ipfs/QmZwT8BebHoQFjcBLMR6Y3novMqD9Q8bz13oC5v3yfUBGx
```
You should see the output:
```
connect QmZwT8BebHoQFjcBLMR6Y3novMqD9Q8bz13oC5v3yfUBGx success
```

2. Get IPFS node credentials for Node B
```
docker exec -it nolik-ipfs ipfs id
```
You will see the output with different node ID:
```
{
	"ID": "QmUTByvwDUfbPbrvNs7PGRkitvwsUbtpGxE8XFSdUYdcw2",
	"PublicKey": "CAASpgIwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQC6Tm75aUX9DYXq8Z9tpXVuIwOLWs91vyLrGUfQY+F4kwIqDZOD/D8JlnWbv84pFGjZj/VqZbF5UcaY7ybCYT+fOlO2Gz87pESxnZhBBFOCP5UXuLtUVpihaR9bzKCTHjshfSFk74yhV6S/BUiv0pl/9gMn18Y91scPJDRvhn4j+0AXk/XDrNZQl1e0SlgCmQRrO8R4Cv1Fichx7pPhakWDVXfWQEKBt9CuFk90cnPMdCaETKlbcno6UhS9BCweI/9VJLvWSUtkOye5MEFnWDG5imz1TYVTT13tn5KOISC08O917k9a1VTQv6PUfxlbFFYeDncGqxwf7DdL4x5xkSNjAgMBAAE=",
	"Addresses": [
		"/ip4/127.0.0.1/tcp/4001/ipfs/QmUTByvwDUfbPbrvNs7PGRkitvwsUbtpGxE8XFSdUYdcw2",
		"/ip4/10.7.0.7/tcp/4001/ipfs/QmUTByvwDUfbPbrvNs7PGRkitvwsUbtpGxE8XFSdUYdcw2",
		"/ip4/165.22.150.171/tcp/4001/ipfs/QmUTByvwDUfbPbrvNs7PGRkitvwsUbtpGxE8XFSdUYdcw2"
	],
	"AgentVersion": "go-ipfs/0.4.22/",
	"ProtocolVersion": "ipfs/0.1.0"
}
```
Copy the folowing line
```
/ip4/165.22.150.171/tcp/4001/ipfs/QmUTByvwDUfbPbrvNs7PGRkitvwsUbtpGxE8XFSdUYdcw2
```
3. Return to Node A and connect to Node B:
```
docker exec -it nolik-ipfs ipfs bootstrap add /ip4/165.22.150.171/tcp/4001/ipfs/QmUTByvwDUfbPbrvNs7PGRkitvwsUbtpGxE8XFSdUYdcw2
docker exec -it nolik-ipfs ipfs swarm connect /ip4/165.22.150.171/tcp/4001/ipfs/QmUTByvwDUfbPbrvNs7PGRkitvwsUbtpGxE8XFSdUYdcw2
```
You should see the output:
```
connect QmUTByvwDUfbPbrvNs7PGRkitvwsUbtpGxE8XFSdUYdcw2 success
```

You have connected IPFS Node A to IPFS Node B.

**IMPORTANT:** Every node should have a running `nolik-parser` container which will replicate data between nodes. For example, If the data initially will be saved to Node A, the parser on Node B will pull the IPFS file from Node A to Node B


### PostgreSQL configuration
If your environment uses a centralized database engine, which is a good idea if you have a cluster of nodes, make sure to configure `server/config.ini` and `parser/config.ini` files.

```
[DB]
host = YOUR_POSTGRESQL_DB_HOST
port = YOUR_POSTGRESQL_DB_PORT
sslmode = require
target_session_attrs = read-write

[app]
host = 0.0.0.0
port = 8080

[ipfs]
host = 10.7.0.7
port = 5001
```

In production mode, it is preconfigured to copy `ca-certificate.crt` file into `server` and `parser` containers. You can change or disable that by updating or commenting following lines in `server/Dockerfile.prod` and `parser/Dockerfile.prod`:

```
RUN mkdir /root/.postgresql
COPY ./.postgresql/ca-certificate.crt.crt /root/.postgresql/root.crt
```

### Start production environment
In `nolik` directory build docker images and start containers in production mode
```
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```
Check that all containers has been started
```
docker ps
```
If everything is fine you should see similar output:
```
CONTAINER ID        IMAGE                         COMMAND                  CREATED             STATUS                  PORTS                                                                              NAMES
65fc1006fcfb        chainify/nolik-nginx          "nginx -g 'daemon of…"   4 hours ago         Up 4 hours              0.0.0.0:80->80/tcp, 0.0.0.0:3001->3001/tcp                                         nolik-nginx
7bc8ba28afaa        chainify/nolik-api            "bash -c 'python3.7 …"   4 hours ago         Up 4 hours              8080/tcp                                                                           nolik-api
f12d0ab229e0        chainify/nolik-parser         "bash -c 'python3.7 …"   12 hours ago        Up 5 hours (healthy)    8080/tcp                                                                           nolik-parser
49a928d963c1        chainify/nolik-web            "bash -c 'npm instal…"   3 days ago          Up 26 hours             3000-3001/tcp                                                                      nolik-web
a6346d9e5e0a        chainify/nolik-postgres       "docker-entrypoint.s…"   4 days ago          Up 26 hours             0.0.0.0:5432->5432/tcp                                                             nolik-postgres
9aa91942778b        chainify/nolik-redis          "docker-entrypoint.s…"   5 days ago          Up 26 hours             6379/tcp                                                                           nolik-redis
a146de0ae78c        willfarrell/autoheal:latest   "/docker-entrypoint …"   5 days ago          Up 26 hours (healthy)                                                                                      nolik-autoheal
696d260f74a1        ipfs/go-ipfs:latest           "/sbin/tini -- /usr/…"   5 days ago          Up 26 hours             0.0.0.0:4001->4001/tcp, 0.0.0.0:5001->5001/tcp, 0.0.0.0:8080->8080/tcp, 8081/tcp   nolik-ipfs
```

## Licence
This project is licensed under the MIT license, Copyright (c) 2019 Chainify. For more information see LICENSE.md.