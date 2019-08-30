'use strict';

const { transfer, broadcast } = require('@waves/waves-transactions')
const { verifySignature, address, base58Encode }= require('@waves/ts-lib-crypto');
const Base58 = require("base-58");

const express = require('express');
var cors = require('cors');
const formidableMiddleware = require('express-formidable');

// Constants
const PORT = 8080;
const HOST = '0.0.0.0';

// App
const app = express();

app.use(cors());
app.use(formidableMiddleware());

app.post('/sponsor', (req, res) => {

  const publicKey = process.env.CLIENT_PUBLIC_KEY;
  const signature = req.fields.signature;
  const ipfsHash = req.fields.ipfsHash;

  if (!publicKey || !signature) {
    res.status(400);
    res.json({ message: 'Public Key / Signature pair is not provided' })
  }

  if (!ipfsHash) {
    res.status(400);
    res.json({ message: 'IPFS Hash is not provided' })
  }

  const bytes = Uint8Array.from(publicKey);
  const verified = verifySignature(publicKey, bytes, signature);

  if (verified === false) {
    res.status(403);
    res.json({ message: 'Signature is not valid' });
  }

  const recipient = process.env.NETWORK === 'testnet' ? address(process.env.SPONSOR_SEED, 'T') : address(process.env.SPONSOR_SEED);
  const signedTranserTx = transfer({ 
    amount: 1,
    recipient: recipient,
    assetId: process.env.ASSET_ID,
    feeAssetId: process.env.ASSET_ID,
    chainId: process.env.NETWORK === 'testnet' ? 'T' : 'W',
    attachment: Base58.encode(Buffer.from(ipfsHash))
  }, process.env.SPONSOR_SEED);

  broadcast(signedTranserTx, process.env.NODE_URL)
    .then(tx => {
      res.json({tx: tx});
    })
    .catch(e => {
      console.log('Error', e);
      res.status(400)
      res.json({'error': e.message});
    })
});

app.listen(PORT, HOST);
console.log(`Spronsor is running on http://${HOST}:${PORT}`);