import { Client, Wallet } from 'xrpl';
import dotenv from 'dotenv';
dotenv.config();

// Use env var or fallback to devnet
const WS_URL = process.env.XRPL_WEBSOCKET_URL ?? 'wss://s.altnet.rippletest.net:51233';
const client = new Client(WS_URL);


const main = async () => {
  try {
    console.log("Let's create a Multi-Purpose Token...");
    await client.connect();

    // Determine issuer and holder wallets: use secrets from .env if present, otherwise fund new wallets (devnet)
    let issuerWallet: Wallet;
    let holderWallet: Wallet;

    if (process.env.ISSUER_SECRET) {
      issuerWallet = Wallet.fromSeed(process.env.ISSUER_SECRET);
      if (process.env.ISSUER_ADDRESS && process.env.ISSUER_ADDRESS !== issuerWallet.address) {
        console.warn('Warning: ISSUER_ADDRESS in .env does not match ISSUER_SECRET-derived address. Using secret-derived address.');
      }
      console.log('Using issuer from secret, address:', issuerWallet.address);
    } else if (process.env.ISSUER_ADDRESS) {
      console.log('ISSUER_ADDRESS provided without secret. A new funded wallet will be created for signing (devnet).');
      const funded = await client.fundWallet();
      issuerWallet = funded.wallet;
      console.log('New issuer address:', issuerWallet.address);
    } else {
      const funded = await client.fundWallet();
      issuerWallet = funded.wallet;
      console.log('Funded issuer address:', issuerWallet.address);
    }

    if (process.env.HOLDER_SECRET) {
      holderWallet = Wallet.fromSeed(process.env.HOLDER_SECRET);
      if (process.env.HOLDER_ADDRESS && process.env.HOLDER_ADDRESS !== holderWallet.address) {
        console.warn('Warning: HOLDER_ADDRESS in .env does not match HOLDER_SECRET-derived address. Using secret-derived address.');
      }
      console.log('Using holder from secret, address:', holderWallet.address);
    } else if (process.env.HOLDER_ADDRESS) {
      console.log('HOLDER_ADDRESS provided without secret. A new funded wallet will be created for signing/receiving (devnet).');
      const fundedHolder = await client.fundWallet();
      holderWallet = fundedHolder.wallet;
      console.log('New holder address:', holderWallet.address);
    } else {
      const fundedHolder = await client.fundWallet();
      holderWallet = fundedHolder.wallet;
      console.log('Funded holder address:', holderWallet.address);
    }

    // Define token metadata
    const tokenMetadata = {
      name: 'MyMPToken',
      symbol: 'MPT',
      description: 'A sample Multi-Purpose Token',
    };

    // Convert metadata to hex string
    const metadataHex = Buffer.from(JSON.stringify(tokenMetadata)).toString('hex');

    // Set flags for a regulated token
    const totalFlagsValue = 96; // canLock + canClawback + canTransfer + requireAuth

    // Create MPToken issuance transaction
    const transactionBlob = {
      TransactionType: 'MPTokenIssuanceCreate',
      Account: issuerWallet.address,
      Flags: totalFlagsValue,
      MPTokenMetadata: metadataHex,
      MaximumAmount: '1000000000000000000',
      // TransferFee: 5000, (Optional)
      AssetScale: 0, 
    } as any;

    // Submit token issuance
    const mptokenCreationResult = await client.submitAndWait(transactionBlob, {
      autofill: true,
      wallet: issuerWallet,
    });

    // Cast meta to any to avoid type issues from library typings
    const meta: any = (mptokenCreationResult as any)?.result?.meta;
    console.log('MPToken Creation full result:', JSON.stringify((mptokenCreationResult as any)?.result ?? {}, null, 2));
    console.log('MPToken Creation Result:', meta?.TransactionResult);
    console.log('MPToken Issuance ID:', meta?.mpt_issuance_id ?? meta?.mptIssuanceId ?? 'n/a');

    // après l'appel submitAndWait
    const res: any = mptokenCreationResult as any;

    // tx hash (où le chercher)
    const txHash = res?.result?.tx_json?.hash ?? res?.result?.hash ?? 'n/a';
    console.log('Transaction hash:', txHash);

    // Issuer address (déjà logué mais on l'affiche encore)
    console.log('Issuer address:', issuerWallet.address);

    // Issuance ID probable (deux noms possibles selon la réponse)
    const issuanceId = res?.result?.meta?.mpt_issuance_id ?? res?.result?.meta?.mptIssuanceId ?? 'n/a';
    console.log('MPToken Issuance ID:', issuanceId);

    console.log('All done!');
  } catch (error) {
    console.error('Error creating MPToken:', error);
    process.exitCode = 1;
  } finally {
    try {
      await client.disconnect();
    } catch (e) {
      // ignore disconnect errors
    }
  }
};

// Run when invoked directly
if (require.main === module) main();