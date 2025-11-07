/**
 * Système de stockage des vaults (en mémoire)
 * En production, utiliser une vraie BDD (MongoDB, PostgreSQL, etc.)
 */

let vaults = {}; // ID -> Vault object

/**
 * Structure d'un Vault :
 * {
 *   id: "VAULT-XXX",
 *   targetAmount: "1000",          // Montant cible en USDC
 *   currentAmount: "500",          // Montant reçu jusqu'à présent
 *   maxAmount: "1000",             // Ne pas dépasser
 *   tokenSymbol: "MTP",            // Symbole du token à minter
 *   tokensToMint: "1000",          // Tokens à créer (1:1 avec USDC)
 *   recipientAddress: "rXXX...",   // Adresse qui recevra les fonds
 *   status: "FUNDING" | "COMPLETED",
 *   multisig: {
 *     signers: [{ address: "r...", weight: 1 }, ...],
 *     requiredSignatures: 2
 *   },
 *   investors: [
 *     { address: "rXXX...", amount: "100", tokensMinted: "100" }
 *   ],
 *   transactionHash: "XXXXXX",     // Hash de la transaction de finalisation
 *   createdAt: timestamp,
 *   completedAt: timestamp
 * }
 */

export const createVault = (vaultData) => {
  const vault = {
    id: vaultData.id,
    targetAmount: vaultData.targetAmount.toString(),
    currentAmount: "0",
    maxAmount: vaultData.maxAmount.toString(),
    tokenSymbol: vaultData.tokenSymbol,
    tokensToMint: vaultData.tokensToMint.toString(),
    recipientAddress: vaultData.recipientAddress,
    status: "FUNDING",
    multisig: vaultData.multisig,
    investors: [],
    transactionHash: null,
    createdAt: new Date(),
    completedAt: null,
  };
  
  vaults[vault.id] = vault;
  return vault;
};

export const getVault = (vaultId) => {
  return vaults[vaultId];
};

export const updateVault = (vaultId, updates) => {
  if (!vaults[vaultId]) {
    throw new Error(`Vault ${vaultId} not found`);
  }
  
  vaults[vaultId] = { ...vaults[vaultId], ...updates };
  return vaults[vaultId];
};

export const addInvestor = (vaultId, investorAddress, amount) => {
  const vault = vaults[vaultId];
  if (!vault) throw new Error(`Vault ${vaultId} not found`);
  
  const existingInvestor = vault.investors.find(inv => inv.address === investorAddress);
  
  if (existingInvestor) {
    existingInvestor.amount = (parseFloat(existingInvestor.amount) + parseFloat(amount)).toString();
  } else {
    vault.investors.push({
      address: investorAddress,
      amount: amount.toString(),
      tokensMinted: "0",
    });
  }
  
  vault.currentAmount = (parseFloat(vault.currentAmount) + parseFloat(amount)).toString();
  return vault;
};

export const completeVault = (vaultId, transactionHash) => {
  const vault = vaults[vaultId];
  if (!vault) throw new Error(`Vault ${vaultId} not found`);
  
  vault.status = "COMPLETED";
  vault.transactionHash = transactionHash;
  vault.completedAt = new Date();
  
  return vault;
};

export const getAllVaults = () => {
  return Object.values(vaults);
};

export const resetStorage = () => {
  vaults = {};
};
