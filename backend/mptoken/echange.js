import { Client, Wallet } from 'xrpl';
import * as dotenv from 'dotenv'
dotenv.config()


const client = new Client(process.env.XRPL_WEBSOCKET_URL)


const main = async () => {
  try {
    console.log("Creating company shares using Multi-Purpose Tokens...");
    await client.connect();

    console.log("Setting up company and investor wallets...");

    // Create company (issuer) and investor wallets
    const companyWallet = Wallet.fromSeed(process.env.COMPANY_SECRET);
    const investor1Wallet = Wallet.fromSeed(process.env.INVESTOR1_SECRET);
    const investor2Wallet = Wallet.fromSeed(process.env.INVESTOR2_SECRET);

    console.log('Company Wallet:', companyWallet.address);
    console.log('Investor 1 Wallet:', investor1Wallet.address);
    console.log('Investor 2 Wallet:', investor2Wallet.address);
    console.log("");

    // Define company share token metadata
    const tokenMetadata = {
      name: "TechCorp Shares",
      symbol: "TECH",
      description: "Equity shares in TechCorp with regulatory compliance features",
    };

    // Convert metadata to hex string
    const metadataHex = Buffer.from(JSON.stringify(tokenMetadata)).toString('hex');

    // Set flags for a regulated security token
    const totalFlagsValue = 102;  // canLock + canClawback + canTransfer + requireAuth

    // Create company share token issuance
    let transactionBlob = {
      TransactionType: "MPTokenIssuanceCreate",
      Account: companyWallet.address,
      Flags: totalFlagsValue,
      MPTokenMetadata: metadataHex
    };

    console.log("Issuing company share tokens...");
    // Submit token issuance
    const createTx = await client.submitAndWait(transactionBlob, { wallet: companyWallet });

    // Get the MPTokenID for our company shares
    const MPTokenID = createTx.result.meta?.mpt_issuance_id;  

    console.log('Share token creation transaction hash:', createTx.result.hash);
    console.log('Company Share Token ID:', MPTokenID);
    console.log("");

    // First, investors need to self-authorize to receive the tokens
    // Investor 1 self-authorization
    transactionBlob = {
      TransactionType: "MPTokenAuthorize",
      Account: investor1Wallet.address,
      MPTokenIssuanceID: MPTokenID,
    };

    console.log("Investor 1 authorizing to receive shares...");
    const investor1SelfAuthTx = await client.submitAndWait(transactionBlob, {wallet: investor1Wallet });

    // Investor 2 self-authorization
    transactionBlob = {
      TransactionType: "MPTokenAuthorize",
      Account: investor2Wallet.address,
      MPTokenIssuanceID: MPTokenID,
    };

    console.log("Investor 2 authorizing to receive shares...");
    const investor2SelfAuthTx = await client.submitAndWait(transactionBlob, {wallet: investor2Wallet });

    console.log("Investor 1 self-authorization transaction hash:", investor1SelfAuthTx.result.hash);
    console.log("Investor 2 self-authorization transaction hash:", investor2SelfAuthTx.result.hash);
    console.log("");

    // With requireAuth flag, the company (issuer) must authorize investors
    // Authorize investor 1
    transactionBlob = {
      TransactionType: "MPTokenAuthorize",
      Account: companyWallet.address,
      MPTokenIssuanceID: MPTokenID,
      Holder: investor1Wallet.address
    };

    console.log("Company authorizing investor 1 to receive shares...");
    const investor1AuthTx = await client.submitAndWait(transactionBlob, {wallet: companyWallet });

    // Authorize investor 2
    transactionBlob = {
      TransactionType: "MPTokenAuthorize",
      Account: companyWallet.address,
      MPTokenIssuanceID: MPTokenID,
      Holder: investor2Wallet.address
    };

    console.log("Company authorizing investor 2 to receive shares...");
    const investor2AuthTx = await client.submitAndWait(transactionBlob, {wallet: companyWallet });

    console.log("Investor 1 issuer authorization transaction hash:", investor1AuthTx.result.hash);
    console.log("Investor 2 issuer authorization transaction hash:", investor2AuthTx.result.hash);
    console.log("");

    // Distribute shares to investor 1 (10,000 shares)
    transactionBlob = {
        TransactionType: "Payment",
        Account: companyWallet.address,
        Amount: {
          "mpt_issuance_id": MPTokenID, // Company share token ID
          "value": "10000" // 10,000 shares
        },
        Destination: investor1Wallet.address,
    }; 

    console.log("Distributing 10,000 shares to investor 1...");
    const paymentTx = await client.submitAndWait(transactionBlob, {wallet: companyWallet });

    console.log("Share distribution transaction hash: ", paymentTx.result.hash);
    console.log("");

    // Demonstrate compliance: Lock investor 1's shares (e.g., during regulatory investigation)
    transactionBlob = {
      TransactionType: "MPTokenIssuanceSet",
      Account: companyWallet.address,
      MPTokenIssuanceID: MPTokenID,
      Holder: investor1Wallet.address,
      Flags: 0, // Lock the shares
    };

    console.log("Locking investor 1's shares for compliance review...");
    const lockTx = await client.submitAndWait(transactionBlob, {wallet: companyWallet });

    console.log("Lock transaction hash: ", lockTx.result.hash);
    console.log("TransactionResult: ", lockTx.result.meta.TransactionResult);
    console.log("Investor 1 can no longer transfer their shares");
    console.log("");
    
    // Attempt transfer while locked (this will fail)
    transactionBlob = {
      TransactionType: "Payment",
      Account: investor1Wallet.address,
      Amount: {
        "mpt_issuance_id": MPTokenID,
        "value": "5000"
      },
      Destination: investor2Wallet.address,
    };

    console.log("Attempting to transfer locked shares to investor 2 (this will fail)...");
    const transferTx = await client.submitAndWait(transactionBlob, {wallet: investor1Wallet });

    console.log("Transfer transaction hash: ", transferTx.result.hash);
    console.log("TransactionResult: ", transferTx.result.meta.TransactionResult);
    console.log("Transfer failed as expected - shares are locked");
    console.log("");

    // Company exercises clawback rights (e.g., for regulatory compliance)
    transactionBlob = {
      TransactionType: "Clawback",
      Account: companyWallet.address,
      Amount: {
        "mpt_issuance_id": MPTokenID,
        "value": "10000"
      },
      Holder: investor1Wallet.address,
    };

    console.log("Company exercising clawback rights on investor 1's shares...");
    const clawbackTx = await client.submitAndWait(transactionBlob, {wallet: companyWallet });

    console.log("Clawback transaction hash: ", clawbackTx.result.hash);
    console.log("All 10,000 shares have been returned to the company");
    console.log("");
    
    
    await client.disconnect();
    console.log("Company share token demonstration complete!");
  } catch (error) {
    console.error("Error in share token operations:", error);
  }
};

main();