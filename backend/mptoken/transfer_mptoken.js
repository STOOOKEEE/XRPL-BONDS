// Simple CLI to transfer MPToken (ONLY MPTokenTransfer)
// Usage:
//   node transfer_mptoken.js <issuanceId> <destination> <amount>
//   node transfer_mptoken.js <issuanceId> <destination> <amount> <issuerSecret>
// or
//   node transfer_mptoken.js --issuanceId=... --to=... --amount=... [--secret=...]
// Note: this script will NOT mint tokens. It will attempt a MPTokenTransfer and requires
// the signing secret of the account that holds the tokens (issuer or other holder).

require('dotenv').config();
const xrpl = require('xrpl');

const WS_URL = process.env.XRPL_WEBSOCKET_URL || 'wss://s.devnet.rippletest.net:51233';
const ISSUER_SECRET = process.env.ISSUER_SECRET;

function printUsage() {
  console.log('Usage: node transfer_mptoken.js <issuanceId> <destination> <amount>');
  console.log('   or: node transfer_mptoken.js --issuanceId=... --to=... --amount=...');
  console.log('Options:');
  console.log('  --secret=SEED        secret to sign the transfer (or set ISSUER_SECRET in env)');
  console.log('  --scale=N            asset scale: when providing a human amount, multiply by 10^N');
  console.log('  --human              treat <amount> as human-readable (with optional decimal) and convert using --scale (default 0)');
  console.log('\nEnvironment variables:');
  console.log('  XRPL_WEBSOCKET_URL   WebSocket endpoint (optional)');
  console.log('  ISSUER_SECRET        Secret of the issuer account (required to sign)');
}

function parseArgs() {
  const argv = process.argv.slice(2);
  if (argv.length === 0) return null;
  // support positional
  if (argv.length >= 3 && !argv[0].startsWith('--')) {
    const out = { issuanceId: argv[0], destination: argv[1], amount: argv[2] };
    if (argv.length >= 4) out.secret = argv[3];
    return out;
  }
  // support --name=value
  const out = {};
  for (const a of argv) {
    const m = a.match(/^--([^=]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
  }
  if (out.issuanceId && out.to && out.amount) {
    return { issuanceId: out.issuanceId, destination: out.to, amount: out.amount, secret: out.secret };
  }
  return null;
}

async function main() {
  const args = parseArgs();
  if (!args) {
    printUsage();
    process.exit(1);
  }
  // secret precedence: CLI arg > env ISSUER_SECRET
  const signerSecret = args.secret || process.env.ISSUER_SECRET;
  if (!signerSecret) {
    console.error('A signing secret is required (pass --secret or set ISSUER_SECRET in env)');
    process.exit(2);
  }
  const { issuanceId, destination, amount } = args;
  // if user passed human flag or scale, convert amount
  let amountSmallest = String(amount);
  const scale = args.scale ? Number(args.scale) : undefined;
  const human = !!args.human;
  if (human || typeof scale === 'number') {
    const s = typeof scale === 'number' && !Number.isNaN(scale) ? scale : 0;
    // convert decimal string to smallest units using BigInt-safe routine
    function humanToSmallest(amountStr, scaleInt) {
      if (typeof amountStr !== 'string') amountStr = String(amountStr);
      const parts = amountStr.split('.');
      const intPart = parts[0] || '0';
      const fracPart = parts[1] || '';
      let frac = fracPart.slice(0, scaleInt);
      while (frac.length < scaleInt) frac += '0';
      const wholeStr = intPart.replace(/^\+/, '') + frac;
      // remove leading zeros to avoid BigInt issues
      const normalized = wholeStr.replace(/^0+(?!$)/, '');
      return BigInt(normalized || '0').toString();
    }

    try {
      amountSmallest = humanToSmallest(String(amount), s);
    } catch (e) {
      console.warn('Failed to convert human amount to smallest units, falling back to provided amount');
      amountSmallest = String(amount);
    }
  }
  console.log('Connecting to', WS_URL);
  const client = new xrpl.Client(WS_URL);
  await client.connect();

  const signerWallet = xrpl.Wallet.fromSeed(signerSecret);
  console.log('Using signer:', signerWallet.address);

  // helper to try a tx type
  async function tryTx(tx) {
    try {
      console.log('Submitting', tx.TransactionType, JSON.stringify(tx, null, 2));
      const res = await client.submitAndWait(tx, { autofill: true, wallet: signerWallet });
      console.log('Result for', tx.TransactionType, JSON.stringify(res, null, 2));
      return res;
    } catch (err) {
      console.error('Error submitting', tx.TransactionType, err && err.message ? err.message : err);
      throw err;
    }
  }

  /**
   * Reusable transfer function that attempts an MPTokenTransfer for a given issuanceId.
   * @param {Client} client xrpl.Client instance (connected)
   * @param {Wallet} signerWallet wallet used to sign the transfer
   * @param {string} issuanceId issuance id returned by MPTokenIssuanceCreate
   * @param {string} destination destination address
   * @param {string} amountSmallestUnit amount in smallest units (string)
   */
  async function transferMPTokenToHolder(client, signerWallet, issuanceId, destination, amountSmallestUnit) {
    if (!issuanceId) throw new Error('issuanceId required');
    if (!destination) throw new Error('destination required');
    if (!amountSmallestUnit) throw new Error('amount required');

    const tx = {
      TransactionType: 'MPTokenTransfer',
      Account: signerWallet.address,
      // include both key variants to be robust against node/implementation differences
      IssuanceID: issuanceId,
      IssuanceId: issuanceId,
      Destination: destination,
      Amount: String(amountSmallestUnit),
      Flags: 0,
    };

    return client.submitAndWait(tx, { autofill: true, wallet: signerWallet });
  }

  // export the helper when required as a module
  try { module.exports.transferMPTokenToHolder = transferMPTokenToHolder } catch (e) { /* ignore in some runtimes */ }

  try {
    // Only perform MPTokenTransfer here. The minted tokens must already be in the signer's account.
    const transferTx = {
      TransactionType: 'MPTokenTransfer',
      Account: signerWallet.address,
      IssuanceId: issuanceId,
      Destination: destination,
      Amount: String(amountSmallest),
      Flags: 0
    };

    await tryTx(transferTx);
    console.log('MPTokenTransfer submitted');
  } finally {
    try { await client.disconnect(); } catch (e) { /* ignore */ }
  }
}

main().catch(err => {
  console.error('Fatal error', err && err.message ? err.message : err);
  process.exit(99);
});
