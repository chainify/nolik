# Nolik Instant messenger

Nolik is a decentralized messegnger based on [CDM protocol](https://chainify.org/protocol.html). Feel free to try it out at [nolik.im](https://nolik.im)

Read the [article](https://medium.com/@chainify.org/this-is-what-you-need-to-know-about-messaging-and-a-truly-secure-protocol-fc629b67ef39) that describes the difference from other messaging platforms and the step-by-step getting started guide.


## Installation

Make sure that you have [Docker](https://docker.com) installed on your machine.

```
git clone git@github.com:chainify/nolik.git nolik
cd nolik
```

### Update the config files

For development environment update `web/.env`
For production environment update `web/.env.prod`

#### Issue your custom token

Use your custom token and update the ASSET_ID parameter. Please notice that your token should be issued at [Waves platform](https://wavesplatform.com) blockchain and must be enabled for [sponsorship](https://docs.wavesplatform.com/en/waves-client/assets-management/sponsored-transaction.html).

The sponsored token is used for payments of transaction fees. Currently at [Nolik](https://nolik.im) the transactions are paid by Chainify team and not by the user.

### Run the CDM engine

CDM engine is used a backend for Nolik. You can find installation manual [here](https://github.com/chainify/engine).

### Update environment credentials
1. In Docker compose files replace the `chainify` with your Docker Hub account.

2. Update `nginx/nginx.*.conf` files and change the server hosts to yours. 

3. Also update the SSL certificates names and paths or comment these lines in `nginx/Dockerfile`

```
COPY dhparam.pem /etc/nginx/dhparam.pem
COPY ssl_params.conf /etc/nginx/ssl_params.conf

COPY ssl/nolik.im.crt /etc/nginx/nolik.im.crt
COPY ssl/nolik.im.key /etc/nginx/nolik.im.key
```

### Run the containers
```
docker-compose build
docker-compose up -d
```

### Deploy your containers
```
docker-compose push
```

In production environment create the `docker-compose.yml` file and copy the content of `docker-compose.prod.yml` to it.
```
ssh root@yourserver.com
cd /opt
sudo nano docker-compose.yml
docker-compose pull
docker-compose up -d
```