import { useState, useCallback, useEffect } from 'react';

interface XRPLWallet {
  address: string;
  publicKey?: string;
}

interface UseXRPLWalletReturn {
  wallet: XRPLWallet | null;
  loading: boolean;
  error: string | null;
  isConnected: boolean;
  connect: () => Promise<XRPLWallet>;
  disconnect: () => void;
  signTransaction: (transaction: any) => Promise<any>;
}

/**
 * Hook React pour la connexion wallet avec xrpl-connect
 * Supporte : Xaman, Crossmark, et autres wallets XRPL
 */
export const useXRPLWallet = (): UseXRPLWalletReturn => {
  const [wallet, setWallet] = useState<XRPLWallet | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Vérifier si un wallet est disponible
  const hasWalletExtension = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;
    
    // Vérifier Crossmark
    if ((window as any).crossmark) return true;
    
    // Vérifier Xaman (ex-XUMM)
    if ((window as any).xaman) return true;
    
    return false;
  }, []);

  // Connecter le wallet
  const connect = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Vérifier les extensions disponibles
      if (!hasWalletExtension()) {
        throw new Error(
          '❌ No XRPL wallet detected.\n\nPlease install:\n' +
          '• Xaman (mobile): https://xaman.app/\n' +
          '• Crossmark (desktop): https://www.crossmark.io/'
        );
      }

      let response;

      // Essayer Crossmark d'abord
      if ((window as any).crossmark) {
        console.log('🔗 Connecting with Crossmark...');
        response = await (window as any).crossmark.request({
          method: 'xrpl_getAccount',
        });
      }
      // Sinon essayer Xaman
      else if ((window as any).xaman) {
        console.log('🔗 Connecting with Xaman...');
        response = await (window as any).xaman.request({
          method: 'xrpl_getAccount',
        });
      } else {
        throw new Error('No wallet found');
      }

      // Vérifier les erreurs
      if (!response) {
        throw new Error('No response from wallet');
      }

      if (response.error) {
        throw new Error(response.error.message || 'Wallet error');
      }

      // Extraire l'adresse - compatible avec Crossmark et Xaman
      const account = response.account || response.result?.account;
      if (!account) {
        console.error('Wallet response:', response);
        throw new Error('Could not extract account from wallet response');
      }

      const address = account.address || account;
      const publicKey = account.publicKey || response.publicKey;

      setWallet({
        address,
        publicKey,
      });
      setIsConnected(true);
      
      console.log('✅ Wallet connected:', address);
      return { address, publicKey };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      console.error('❌ Error connecting wallet:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [hasWalletExtension]);

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
      let response;

      // Essayer Crossmark
      if ((window as any).crossmark) {
        response = await (window as any).crossmark.request({
          method: 'xrpl_signAndSubmit',
          params: { transaction },
        });

        if (response.error) {
          throw new Error(response.error.message);
        }

        return response.result;
      }
      // Sinon essayer Xaman
      else if ((window as any).xaman) {
        response = await (window as any).xaman.request({
          method: 'xrpl_signAndSubmit',
          params: { transaction },
        });

        if (response.error) {
          throw new Error(response.error.message);
        }

        return response.result;
      } else {
        throw new Error('No wallet available for signing');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [wallet]);

  return {
    wallet,
    loading,
    error,
    isConnected,
    connect,
    disconnect,
    signTransaction,
  };
};
