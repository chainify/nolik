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

    let encrypted_metadata = m.new_encrypted_metadata(signer, nonce, sender.public, [receiver.public], message);
    // console.log(encrypted_metadata);

    let secret_nonce = encrypted_metadata.get('secret_nonce');
    let encrypted_message = m.encrypt_message(message, secret_nonce, receiver.public, sender.secret);
    let decrypted_metadata = m.decrypt_metadata(encrypted_metadata, receiver.secret);
    let decrypted_secret_nonce = decrypted_metadata.get('channels')[0].get('nonce');

    console.assert(decrypted_secret_nonce.toString() === secret_nonce.toString());

    let receiver_message = m.decrypt_message(encrypted_message, secret_nonce, sender.public, receiver.secret);
    console.assert(JSON.stringify(message) === JSON.stringify(receiver_message));

    let reciever_entry = receiver_message.get('entries')[0];
    var dec = new TextDecoder("utf-8");

    console.assert(dec.decode(entry.get('key')), dec.decode(reciever_entry.get('key')));
    console.assert(dec.decode(entry.get('value')), dec.decode(reciever_entry.get('value')));
  })
  .catch(console.error);
