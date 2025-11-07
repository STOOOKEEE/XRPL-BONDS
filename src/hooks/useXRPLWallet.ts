import { useState, useCallback, useEffect } from 'react';

interface XRPLWallet {
  address: string;
  publicKey: string;
}

interface UseXRPLWalletReturn {
  wallet: XRPLWallet | null;
  loading: boolean;
  error: string | null;
  isConnected: boolean;
  connect: () => Promise<XRPLWallet>;
  disconnect: () => void;
  signTransaction: (transaction: any) => Promise<any>;
  isCrossmarkAvailable: boolean;
}

/**
 * Hook React pour la connexion wallet avec Crossmark
 * Crossmark est une extension de navigateur pour signer les transactions XRPL
 */
export const useXRPLWallet = (): UseXRPLWalletReturn => {
  const [wallet, setWallet] = useState<XRPLWallet | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [crossmarkAvailable, setCrossmarkAvailable] = useState(false);

  // Vérifier si Crossmark est disponible
  const isCrossmarkAvailable = useCallback(() => {
    return typeof window !== 'undefined' && !!(window as any).crossmark;
  }, []);

  // Connecter le wallet
  const connect = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!isCrossmarkAvailable()) {
        throw new Error(
          'Crossmark extension not found. Please install Crossmark from https://www.crossmark.io/'
        );
      }

      // Demander l'accès au compte
      const response = await (window as any).crossmark.request({
        method: 'xrpl_getAccount',
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const account = response.result.account;
      setWallet({
        address: account.address,
        publicKey: account.publicKey,
      });
      setIsConnected(true);
      
      console.log('✅ Wallet connected:', account.address);
      return account;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      console.error('❌ Error connecting wallet:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isCrossmarkAvailable]);

  // Déconnecter le wallet
  const disconnect = useCallback(() => {
    setWallet(null);
    setIsConnected(false);
    console.log('🔓 Wallet disconnected');
  }, []);

  // Signer une transaction
  const signTransaction = useCallback(async (transaction: any) => {
    if (!wallet) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);

    try {
      const response = await (window as any).crossmark.request({
        method: 'xrpl_signAndSubmit',
        params: {
          transaction,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [wallet]);

  // Vérifier la disponibilité de Crossmark
  useEffect(() => {
    setCrossmarkAvailable(isCrossmarkAvailable());
  }, [isCrossmarkAvailable]);

  // Vérifier la connexion à la montée
  useEffect(() => {
    const checkConnection = async () => {
      if (isCrossmarkAvailable()) {
        try {
          const response = await (window as any).crossmark.request({
            method: 'xrpl_getAccount',
          });
          
          if (response.result && !response.error) {
            const account = response.result.account;
            setWallet({
              address: account.address,
              publicKey: account.publicKey,
            });
            setIsConnected(true);
          }
        } catch (err) {
          // Pas connecté, c'est ok
        }
      }
    };

    checkConnection();
  }, [isCrossmarkAvailable]);

  return {
    wallet,
    loading,
    error,
    isConnected,
    connect,
    disconnect,
    signTransaction,
    isCrossmarkAvailable: crossmarkAvailable,
  };
};
