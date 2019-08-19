# Nolik Instant messenger

Nolik is a decentralized P2P messegnger.

Unlike email or Slack, can:
* guarantee the sending and receiving of messages
* ensure that the content of messages is not accessed by third parties, even by the application developers teem 
* ensure that the sending time and content of the message will not be modified in the future
* accompany each message with a digital signature

Perfect use cases:
* corporate messaging
* private online consulting (for example medical/psychological chat)
* privacy-first communications (for example chat of a journalist with the source)
* making contracts remotely (because a digital signature is used for every message)

You can use the public version of Nolik a [https://nolik.im](https://nolik.im) or deploy private messenger in your environment.

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
2. Update `.env` file. Make sure to change `AHI_HOST`, `ASSET_ID`, and `POSTGRES_PASSWORD`. You can find a complete `.env` file description below.

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

## Closer look

Inside `nolik` directory you will see:
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

### Microservises

Nolik uses a microservice architecture which means that each service runs in a separate container. The structure of microservises is build in `docker-compose` files.

In the current architecture, all microservices run on the same node. That is done for easy and quick launch, however, the better option is to separate microservices in different nodes. For example, a bit complicated architecture would look like:

* **Node A**: Containers `nginx`, `web`
* **Nodes B, C**: Containers `parser`, `server`, `healthcheck` (from docker-compose files)
* **Nodes C, D, E**: Containers `ipfs` with replication
* **Hosting provider**: Services for `postgres`,  `redis` databases

#### Structure of a microservice

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
    - KEEPER_SECRET=${KEEPER_SECRET}
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

## DATABASE
POSTGRES_DB=chainify
POSTGRES_USER=chainify
POSTGRES_PASSWORD=chainify

## CLIENT
KEEPER_PREFIX=chainify
KEEPER_SECRET=nolik_dev_secret
```

##### Description

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

* **KEEPER_PREFIX** is a prefix for encryption and decryption of your messages.
* **KEEPER_SECRET** is a random string that is used for authentication in Waves Keeper.


<!-- *  **web** - a container for Nolik web-client. In development mode will run a local server and auto-refresh a page on code update. In production mode will build and run static invironment, which is much faster to use.
* **nginx** - a proxy -->

## Development and Production modes

 There are two options to run Nolik - `development` and `production` mode. To run Nolik in a particular environment you should configure `.env` file and run the proper `docker-compose` file.


### Running in production
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


#### Using SSL certificates
Issue SSL certificates and copy `domain.com.crt` and `domain.com.key` files to `ssl` directory
```
cd ./nolik/nginx/ssl
nano domain.com.crt
nano domain.com.key
```

#### Start production environment
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
This project is licensed under the MIT license, Copyright (c) 2019 Amir Boziev. For more information see LICENSE.md.