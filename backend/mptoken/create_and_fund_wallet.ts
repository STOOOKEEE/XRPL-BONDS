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
    // If XRPL_FAUCET_URL is set in .env (e.g. https://wasmfaucet.devnet.rippletest.net/accounts),
    // parse it and pass faucetHost/faucetPath to fundWallet so xrpl.js can call the correct faucet.
    let faucetOptions: any = {}
    if (process.env.XRPL_FAUCET_URL) {
      try {
        const u = new URL(process.env.XRPL_FAUCET_URL);
        // URL.host gives hostname:port if any; fundWallet expects hostname only (works with host including port)
        faucetOptions.faucetHost = u.host;
        faucetOptions.faucetPath = u.pathname || '/accounts';
      } catch (err) {
        // Ignore parse error and fall back to known faucet
        console.warn('Invalid XRPL_FAUCET_URL, falling back to default faucet:', process.env.XRPL_FAUCET_URL);
      }
    }

    if (!faucetOptions.faucetHost) {
      // default to public altnet faucet if none provided
      faucetOptions = { faucetHost: 'faucet.altnet.rippletest.net', faucetPath: '/accounts' };
    }

    const funded = await client.fundWallet(undefined, faucetOptions);
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
