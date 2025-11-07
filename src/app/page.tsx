'use client';

import { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { useVault } from '@/hooks/useVault';
import { WalletConnect } from '@/components/WalletConnect';
import styles from './page.module.css';

export default function Home() {
  const { wallet, isConnected } = useWallet();
  const { createVault, contribute, getStatus, finalize, listAll, loading, error, currentVault } = useVault();
  
  const [vaultId, setVaultId] = useState('');
  const [amount, setAmount] = useState('100');
  const [targetAmount, setTargetAmount] = useState('1000');

  const handleCreateVault = async () => {
    try {
      const result = await createVault({
        targetAmount,
        tokenSymbol: 'MTP',
        recipientAddress: wallet?.address || 'rN7n7otQDd6FczFgLdlqXRwRQULis8wbgr',
        signers: [
          { address: 'rHb9CJAWyB4GB55kcNq6dkV6sPrwfWzHE', weight: 1 },
          { address: 'rPEPPER7kfTD9w2To4CQk6UCfuHM9c6GDY', weight: 1 },
        ],
        requiredSignatures: 2,
      });
      
      setVaultId(result.vaultId);
      alert(`✅ Vault created: ${result.vaultId}`);
    } catch (err) {
      alert(`❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleContribute = async () => {
    if (!vaultId) {
      alert('❌ Please create a vault first');
      return;
    }

    try {
      const result = await contribute(vaultId, wallet?.address || 'rXXX', amount);
      alert(`✅ Contributed ${result.contributionAmount} USDC\nProgress: ${result.progress}%`);
    } catch (err) {
      alert(`❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleGetStatus = async () => {
    if (!vaultId) {
      alert('❌ Please create a vault first');
      return;
    }

    try {
      const status = getStatus(vaultId);
      alert(`📊 Vault Status:\n${JSON.stringify(status, null, 2)}`);
    } catch (err) {
      alert(`❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleFinalize = async () => {
    if (!vaultId) {
      alert('❌ Please create a vault first');
      return;
    }

    try {
      const result = await finalize(vaultId, ['sig1', 'sig2']);
      alert(`✅ Vault finalized!\n${JSON.stringify(result, null, 2)}`);
    } catch (err) {
      alert(`❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleListVaults = () => {
    try {
      const result = listAll();
      alert(`📋 Vaults (${result.total}):\n${JSON.stringify(result.vaults, null, 2)}`);
    } catch (err) {
      alert(`❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1>🏦 XRPL Bonds Marketplace</h1>
          <WalletConnect />
        </header>

        {isConnected && wallet ? (
          <div className={styles.content}>
            <section className={styles.section}>
              <h2>📝 Create Vault</h2>
              <div className={styles.formGroup}>
                <label>Target Amount (USDC)</label>
                <input
                  type="number"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="1000"
                />
              </div>
              <button 
                onClick={handleCreateVault} 
                disabled={loading}
                className={styles.btn}
              >
                {loading ? '🔄 Creating...' : '✨ Create Vault'}
              </button>
              {vaultId && <p className={styles.success}>Vault ID: {vaultId}</p>}
            </section>

            {vaultId && (
              <>
                <section className={styles.section}>
                  <h2>💳 Contribute to Vault</h2>
                  <div className={styles.formGroup}>
                    <label>Amount (USDC)</label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="100"
                    />
                  </div>
                  <button 
                    onClick={handleContribute} 
                    disabled={loading}
                    className={styles.btn}
                  >
                    {loading ? '🔄 Contributing...' : '💰 Contribute'}
                  </button>
                </section>

                <section className={styles.section}>
                  <h2>📊 Vault Status</h2>
                  <button 
                    onClick={handleGetStatus} 
                    disabled={loading}
                    className={styles.btnSecondary}
                  >
                    🔍 Check Status
                  </button>
                  {currentVault && (
                    <div className={styles.statusBox}>
                      <p><strong>Status:</strong> {currentVault.status}</p>
                      <p><strong>Progress:</strong> {currentVault.progress}%</p>
                      <p><strong>Raised:</strong> {currentVault.currentAmount} / {currentVault.targetAmount} USDC</p>
                      <p><strong>Investors:</strong> {currentVault.investorsCount}</p>
                    </div>
                  )}
                </section>

                <section className={styles.section}>
                  <h2>🚀 Finalize Vault</h2>
                  <button 
                    onClick={handleFinalize} 
                    disabled={loading}
                    className={styles.btnDanger}
                  >
                    {loading ? '🔄 Finalizing...' : '✅ Finalize Vault'}
                  </button>
                </section>
              </>
            )}

            <section className={styles.section}>
              <h2>📋 All Vaults</h2>
              <button 
                onClick={handleListVaults}
                className={styles.btnSecondary}
              >
                📚 List Vaults
              </button>
            </section>
          </div>
        ) : (
          <div className={styles.message}>
            <p>👋 Please connect your wallet to get started</p>
          </div>
        )}

        {error && <p className={styles.error}>{error}</p>}
      </div>
    </main>
  );
}
