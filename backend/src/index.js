/**
 * Index principal - Exporte tous les utilitaires XRPL Bonds
 * À utiliser depuis React/Next.js
 */

export { initXRPL, getXRPLClient, closeXRPL } from './config/xrpl.js';
export { 
  dateToRippleTime,
  rippleTimeToDate,
  addDays,
  xrpToDrops,
  dropsToXrp,
  isValidAddress,
  isValidAmount,
  generateVaultId,
  formatUSDC,
} from './utils/conversions.js';

export * as VaultModel from './models/Vault.js';
export * as VaultOps from './lib/vaultOps.js';
