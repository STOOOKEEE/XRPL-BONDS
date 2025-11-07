import * as xrpl from 'xrpl';

// Configuration XRPL
export const XRPL_CONFIG = {
  // Testnet pour développement
  network: process.env.REACT_APP_XRPL_NETWORK || 'testnet',
  networkUrl: process.env.REACT_APP_XRPL_NETWORK_URL || 'https://s.altnet.rippletest.net:51234',
  
  // Credentials (multi-sig)
  issuer: {
    address: process.env.REACT_APP_ISSUER_ADDRESS,
    seed: process.env.REACT_APP_ISSUER_SEED,
  },
  
  // Signataires additionnels pour multi-sig
  signatories: [
    {
      address: process.env.REACT_APP_SIGNATORY_1_ADDRESS,
      seed: process.env.REACT_APP_SIGNATORY_1_SEED,
    },
    {
      address: process.env.REACT_APP_SIGNATORY_2_ADDRESS,
      seed: process.env.REACT_APP_SIGNATORY_2_SEED,
    },
  ],
  
  // Configuration du token
  token: {
    symbol: process.env.REACT_APP_TOKEN_SYMBOL || 'MTP',
    currency: process.env.REACT_APP_TOKEN_CURRENCY || '0158415500000000000000000000000000000000',
    issuer: process.env.REACT_APP_TOKEN_ISSUER || process.env.REACT_APP_ISSUER_ADDRESS,
  },
  
  // Configuration USDC
  usdc: {
    currency: 'USDC',
    issuer: process.env.REACT_APP_USDC_ISSUER || 'rN7n7otQDd6FczFgLdlqXRwRQULis8wbgr',
  },
};

// Client XRPL singleton
let client = null;

export const initXRPL = async () => {
  if (client && client.isConnected()) {
    return client;
  }
  
  client = new xrpl.Client(XRPL_CONFIG.networkUrl);
  await client.connect();
  console.log(`✅ Connected to XRPL ${XRPL_CONFIG.network}`);
  return client;
};

export const getXRPLClient = () => {
  if (!client) {
    throw new Error('XRPL client not initialized. Call initXRPL() first.');
  }
  return client;
};

export const closeXRPL = async () => {
  if (client) {
    await client.disconnect();
    client = null;
  }
};
