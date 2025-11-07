/**
 * Wrapper pour accéder aux opérations vault depuis le frontend
 * Cela évite les problèmes d'imports avec le backend
 */

// Stockage des vaults en mémoire
let vaults: Record<string, any> = {};

/**
 * Générer un ID unique pour un vault
 */
const generateVaultId = (): string => {
  return 'VAULT-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
};

/**
 * Formatter un montant en USDC (2 décimales)
 */
const formatUSDC = (amount: number | string): string => {
  return parseFloat(amount.toString()).toFixed(2);
};

/**
 * Créer un nouveau vault
 */
export const createVault = async (options: {
  targetAmount: string | number;
  tokenSymbol?: string;
  recipientAddress: string;
  signers: Array<{ address: string; weight?: number }>;
  requiredSignatures?: number;
}): Promise<any> => {
  const {
    targetAmount,
    tokenSymbol = 'MTP',
    recipientAddress,
    signers = [],
    requiredSignatures = 2,
  } = options;

  // Validations basiques
  if (!targetAmount || parseFloat(targetAmount.toString()) <= 0) {
    throw new Error('Invalid targetAmount. Must be a positive number.');
  }

  if (!recipientAddress || !recipientAddress.startsWith('r')) {
    throw new Error('Invalid recipientAddress. Must be a valid XRPL address.');
  }

  if (signers.length === 0) {
    throw new Error('At least one signer is required for multi-sig.');
  }

  const vaultId = generateVaultId();
  const vault = {
    id: vaultId,
    targetAmount: targetAmount.toString(),
    currentAmount: '0',
    maxAmount: targetAmount.toString(),
    tokenSymbol,
    tokensToMint: targetAmount.toString(),
    recipientAddress,
    status: 'FUNDING',
    multisig: {
      signers,
      requiredSignatures,
    },
    investors: [] as any[],
    transactionHash: null,
    createdAt: new Date(),
    completedAt: null,
  };

  vaults[vaultId] = vault;

  return {
    success: true,
    vaultId: vault.id,
    targetAmount: formatUSDC(vault.targetAmount),
    status: vault.status,
    message: `Vault créé avec succès. Objectif : ${formatUSDC(vault.targetAmount)} USDC`,
  };
};

/**
 * Contribuer à un vault
 */
export const contributeToVault = async (
  vaultId: string,
  investorAddress: string,
  amount: string | number
): Promise<any> => {
  const vault = vaults[vaultId];
  if (!vault) {
    throw new Error(`Vault ${vaultId} not found.`);
  }

  // Validations
  if (!investorAddress || !investorAddress.startsWith('r')) {
    throw new Error('Invalid investorAddress. Must be a valid XRPL address.');
  }

  const amountNum = parseFloat(amount.toString());
  if (isNaN(amountNum) || amountNum <= 0) {
    throw new Error('Invalid amount. Must be a positive number.');
  }

  if (vault.status === 'COMPLETED') {
    throw new Error('This vault is already completed. No more contributions allowed.');
  }

  const newTotal = parseFloat(vault.currentAmount) + amountNum;
  const maxAmount = parseFloat(vault.maxAmount);

  if (newTotal > maxAmount) {
    const remaining = maxAmount - parseFloat(vault.currentAmount);
    throw new Error(
      `Contribution exceeds vault limit. Max remaining: ${formatUSDC(remaining)} USDC. You tried to contribute: ${formatUSDC(amount)} USDC.`
    );
  }

  // Ajouter l'investisseur
  const existingInvestor = vault.investors.find((inv: any) => inv.address === investorAddress);
  if (existingInvestor) {
    existingInvestor.amount = (parseFloat(existingInvestor.amount) + amountNum).toString();
  } else {
    vault.investors.push({
      address: investorAddress,
      amount: amount.toString(),
      tokensMinted: '0',
    });
  }

  vault.currentAmount = newTotal.toString();

  const isComplete = newTotal >= maxAmount;

  return {
    success: true,
    vaultId,
    contributionAmount: formatUSDC(amount),
    totalRaised: formatUSDC(vault.currentAmount),
    targetAmount: formatUSDC(vault.targetAmount),
    remaining: formatUSDC(maxAmount - newTotal),
    progress: Math.min(100, (newTotal / maxAmount) * 100).toFixed(2),
    objectiveReached: isComplete,
    message: isComplete
      ? `✅ Objectif atteint! Finalization en cours...`
      : `Contribution enregistrée. ${formatUSDC(maxAmount - newTotal)} USDC restants.`,
  };
};

