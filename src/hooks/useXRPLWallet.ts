import { useState, useCallback, useEffect, useRef } from 'react';
import { WalletManager, XamanAdapter, CrossmarkAdapter } from 'xrpl-connect';

interface XRPLWallet {
  address: string;
  publicKey?: string;
}

interface UseXRPLWalletReturn {
  wallet: XRPLWallet | null;
  loading: boolean;
  error: string | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  signTransaction: (transaction: any) => Promise<any>;
  walletManager: WalletManager | null;
}


export const useXRPLWallet = (): UseXRPLWalletReturn => {
  const [wallet, setWallet] = useState<XRPLWallet | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [walletManager, setWalletManager] = useState<WalletManager | null>(null);
  const initializingRef = useRef(false);

  // Initialiser le WalletManager une seule fois
  useEffect(() => {
    if (initializingRef.current || typeof window === 'undefined') return;
    initializingRef.current = true;

    try {
      console.log('📱 Initializing WalletManager...');
      
      // Créer le WalletManager avec les adapters
      const manager = new WalletManager({
        adapters: [
          new XamanAdapter(),
          new CrossmarkAdapter(),
        ],
        network: 'testnet',
        autoConnect: true, // Ne pas connecter automatiquement
      });

      // Écouter les événements de connexion
      manager.on('connect', (account: any) => {
        console.log('✅ WalletManager connected:', account);
        setWallet({
          address: account.address,
          publicKey: account.publicKey,
        });
        setIsConnected(true);
        setError(null);
      });

      // Écouter les événements de déconnexion
      manager.on('disconnect', () => {
        console.log('🔓 WalletManager disconnected');
        setWallet(null);
        setIsConnected(false);
      });

      // Écouter les erreurs
      manager.on('error', (err: any) => {
        console.error('❌ WalletManager error:', err);
        const errorMsg = err instanceof Error ? err.message : String(err);
        setError(errorMsg);
      });

      setWalletManager(manager);
      console.log('✅ WalletManager initialized');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to initialize WalletManager';
      console.error('❌ Initialization error:', err);
      setError(errorMsg);
    }
  }, []);

  // Connecter le wallet
  const connect = useCallback(async () => {
    if (!walletManager) {
      const msg = 'WalletManager not initialized';
      console.error('❌', msg);
      setError(msg);
      throw new Error(msg);
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔗 Attempting to connect wallet...');
      
      // Le WalletManager s'occupe de tout : détection et connexion
      await walletManager.connect();
      
      console.log('✅ Wallet connected successfully');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error during connection';
      console.error('❌ Connection error:', err);
      
      // Fournir des instructions d'installation si le wallet n'est pas détecté
      if (errorMsg.includes('No adapter') || errorMsg.includes('not available')) {
        setError(
          '❌ No XRPL wallet detected.\n\n' +
          'Please install:\n' +
          '• Xaman: https://xaman.app/\n' +
          '• Crossmark: https://www.crossmark.io/'
        );
      } else {
        setError(errorMsg);
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [walletManager]);

  // Déconnecter le wallet
  const disconnect = useCallback(async () => {
    if (!walletManager) return;

    try {
      console.log('🔓 Disconnecting wallet...');
      await walletManager.disconnect();
      console.log('✅ Wallet disconnected');
    } catch (err) {
      console.error('❌ Disconnect error:', err);
    }
  }, [walletManager]);

  // Signer une transaction
  const signTransaction = useCallback(async (transaction: any) => {
    if (!walletManager) {
      throw new Error('WalletManager not initialized');
    }

    if (!isConnected || !walletManager.account) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);

    try {
      console.log('📝 Signing transaction...');

      // Ajouter l'account au transaction s'il n'y est pas
      const tx = {
        ...transaction,
        Account: transaction.Account || walletManager.account.address,
      };

      // Signer et soumettre
      const signed = await walletManager.sign(tx);
      
      console.log('✅ Transaction signed:', signed);
      return signed;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error during signing';
      console.error('❌ Signing error:', err);
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [walletManager, isConnected]);

  return {
    wallet,
    loading,
    error,
    isConnected,
    connect,
    disconnect,
    signTransaction,
    walletManager,
  };
};
