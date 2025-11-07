import { Client } from 'xrpl';

const client = new Client("wss://s.devnet.rippletest.net:51233");

const main = async () => {
  try {
    console.log("Let's create a Multi-Purpose Token...");
    await client.connect();

    // Create issuer and holder wallets
    const { wallet: issuerWallet } = await client.fundWallet();
    const { wallet: holderWallet } = await client.fundWallet();

    console.log('Issuer Wallet:', issuerWallet.address);
    console.log('Holder Wallet:', holderWallet.address);

    // Define token metadata
    const tokenMetadata = {
      name: "MyMPToken",
      symbol: "MPT",
      description: "A sample Multi-Purpose Token",
    };

    // Convert metadata to hex string
    const metadataHex = Buffer.from(JSON.stringify(tokenMetadata)).toString('hex');

    // Set flags for a regulated token
    const totalFlagsValue = 102;  // canLock + canClawback + canTransfer + requireAuth

    // Create MPToken issuance transaction
    const transactionBlob = {
      TransactionType: "MPTokenIssuanceCreate",
      Account: issuerWallet.address,
      Flags: totalFlagsValue,
      MPTokenMetadata: metadataHex
      // MaximumAmount: "1000000000000000000", (Optional) The maximum asset amount of this token that can ever be issued
      // TransferFee: 5000, (Optional) between 0 and 50000 for 50.000% fees charged by the issuer for secondary sales of Token
      // AssetScale: 2, (Optional) 10^(-scale) of a corresponding fractional unit. For example, a US Dollar Stablecoin will likely have an asset scale of 2, representing 2 decimal places.
    };

    // Submit token issuance
    const mptokenCreationResult = await client.submitAndWait(transactionBlob, {
      autofill: true,
      wallet: issuerWallet
    });

    console.log('MPToken Creation Result:', mptokenCreationResult.result.meta?.TransactionResult);
    console.log('MPToken Issuance ID:', mptokenCreationResult.result.meta?.mpt_issuance_id);

    await client.disconnect();
    console.log("All done!");
  } catch (error) {
    console.error("Error creating MPToken:", error);
  }
};

main();