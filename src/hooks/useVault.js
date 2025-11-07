import { useState, useCallback } from 'react';
import * as VaultOps from '@/../backend/src/lib/vaultOps';

/**
 * Hook React pour gérer les vaults XRPL Bonds
 * À utiliser dans vos composants React/Next.js
 */
export const useVault = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [vaults, setVaults] = useState([]);
  const [currentVault, setCurrentVault] = useState(null);

  // Créer un nouveau vault
  const createVault = useCallback(async (options) => {
    setLoading(true);
    setError(null);
    try {
      const result = await VaultOps.createVault(options);
      setCurrentVault(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Contribuer à un vault
  const contribute = useCallback(async (vaultId, investorAddress, amount) => {
    setLoading(true);
    setError(null);
    try {
      const result = await VaultOps.contributeToVault(vaultId, investorAddress, amount);
      setCurrentVault(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Récupérer l'état du vault
  const getStatus = useCallback((vaultId) => {
    try {
      const status = VaultOps.getVaultStatus(vaultId);
      setCurrentVault(status);
      return status;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Finaliser le vault
  const finalize = useCallback(async (vaultId, signatures = []) => {
    setLoading(true);
    setError(null);
    try {
      const result = await VaultOps.finalizeVault(vaultId, signatures);
      setCurrentVault(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Lister tous les vaults
  const listAll = useCallback(() => {
    try {
      const result = VaultOps.listAllVaults();
      setVaults(result.vaults);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  return {
    loading,
    error,
    vaults,
    currentVault,
    createVault,
    contribute,
    getStatus,
    finalize,
    listAll,
  };
};
