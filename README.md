# Nolik


## Setup
Clone Nolik repository
 
`git clone https://github.com/chainify/nolik`

### Setting a bootstrap node
 
Pull docker images
 
`docker compose -f docker-compose.alice.yml pull`

Run Substrate ans IPFS nodes

`docker compose -f docker-compose.alice.yml up -d`

### Setting a client node
This node should run locally on your computer.

Pull docker images

`docker compose -f docker-compose.bob.yml pull`

Run Substrate ans IPFS nodes

`docker compose -f docker-compose.bob.yml up -d`
