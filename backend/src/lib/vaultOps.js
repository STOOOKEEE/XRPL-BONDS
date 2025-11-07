import * as xrpl from 'xrpl';
import { getXRPLClient, XRPL_CONFIG } from '../config/xrpl.js';
import { generateVaultId, isValidAddress, isValidAmount, formatUSDC } from '../utils/conversions.js';
import * as VaultModel from '../models/Vault.js';

/**
 * 🏗️ Créer un nouveau vault avec configuration multi-sig
 */
export const createVault = async (options) => {
  const {
    targetAmount,           // En USDC
    tokenSymbol = 'MTP',
    recipientAddress,
    signers = [],          // Liste des signataires [{ address, weight: 1 }]
    requiredSignatures = 2,
  } = options;

  // Validations
  if (!targetAmount || !isValidAmount(targetAmount)) {
    throw new Error('Invalid targetAmount. Must be a positive number.');
  }

  if (!isValidAddress(recipientAddress)) {
    throw new Error('Invalid recipientAddress. Must be a valid XRPL address.');
  }

  if (signers.length === 0) {
    throw new Error('At least one signer is required for multi-sig.');
  }

  // Vérifier que tous les signers sont des adresses valides
  for (const signer of signers) {
    if (!isValidAddress(signer.address)) {
      throw new Error(`Invalid signer address: ${signer.address}`);
    }
  }

  // Créer le vault
  const vaultId = generateVaultId();
  const vault = VaultModel.createVault({
    id: vaultId,
    targetAmount,
    maxAmount: targetAmount,
    tokenSymbol,
    tokensToMint: targetAmount, // 1:1 ratio
    recipientAddress,
    multisig: {
      signers,
      requiredSignatures,
    },
  });

  return {
    success: true,
    vaultId: vault.id,
    targetAmount: formatUSDC(vault.targetAmount),
    status: vault.status,
    message: `Vault créé avec succès. Objectif : ${formatUSDC(vault.targetAmount)} USDC`,
  };
};

/**
 * 💳 Ajouter une contribution à un vault
 */
export const contributeToVault = async (vaultId, investorAddress, amount) => {
  // Validations
  if (!isValidAddress(investorAddress)) {
    throw new Error('Invalid investorAddress. Must be a valid XRPL address.');
  }

  if (!isValidAmount(amount)) {
    throw new Error('Invalid amount. Must be a positive number.');
  }

  // Récupérer le vault
  const vault = VaultModel.getVault(vaultId);
  if (!vault) {
    throw new Error(`Vault ${vaultId} not found.`);
  }

  // Vérifier que le vault n'est pas déjà complété
  if (vault.status === 'COMPLETED') {
    throw new Error('This vault is already completed. No more contributions allowed.');
  }

  // Vérifier que la contribution ne dépasse pas le cap
  const newTotal = parseFloat(vault.currentAmount) + parseFloat(amount);
  if (newTotal > parseFloat(vault.maxAmount)) {
    const remaining = parseFloat(vault.maxAmount) - parseFloat(vault.currentAmount);
    throw new Error(
      `Contribution exceeds vault limit. Max remaining: ${formatUSDC(remaining)} USDC. You tried to contribute: ${formatUSDC(amount)} USDC.`
    );
  }

  // Ajouter l'investisseur au vault
  VaultModel.addInvestor(vaultId, investorAddress, amount);
  const updatedVault = VaultModel.getVault(vaultId);

  // Vérifier si l'objectif est atteint
  const isComplete = parseFloat(updatedVault.currentAmount) >= parseFloat(updatedVault.targetAmount);

  return {
    success: true,
    vaultId,
    contributionAmount: formatUSDC(amount),
    totalRaised: formatUSDC(updatedVault.currentAmount),
    targetAmount: formatUSDC(updatedVault.targetAmount),
    remaining: formatUSDC(
      parseFloat(updatedVault.targetAmount) - parseFloat(updatedVault.currentAmount)
    ),
    progress: Math.min(
      100,
      (parseFloat(updatedVault.currentAmount) / parseFloat(updatedVault.targetAmount)) * 100
    ).toFixed(2),
    objectiveReached: isComplete,
    message: isComplete
      ? `✅ Objectif atteint! Finalization en cours...`
      : `Contribution enregistrée. ${formatUSDC(
          parseFloat(updatedVault.targetAmount) - parseFloat(updatedVault.currentAmount)
        )} USDC restants.`,
  };
};