/**
 * Récupérer l'état d'un vault
 */
export const getVaultStatus = (vaultId: string): any => {
  const vault = vaults[vaultId];
  if (!vault) {
    throw new Error(`Vault ${vaultId} not found.`);
  }

  const targetAmount = parseFloat(vault.targetAmount);
  const currentAmount = parseFloat(vault.currentAmount);

  return {
    vaultId: vault.id,
    status: vault.status,
    tokenSymbol: vault.tokenSymbol,
    targetAmount: formatUSDC(vault.targetAmount),
    currentAmount: formatUSDC(vault.currentAmount),
    remaining: formatUSDC(targetAmount - currentAmount),
    progress: Math.min(100, (currentAmount / targetAmount) * 100).toFixed(2),
    recipientAddress: vault.recipientAddress,
    investorsCount: vault.investors.length,
    investors: vault.investors.map((inv: any) => ({
      address: inv.address,
      amount: formatUSDC(inv.amount),
      tokensMinted: inv.tokensMinted,
    })),
    multisig: {
      signers: vault.multisig.signers,
      requiredSignatures: vault.multisig.requiredSignatures,
    },
    createdAt: vault.createdAt,
    completedAt: vault.completedAt,
    transactionHash: vault.transactionHash,
  };
};

/**
 * Finaliser un vault
 */
export const finalizeVault = async (vaultId: string, signatures: string[] = []): Promise<any> => {
  const vault = vaults[vaultId];
  if (!vault) {
    throw new Error(`Vault ${vaultId} not found.`);
  }

  const targetAmount = parseFloat(vault.targetAmount);
  const currentAmount = parseFloat(vault.currentAmount);

  if (currentAmount < targetAmount) {
    throw new Error(
      `Objective not reached yet. Current: ${formatUSDC(currentAmount)} / Target: ${formatUSDC(targetAmount)}`
    );
  }

  if (vault.status === 'COMPLETED') {
    throw new Error('This vault is already finalized.');
  }

  if (signatures.length < vault.multisig.requiredSignatures) {
    throw new Error(
      `Not enough signatures. Required: ${vault.multisig.requiredSignatures}, Provided: ${signatures.length}`
    );
  }

  let totalMinted = 0;
  const updatedInvestors = vault.investors.map((investor: any) => {
    const amount = parseFloat(investor.amount);
    totalMinted += amount;
    return {
      ...investor,
      tokensMinted: amount.toString(),
    };
  });

  const txHash = 'SIMULATED_TX_' + Date.now();

  vault.status = 'COMPLETED';
  vault.transactionHash = txHash;
  vault.completedAt = new Date();
  vault.investors = updatedInvestors;

  return {
    success: true,
    message: `✅ Vault finalized successfully!`,
    vaultId,
    status: vault.status,
    totalMinted: formatUSDC(totalMinted),
    investors: updatedInvestors.map((inv: any) => ({
      address: inv.address,
      amount: formatUSDC(inv.amount),
      tokensMinted: formatUSDC(inv.tokensMinted),
    })),
    recipientAddress: vault.recipientAddress,
    transactionHash: vault.transactionHash,
    completedAt: vault.completedAt,
  };
};

/**
 * Lister tous les vaults
 */
export const listAllVaults = (): any => {
  const vaultList = Object.values(vaults);

  return {
    total: vaultList.length,
    vaults: vaultList.map((vault) => {
      const targetAmount = parseFloat(vault.targetAmount);
      const currentAmount = parseFloat(vault.currentAmount);
      return {
        vaultId: vault.id,
        status: vault.status,
        targetAmount: formatUSDC(vault.targetAmount),
        currentAmount: formatUSDC(vault.currentAmount),
        progress: ((currentAmount / targetAmount) * 100).toFixed(2),
        investorsCount: vault.investors.length,
        createdAt: vault.createdAt,
      };
    }),
  };
};

/**
 * Réinitialiser l'état (dev)
 */
export const resetVaults = (): any => {
  vaults = {};
  return { success: true, message: 'All vaults have been reset.' };
};
