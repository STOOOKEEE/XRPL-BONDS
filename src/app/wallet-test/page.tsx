'use client';

import { useWallet } from '@/contexts/WalletContext';
import styles from './page.module.css';
import { useState } from 'react';

export default function WalletTestPage() {
  const { wallet, loading, error, isConnected, connect, disconnect, signTransaction } = useWallet();
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);

  const handleTestTransaction = async () => {
    if (!wallet) {
      setTestResult('❌ Wallet not connected');
      return;
    }

    setTestLoading(true);
    setTestResult('🔄 Testing transaction signing...');

    try {
      // Create a simple test transaction (not submitting, just testing signature)
      const testTx = {
        Account: wallet.address,
        TransactionType: 'Payment',
        Destination: 'rLHzPsX6oXkzU9qL8RYvJwqBtWYvuQWkAz',
        Amount: '1000000', // 1 XRP in drops
        Fee: '12',
      };

      const result = await signTransaction(testTx);
      
      setTestResult(
        '✅ Transaction signed successfully!\n\n' +
        'Response:\n' +
        JSON.stringify(result, null, 2)
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setTestResult(`❌ Error: ${message}`);
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>🔐 XRPL Wallet Connection Test</h1>

        <section className={styles.section}>
          <h2>Connection Status</h2>
          <div className={styles.statusBox}>
            {isConnected ? (
              <>
                <p style={{ color: '#4caf50' }}>✅ Wallet Connected</p>
                <p>
                  <strong>Address:</strong> <code>{wallet?.address}</code>
                </p>
                {wallet?.publicKey && (
                  <p>
                    <strong>Public Key:</strong> <code>{wallet.publicKey}</code>
                  </p>
                )}
              </>
            ) : (
              <>
                <p style={{ color: '#ff9800' }}>⏳ Not Connected</p>
                <p>Click the button below to connect your wallet</p>
              </>
            )}
          </div>
        </section>

        <section className={styles.section}>
          <h2>Wallet Controls</h2>
          <div className={styles.buttonGroup}>
            {!isConnected ? (
              <button 
                onClick={connect}
                disabled={loading}
                className={styles.primaryButton}
              >
                {loading ? '🔄 Connecting...' : '🔐 Connect Wallet'}
              </button>
            ) : (
              <button 
                onClick={disconnect}
                className={styles.dangerButton}
              >
                🔓 Disconnect Wallet
              </button>
            )}
          </div>
          {error && (
            <div className={styles.errorBox}>
              <p>{error}</p>
            </div>
          )}
        </section>

        <section className={styles.section}>
          <h2>Transaction Test</h2>
          <p>Test wallet signing capability by signing a dummy transaction.</p>
          <button 
            onClick={handleTestTransaction}
            disabled={!isConnected || testLoading}
            className={styles.primaryButton}
          >
            {testLoading ? '🔄 Testing...' : '📝 Test Transaction Signing'}
          </button>
          {testResult && (
            <div className={styles.resultBox}>
              <pre>{testResult}</pre>
            </div>
          )}
        </section>

        <section className={styles.section}>
          <h2>🔗 Supported Wallets</h2>
          <div className={styles.walletList}>
            <div className={styles.walletItem}>
              <h3>Crossmark</h3>
              <p>Browser extension for desktop</p>
              <a href="https://www.crossmark.io/" target="_blank" rel="noopener noreferrer" className={styles.link}>
                Install Crossmark →
              </a>
            </div>
            <div className={styles.walletItem}>
              <h3>Xaman</h3>
              <p>Mobile app for iOS & Android (formerly XUMM)</p>
              <a href="https://xaman.app/" target="_blank" rel="noopener noreferrer" className={styles.link}>
                Install Xaman →
              </a>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2>📚 Documentation</h2>
          <ul>
            <li><a href="#" className={styles.link}>Wallet Integration Guide</a></li>
            <li><a href="https://docs.crossmark.io/" target="_blank" rel="noopener noreferrer" className={styles.link}>Crossmark Docs</a></li>
            <li><a href="https://xaman.readme.io/" target="_blank" rel="noopener noreferrer" className={styles.link}>Xaman Docs</a></li>
            <li><a href="https://testnet.xrpl.org/" target="_blank" rel="noopener noreferrer" className={styles.link}>XRPL Testnet Explorer</a></li>
          </ul>
        </section>
      </main>
    </div>
  );
}