/**
 * 📊 Récupérer l'état d'un vault
 */
export const getVaultStatus = (vaultId) => {
  const vault = VaultModel.getVault(vaultId);
  if (!vault) {
    throw new Error(`Vault ${vaultId} not found.`);
  }

  return {
    vaultId: vault.id,
    status: vault.status,
    tokenSymbol: vault.tokenSymbol,
    targetAmount: formatUSDC(vault.targetAmount),
    currentAmount: formatUSDC(vault.currentAmount),
    remaining: formatUSDC(
      parseFloat(vault.targetAmount) - parseFloat(vault.currentAmount)
    ),
    progress: Math.min(
      100,
      (parseFloat(vault.currentAmount) / parseFloat(vault.targetAmount)) * 100
    ).toFixed(2),
    recipientAddress: vault.recipientAddress,
    investorsCount: vault.investors.length,
    investors: vault.investors.map(inv => ({
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
 * 🚀 Finaliser un vault (minter tokens + transférer fonds)
 * Accessible uniquement si objectif atteint et signataires signent
 */
export const finalizeVault = async (vaultId, signatures = []) => {
  const vault = VaultModel.getVault(vaultId);
  if (!vault) {
    throw new Error(`Vault ${vaultId} not found.`);
  }

  // Vérifier que l'objectif est atteint
  if (parseFloat(vault.currentAmount) < parseFloat(vault.targetAmount)) {
    throw new Error(
      `Objective not reached yet. Current: ${formatUSDC(vault.currentAmount)} / Target: ${formatUSDC(vault.targetAmount)}`
    );
  }

  // Vérifier que le vault n'est pas déjà complété
  if (vault.status === 'COMPLETED') {
    throw new Error('This vault is already finalized.');
  }

  // Vérifier les signatures
  if (signatures.length < vault.multisig.requiredSignatures) {
    throw new Error(
      `Not enough signatures. Required: ${vault.multisig.requiredSignatures}, Provided: ${signatures.length}`
    );
  }

  console.log(`🔄 Finalizing vault ${vaultId}...`);

  try {
    // Étape 1: Minter les tokens MTP pour chaque investisseur
    let totalMinted = 0;
    const updatedInvestors = vault.investors.map(investor => {
      const amount = investor.amount;
      totalMinted += parseFloat(amount);
      return {
        ...investor,
        tokensMinted: amount,
      };
    });

    // Étape 2: Transférer les fonds au destinataire
    // En production, faire vraiment la transaction XRPL
    const txHash = 'SIMULATED_TX_' + Date.now();

    // Mettre à jour le vault
    const finalizedVault = VaultModel.completeVault(vaultId, txHash);

    // Mettre à jour les investisseurs avec les tokens mintés
    const vaultWithTokens = VaultModel.updateVault(vaultId, {
      investors: updatedInvestors,
    });

    return {
      success: true,
      message: `✅ Vault finalized successfully!`,
      vaultId,
      status: finalizedVault.status,
      totalMinted: formatUSDC(totalMinted),
      investors: vaultWithTokens.investors.map(inv => ({
        address: inv.address,
        amount: formatUSDC(inv.amount),
        tokensMinted: formatUSDC(inv.tokensMinted),
      })),
      recipientAddress: finalizedVault.recipientAddress,
      transactionHash: finalizedVault.transactionHash,
      completedAt: finalizedVault.completedAt,
    };
  } catch (error) {
    throw new Error(`Error finalizing vault: ${error.message}`);
  }
};

/**
 * 📋 Lister tous les vaults
 */
export const listAllVaults = () => {
  const vaults = VaultModel.getAllVaults();

  return {
    total: vaults.length,
    vaults: vaults.map(vault => ({
      vaultId: vault.id,
      status: vault.status,
      targetAmount: formatUSDC(vault.targetAmount),
      currentAmount: formatUSDC(vault.currentAmount),
      progress: (
        (parseFloat(vault.currentAmount) / parseFloat(vault.targetAmount)) *
        100
      ).toFixed(2),
      investorsCount: vault.investors.length,
      createdAt: vault.createdAt,
    })),
  };
};

/**
 * 🔧 Réinitialiser l'état (dev uniquement)
 */
export const resetVaults = () => {
  VaultModel.resetStorage();
  return { success: true, message: 'All vaults have been reset.' };
};