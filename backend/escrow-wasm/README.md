# Escrow WASM

This crate builds a small wasm module (wasm-bindgen) that provides helpers
for constructing XRPL Escrow instructions. It intentionally does not perform
network calls or signing — those are done in Node/TS using `xrpl.js`.

## Build

Prerequisites:

- Rust toolchain (stable) + target `wasm32-unknown-unknown` (wasm-pack will handle this)
- wasm-pack (install via `cargo install wasm-pack` or `brew install wasm-pack`)

From `backend` run:

```bash
npm run build-escrow-wasm
```

This will produce a JS-friendly package under `backend/pkg/escrow` that can be
imported from Node/TS code (CommonJS / ES modules depending on the build).

Usage (example in Node/TS):

```ts
import * as escrow from "../pkg/escrow";

const instr = escrow.build_escrow_create(
  "rIssuer..",
  "rDest..",
  "1000000",
  "Campaign123"
);
// instr is a JS object with the transaction fields; sign/submit with xrpl.js
```

## Notes

- Keep business logic (validation) in Rust if you want deterministic behavior.
- Keep keys and signing in Node to use xrpl.js signing and submission.
