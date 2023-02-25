import { Base64 } from 'js-base64';
import { fileFromSync } from "node-fetch";
import getRandomValues from "get-random-values";

class Box {
  constructor(instance, pointer) {
    this.instance = instance;
    this.memory = instance.exports.memory;
    this.pointer = pointer;
    this.obj = undefined;
    this.encoder = new TextEncoder();
    this.decoder = new TextDecoder();
  }

  write(string) {
    const view = new Uint8Array(this.memory.buffer, this.pointer);
    view.set(this.encoder.encode(string));
  }

  read() {
    const view = new Uint8Array(this.memory.buffer, this.pointer);
    const length = view.findIndex(byte => byte === 0);

    const str = this.decoder.decode(new Uint8Array(this.memory.buffer, this.pointer, length));
    this.obj = JSON.parse(str);
    return this.obj;
  }

  deallocate() {
    this.instance.exports.deallocate(this.pointer);
  }
}

const createInstance = async () => {
  const path = '../../../../target/wasm32-unknown-unknown/release/nolik_metadata.wasm';
  const mimetype = 'text/plain'
  const blob = fileFromSync(path, mimetype)
  const bytes = await blob.arrayBuffer();
  const { instance } = await WebAssembly.instantiate(bytes, {
    env: {
      // this function is called from wasm as RNG
      random_bytes(dest, len) {
        const memory = instance.exports.memory;
        const view = new Uint8Array(memory.buffer, dest, len);
        getRandomValues(view);
      }
    },
  });

  return instance;
};

const instance = await createInstance();
// console.log(instance.exports);

let nonce = new Box(instance, instance.exports.generate_nonce());
let sender = new Box(instance, instance.exports.generate_keypair());
let receiver = new Box(instance, instance.exports.generate_keypair());
let signer = new Box(instance, instance.exports.generate_keypair());

const encoder = new TextEncoder();
let message = {
  'entries': [{
    'key': Base64.encode('data info'),
    'value': Base64.encode('my data'),
    'kind': 'RawData'
  }]
};
let params = {
  'origin': signer.read().public,
  'public_nonce': nonce.read().data,
  'sender_pk': sender.read().public,
  'recipients': [receiver.read().public],
  'message': message
};

params = JSON.stringify(params);
let wparams = new Box(instance, instance.exports.allocate(params.length));
wparams.write(params);
let meta = new Box(instance, instance.exports.new_encrypted_metadata(wparams.pointer));
let encrypted_meta = meta.read();
console.log(encrypted_meta);

wparams.deallocate();
meta.deallocate();
nonce.deallocate();
sender.deallocate();
receiver.deallocate();
signer.deallocate();
