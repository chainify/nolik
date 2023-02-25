### Produce wasm32 target

```bash
cargo rustc --crate-type cdylib --target wasm32-unknown-unknown --release --features ffi,custom
```

### Tets

```
cd tests/www
npm install
node test.js
```
