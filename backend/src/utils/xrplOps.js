const xrpl = require('xrpl');
const { getClient, XRPL_CONFIG } = require('../config/xrpl');

/**
 * Créer une transaction multi-sig
 */
const createMultisigTransaction = async (txJson) => {
  const client = getClient();
  
  // Obtenir les wallets des signataires
  const issuerWallet = xrpl.Wallet.fromSeed(XRPL_CONFIG.issuer.seed);
  const signatoryWallets = XRPL_CONFIG.signatories.map(sig =>
    xrpl.Wallet.fromSeed(sig.seed)
  );
  
  // Construire la transaction
  const txObject = {
    ...txJson,
    account: issuerWallet.address,
  };
  
  // Obtenir le numéro de séquence
  const accountInfo = await client.request({
    command: 'account_info',
    account: issuerWallet.address,
  });
  txObject.sequence = accountInfo.account_data.Sequence;
  
  // Obtenir les frais recommandés
  const fee = await client.getNetworkFee();
  txObject.fee = fee;
  
  return {
    txJson: txObject,
    issuerWallet,
    signatoryWallets,
  };
};

/**
 * Signer une transaction multi-sig
 */
const signMultisigTransaction = async (txJson, wallets) => {
  const client = getClient();
  
  // Signer avec tous les wallets
  const signedTx = txJson;
  
  // Premier signer (le compte principal)
  const mainWallet = wallets[0];
  const tx = await client.submitAndWait(
    xrpl.sign(txJson, mainWallet)
  );
  
  return tx;
};

/**
 * Transférer des USDC vers un compte
 */
const transferUSBC = async (toAddress, amount, fromWallet) => {
  const client = getClient();
  const { usdc } = XRPL_CONFIG;
  
  const payment = {
    transaction_type: 'Payment',
    account: fromWallet.address,
    destination: toAddress,
    amount: {
      currency: usdc.currency,
      value: amount.toString(),
      issuer: usdc.issuer,
    },
  };
  
  const tx = xrpl.sign(payment, fromWallet);
  const result = await client.submitAndWait(tx);
  
  return result;
};

/**
 * Minter un token fungible (Issue)
 * Note: Nécessite d'avoir défini le trust line avec l'émetteur
 */
const issueToken = async (tokenCurrency, amount, destinationAddress, fromWallet) => {
  const client = getClient();
  
  const payment = {
    transaction_type: 'Payment',
    account: fromWallet.address,
    destination: destinationAddress,
    amount: {
      currency: tokenCurrency,
      value: amount.toString(),
      issuer: fromWallet.address,
    },
  };
  
  const tx = xrpl.sign(payment, fromWallet);
  const result = await client.submitAndWait(tx);
  
  return result;
};

/**
 * Établir un trust line (permettre à un compte de recevoir un token)
 */
const setTrustLine = async (currencyCode, issuerAddress, limit, wallet) => {
  const client = getClient();
  
  const trustSet = {
    transaction_type: 'TrustSet',
    account: wallet.address,
    limit_amount: {
      currency: currencyCode,
      issuer: issuerAddress,
      value: limit.toString(),
    },
  };
  
  const tx = xrpl.sign(trustSet, wallet);
  const result = await client.submitAndWait(tx);
  
  return result;
};

/**
 * Configurer la clé de multisignature d'un compte
 */
const setMultisigKey = async (signers, quorum, wallet) => {
  const client = getClient();
  
  const signingPubKeys = signers.map((signer, index) => ({
    SignerEntry: {
      SignerWeight: signer.weight || 1,
      Account: signer.address,
    },
  }));
  
  const setSigningKey = {
    transaction_type: 'SigningPubKeySet',
    account: wallet.address,
    signers: signingPubKeys,
    signing_pub_key_quorum: quorum,
  };
  
  const tx = xrpl.sign(setSigningKey, wallet);
  const result = await client.submitAndWait(tx);
  
  return result;
};

/**
 * Récupérer le solde d'un compte
 */
const getBalance = async (address) => {
  const client = getClient();
  
  const accountInfo = await client.request({
    command: 'account_info',
    account: address,
  });
  
  return {
    xrp: xrpl.dropsToXrp(accountInfo.account_data.Balance),
    sequence: accountInfo.account_data.Sequence,
  };
};

/**
 * Récupérer les trust lines d'un compte
 */
const getTrustLines = async (address) => {
  const client = getClient();
  
  const lines = await client.request({
    command: 'account_lines',
    account: address,
  });
  
  return lines.lines;
};

/**
 * Récupérer l'historique des transactions
 */
const getTransactionHistory = async (address, limit = 10) => {
  const client = getClient();
  
  const txs = await client.request({
    command: 'account_tx',
    account: address,
    limit,
  });
  
  return txs.transactions;
};

module.exports = {
  createMultisigTransaction,
  signMultisigTransaction,
  transferUSBC,
  issueToken,
  setTrustLine,
  setMultisigKey,
  getBalance,
  getTrustLines,
  getTransactionHistory,
};
