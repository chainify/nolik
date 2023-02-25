import * as wasm from "js-wasm";

let nonce = wasm.generate_nonce();
let sender = new wasm.KeyPair();
let receiver = new wasm.KeyPair();
let signer = new wasm.KeyPair().public; // your wallet key

var enc = new TextEncoder("utf-8");
let message = new Map();
let entry = new Map();
entry.set('key', enc.encode('data info'));
entry.set('value', enc.encode('my data'));
message.set('entries', [entry]);

let encrypted_metadata = wasm.new_encrypted_metadata(signer, nonce, sender.public, [receiver.public], message);
// console.log(encrypted_metadata);

let secret_nonce = encrypted_metadata.get('secret_nonce');
let encrypted_message = wasm.encrypt_message(message, secret_nonce, receiver.public, sender.secret);
let decrypted_metadata = wasm.decrypt_metadata(encrypted_metadata, receiver.secret);
let decrypted_secret_nonce = decrypted_metadata.get('channels')[0].get('nonce');

console.assert(decrypted_secret_nonce.toString() === secret_nonce.toString());

let receiver_message = wasm.decrypt_message(encrypted_message, secret_nonce, sender.public, receiver.secret);
console.assert(JSON.stringify(message) === JSON.stringify(receiver_message));

let reciever_entry = receiver_message.get('entries')[0];
var dec = new TextDecoder("utf-8");

console.assert(dec.decode(entry.get('key')), dec.decode(reciever_entry.get('key')));
console.assert(dec.decode(entry.get('value')), dec.decode(reciever_entry.get('value')));
