// Note that a dynamic `import` statement here is required due to
// webpack/webpack#6615, but in theory `import { greet } from './pkg';`
// will work here one day as well!
const rust = import('./pkg');

rust
  .then(m => {
    let nonce = m.generate_nonce();
    let sender = new m.KeyPair();
    let receiver = new m.KeyPair();
    let signer = new m.KeyPair().public; // your wallet key

    var enc = new TextEncoder("utf-8");
    let message = new Map();
    let entry = new Map();
    entry.set('key', enc.encode('data info'));
    entry.set('value', enc.encode('my data'));
    message.set('entries', [entry]);

    let metadata = m.new_encrypted_metadata(signer, nonce, sender.public, [receiver.public], message);
    console.log(metadata);
  })
  .catch(console.error);
