import { Base64 } from 'js-base64';
import { fileFromSync } from "node-fetch";
import getRandomValues from "get-random-values";

const createInstance = async () => {
  const path = '../../../../target/wasm32-unknown-unknown/release/nolik_metadata.wasm';
  const mimetype = 'text/plain'
  const blob = fileFromSync(path, mimetype)
  const bytes = await blob.arrayBuffer();
  const { instance } = await WebAssembly.instantiate(bytes, {
    env: {
      random_bytes(dest, len) {
        const memory = instance.exports.memory;
        const view = new Uint8Array(memory.buffer, dest, len);
        getRandomValues(view);
      }
    },
  });

  return instance;
};

const write = (string, buffer, pointer) => {
  const view = new Uint8Array(buffer, pointer);
  const encoder = new TextEncoder();

  view.set(encoder.encode(string));
}

const read = (buffer, pointer) => {
  const view = new Uint8Array(buffer, pointer);
  const length = view.findIndex(byte => byte === 0);
  const decoder = new TextDecoder();

  return JSON.parse(decoder.decode(new Uint8Array(buffer, pointer, length)));
};

(async () => {
  const instance = await createInstance();
  console.log(instance.exports);
  const memory = instance.exports.memory;

  const nonce_ptr = instance.exports.generate_nonce();
  const nonce = read(memory.buffer, nonce_ptr);

  const sender_ptr = instance.exports.generate_keypair();
  const sender = read(memory.buffer, sender_ptr);
  const receiver_ptr = instance.exports.generate_keypair();
  const receiver = read(memory.buffer, receiver_ptr);
  const signer_ptr = instance.exports.generate_keypair();
  const signer = read(memory.buffer, signer_ptr);

  const encoder = new TextEncoder();
  let message = {
    'entries': [{
      'key': Base64.encode('data info'),
      'value': Base64.encode('my data'),
      'kind': 'RawData'
    }]
  };
  let params = {
    'origin': signer.public, 'public_nonce': nonce.data,
    'sender_pk': sender.public, 'recipients': [receiver.public], 'message': message

  };
  params = JSON.stringify(params);
  console.log(params);
  const pointer = instance.exports.allocate(params.length + 1);
  write(params, memory.buffer, pointer);
  let meta_ptr = instance.exports.new_encrypted_metadata(pointer);
  let encrypted_meta = read(memory.buffer, meta_ptr);
  console.log(encrypted_meta);
  console.log(encrypted_meta.metadata.channels);

  instance.exports.deallocate(pointer, params.length + 1);
  instance.exports.deallocate(nonce_ptr, nonce.length);
  instance.exports.deallocate(sender_ptr, sender.length);
  instance.exports.deallocate(receiver_ptr, receiver.length);
  instance.exports.deallocate(signer_ptr, signer.length);
})();
