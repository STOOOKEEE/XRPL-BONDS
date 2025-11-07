import { useState, useCallback } from 'react';
import * as VaultOps from '@/lib/vaultOps';

interface VaultResult {
  success: boolean;
  message: string;
  [key: string]: any;
}

interface UseVaultReturn {
  loading: boolean;
  error: string | null;
  vaults: any[];
  currentVault: any | null;
  createVault: (options: any) => Promise<any>;
  contribute: (vaultId: string, investorAddress: string, amount: string) => Promise<any>;
  getStatus: (vaultId: string) => any;
  finalize: (vaultId: string, signatures?: string[]) => Promise<any>;
  listAll: () => any;
}

/**
 * Hook React pour gérer les vaults XRPL Bonds
 * À utiliser dans vos composants React/Next.js
 */
export const useVault = (): UseVaultReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vaults, setVaults] = useState<any[]>([]);
  const [currentVault, setCurrentVault] = useState<any | null>(null);

  // Créer un nouveau vault
  const createVault = useCallback(async (options: any) => {
    setLoading(true);
    setError(null);
    try {
      const result = await VaultOps.createVault(options);
      setCurrentVault(result);
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Contribuer à un vault
  const contribute = useCallback(async (vaultId: string, investorAddress: string, amount: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await VaultOps.contributeToVault(vaultId, investorAddress, amount);
      setCurrentVault(result);
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Récupérer l'état du vault
  const getStatus = useCallback((vaultId: string) => {
    try {
      const status = VaultOps.getVaultStatus(vaultId);
      setCurrentVault(status);
      return status;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      throw err;
    }
  }, []);

  // Finaliser le vault
  const finalize = useCallback(async (vaultId: string, signatures: string[] = []) => {
    setLoading(true);
    setError(null);
    try {
      const result = await VaultOps.finalizeVault(vaultId, signatures);
      setCurrentVault(result);
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
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
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
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
