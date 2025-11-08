import { Client } from 'xrpl';
import dotenv from 'dotenv';
dotenv.config();

// Usage:
//   npx ts-node ./mptoken/create_and_fund_wallet.ts
// The script connects to the XRPL devnet (configurable via XRPL_WEBSOCKET_URL in backend/.env),
// requests a funded wallet from the faucet (client.fundWallet()) and prints a short JSON with
// the address, seed and public key.

const WS_URL = process.env.XRPL_WEBSOCKET_URL ?? 'wss://wasm.devnet.rippletest.net:51233';

async function createAndFund() {
  const client = new Client(WS_URL);
  try {
    await client.connect();
    // fundWallet is a devnet helper that returns a funded wallet
    const funded = await client.fundWallet();
    const wallet = (funded as any).wallet;

    // Wallet shape can vary across xrpl.js versions; extract common fields defensively
    const address = wallet?.address ?? null;
    const seed = wallet?.seed ?? wallet?.secret ?? null;
    const publicKey = wallet?.publicKey ?? wallet?.public_key ?? wallet?.publicKeyHex ?? null;

    const out = {
      address,
      seed,
      publicKey,
    };

    // Print as JSON so it's easy to parse programmatically
    console.log(JSON.stringify(out, null, 2));

    return out;
  } catch (err) {
    console.error('Failed to create and fund wallet:', err);
    throw err;
  } finally {
    try {
      await client.disconnect();
    } catch (e) {
      // ignore
    }
  }
}

// Run when invoked directly
if (require.main === module) {
  createAndFund().catch((e) => process.exit(1));
}

export default createAndFund;
