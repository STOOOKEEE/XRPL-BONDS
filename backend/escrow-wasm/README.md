# Escrow WASM

Rust/WebAssembly module for deterministic escrow campaign logic.

## Features

- **1:1 USDC → Token exchange** (integer-only amounts)
- **Max cap enforcement** (rejects investments that would exceed limit)
- **Treasury transfer** (if objective reached exactly at cap)
- **Deadline enforcement** (1 month or custom period)
- **Automatic refunds** (if objective not reached by deadline)

## Build

Prerequisites:

- Rust toolchain (stable) + `wasm32-unknown-unknown` target
- `wasm-pack` (`cargo install wasm-pack` or `brew install wasm-pack`)

From `backend`:

```bash
npm run build-escrow-wasm
```

This creates `backend/pkg/escrow/` with Node.js-compatible bindings.

## API

### `create_campaign_state(campaign_id, max_value, deadline_unix, treasury_address, token_currency, token_issuer)`

Creates a new campaign state object (JS).

### `process_investment(state_json, sender_address, usdc_amount, current_time_unix)`

Returns `InvestmentResult`:

- `accepted`: bool
- `reason`: string
- `token_amount`: u64 (1:1 with USDC, integer only)
- `updated_state`: updated campaign state (or null if rejected)
- `send_to_treasury`: bool (true if cap reached exactly)

### `finalize_campaign(state_json, current_time_unix)`

Returns `FinalizeResult`:

- `success`: bool
- `objective_reached`: bool
- `refunds`: array of `[address, amount]` (if failed)
- `treasury_amount`: u64 (if succeeded)

## Usage Example (Node/TS)

```typescript
import * as escrow from "../pkg/escrow";

// 1. Create campaign
const state = escrow.create_campaign_state(
  "CAMP001",
  10_000_000, // 10 USDC (6 decimals)
  Math.floor(Date.now() / 1000) + 30 * 24 * 3600, // +30 days
  "rTreasuryAddress...",
  "BOND",
  "rIssuerAddress..."
);

// 2. Process investment
const result = escrow.process_investment(
  JSON.stringify(state),
  "rInvestorAddress...",
  1_000_000, // 1 USDC
  Math.floor(Date.now() / 1000)
);

if (result.accepted) {
  // Send `result.token_amount` tokens to investor using xrpl.js
  // Persist `result.updated_state` to DB
}

// 3. Finalize after deadline
const finalize = escrow.finalize_campaign(
  JSON.stringify(state),
  Math.floor(Date.now() / 1000)
);

if (finalize.objective_reached) {
  // Send treasury_amount to treasury
} else {
  // Issue refunds from finalize.refunds array
}
```

## Notes

- State persistence (MongoDB/JSON) is handled by Node/TS code, not wasm.
- Network operations (signing, submitting txs) use `xrpl.js` on Node side.
- Rust provides only validation and state transitions (deterministic, testable).
