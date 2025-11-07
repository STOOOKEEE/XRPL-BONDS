'use client';

import { useWallet } from '@/contexts/WalletContext';
import styles from './WalletConnect.module.css';

export const WalletConnect = () => {
  const { wallet, isConnected, loading, error, connect, disconnect } = useWallet();

  if (isConnected && wallet) {
    return (
      <div className={styles.container}>
        <div className={styles.connected}>
          <span className={styles.address}>
            ✅ {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
          </span>
          <button onClick={disconnect} className={styles.disconnectButton}>
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <button 
        onClick={connect} 
        disabled={loading}
        className={styles.connectButton}
      >
        {loading ? '🔄 Connecting...' : '🔐 Connect Wallet'}
      </button>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
};
