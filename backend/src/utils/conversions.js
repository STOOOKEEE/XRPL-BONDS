import * as xrpl from 'xrpl';

/**
 * Convertir une date JavaScript en Ripple Time (secondes depuis 2000-01-01)
 */
export const dateToRippleTime = (date) => {
  if (typeof date === 'number') return date;
  if (typeof date === 'string') date = new Date(date);
  
  const rippleEpoch = new Date('2000-01-01T00:00:00Z');
  const ms = date - rippleEpoch;
  return Math.floor(ms / 1000);
};

/**
 * Convertir Ripple Time en date JavaScript
 */
export const rippleTimeToDate = (rippleTime) => {
  const rippleEpoch = new Date('2000-01-01T00:00:00Z');
  return new Date(rippleEpoch.getTime() + rippleTime * 1000);
};

/**
 * Ajouter des jours à une date
 */
export const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Convertir XRP en drops (1 XRP = 1,000,000 drops)
 */
export const xrpToDrops = (xrp) => {
  if (typeof xrp === 'string') xrp = parseFloat(xrp);
  return Math.floor(xrp * 1000000).toString();
};

/**
 * Convertir drops en XRP
 */
export const dropsToXrp = (drops) => {
  if (typeof drops === 'string') drops = parseFloat(drops);
  return (drops / 1000000).toString();
};

/**
 * Valider une adresse XRPL
 */
export const isValidAddress = (address) => {
  return xrpl.isValidAddress(address);
};

/**
 * Valider un montant (montant numérique positif)
 */
export const isValidAmount = (amount) => {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0;
};

/**
 * Générer un hash unique pour un vault
 */
export const generateVaultId = () => {
  return 'VAULT-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
};

/**
 * Formatter un montant en USDC (2 décimales)
 */
export const formatUSDC = (amount) => {
  return parseFloat(amount).toFixed(2);
};
