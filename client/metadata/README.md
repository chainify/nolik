This is a metadata structures and pure wasm32 bindings (not using [wasm-bindgen](https://github.com/rustwasm/wasm-bindgen)) that allow to call wasm functions from any language. You can use `wasmer` or `wasmtime` for that. Or use ffi directly.

### Produce wasm32 target

```bash
cargo rustc --crate-type cdylib --target wasm32-unknown-unknown --release --features ffi,custom
```

### Test
This is an example of JS and wasm interop.

```
cd tests/www
npm install
node index.js
```
