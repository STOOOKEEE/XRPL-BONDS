'use client';

/**
 * Exemple complet d'utilisation du Marketplace XRPL Bonds
 * Avec xrpl-connect pour la gestion du wallet
 */

import { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { useVault } from '@/hooks/useVault';
import { WalletConnect } from '@/components/WalletConnect';
import styles from './examples.module.css';

export default function ExamplesPage() {
  const { wallet, isConnected, signTransaction } = useWallet();
  const { createVault, contribute, getStatus, finalize, listAll, loading, error } = useVault();
  
  const [currentExample, setCurrentExample] = useState('1');
  const [output, setOutput] = useState('');

  // Exemple 1: Créer un vault
  const example1 = async () => {
    try {
      setOutput('⏳ Creating vault...');
      const result = await createVault({
        targetAmount: '1000',
        tokenSymbol: 'MTP',
        recipientAddress: wallet?.address || 'rN7n7otQDd6FczFgLdlqXRwRQULis8wbgr',
        signers: [
          { address: 'rHb9CJAWyB4GB55kcNq6dkV6sPrwfWzHE', weight: 1 },
          { address: 'rPEPPER7kfTD9w2To4CQk6UCfuHM9c6GDY', weight: 1 },
        ],
        requiredSignatures: 2,
      });
      
      setOutput(`✅ Vault créé!\n\n${JSON.stringify(result, null, 2)}`);
      
      // Sauvegarder le vaultId pour les exemples suivants
      localStorage.setItem('lastVaultId', result.vaultId);
    } catch (err) {
      setOutput(`❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Exemple 2: Contribuer à un vault
  const example2 = async () => {
    try {
      const vaultId = localStorage.getItem('lastVaultId');
      if (!vaultId) {
        setOutput('❌ No vault found. Create a vault first (Example 1)');
        return;
      }

      setOutput('⏳ Contributing to vault...');
      const result = await contribute(vaultId, wallet?.address || 'rXXX', '100');
      
      setOutput(`✅ Contribution successful!\n\n${JSON.stringify(result, null, 2)}`);
    } catch (err) {
      setOutput(`❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Exemple 3: Récupérer le statut
  const example3 = async () => {
    try {
      const vaultId = localStorage.getItem('lastVaultId');
      if (!vaultId) {
        setOutput('❌ No vault found. Create a vault first (Example 1)');
        return;
      }

      setOutput('⏳ Fetching vault status...');
      const status = getStatus(vaultId);
      
      setOutput(`📊 Vault Status:\n\n${JSON.stringify(status, null, 2)}`);
    } catch (err) {
      setOutput(`❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Exemple 4: Lister tous les vaults
  const example4 = () => {
    try {
      setOutput('⏳ Fetching all vaults...');
      const result = listAll();
      
      setOutput(`📋 All Vaults:\n\n${JSON.stringify(result, null, 2)}`);
    } catch (err) {
      setOutput(`❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Exemple 5: Démontrer la signature
  const example5 = async () => {
    try {
      setOutput('⏳ Signing transaction with xrpl-connect...');
      
      // Transaction de test (ne sera pas vraiment exécutée)
      const testTx = {
        account: wallet?.address,
        destination: 'rN7n7otQDd6FczFgLdlqXRwRQULis8wbgr',
        amount: '1000000', // 1 XRP en drops
        fee: '12',
        sequence: 1,
        transactionType: 'Payment',
      };

      const signed = await signTransaction(testTx);
      setOutput(`✅ Transaction signed!\n\n${JSON.stringify(signed, null, 2)}`);
    } catch (err) {
      setOutput(`❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const examples = [
    {
      id: '1',
      title: '📝 Créer un Vault',
      description: 'Crée un nouveau vault avec un objectif de 1000 USDC',
      fn: example1,
    },
    {
      id: '2',
      title: '💳 Contribuer 100 USDC',
      description: 'Ajoute 100 USDC au dernier vault créé',
      fn: example2,
    },
    {
      id: '3',
      title: '📊 Voir le Statut',
      description: 'Affiche les détails du vault (progress, investisseurs, etc)',
      fn: example3,
    },
    {
      id: '4',
      title: '📋 Lister tous les Vaults',
      description: 'Affiche la liste de tous les vaults créés',
      fn: example4,
    },
    {
      id: '5',
      title: '🔐 Signer une Transaction',
      description: 'Démontre la signature avec xrpl-connect',
      fn: example5,
    },
  ];

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1>🧪 Examples - XRPL Bonds</h1>
          <WalletConnect />
        </header>

        {isConnected && wallet ? (
          <div className={styles.content}>
            <section className={styles.section}>
              <h2>Connected Wallet</h2>
              <div className={styles.walletInfo}>
                <p><strong>Address:</strong> {wallet.address}</p>
              </div>
            </section>

            <section className={styles.section}>
              <h2>Available Examples</h2>
              <div className={styles.examplesGrid}>
                {examples.map((example) => (
                  <button
                    key={example.id}
                    onClick={example.fn}
                    disabled={loading}
                    className={`${styles.exampleBtn} ${currentExample === example.id ? styles.active : ''}`}
                  >
                    <div className={styles.btnTitle}>{example.title}</div>
                    <div className={styles.btnDesc}>{example.description}</div>
                  </button>
                ))}
              </div>
            </section>

            <section className={styles.section}>
              <h2>Output</h2>
              <pre className={styles.output}>
                {output || 'Click an example to see the output here...'}
              </pre>
            </section>

            <section className={styles.section}>
              <h2>📚 How to Use</h2>
              <div className={styles.instructions}>
                <ol>
                  <li>Connect your wallet using the button above</li>
                  <li>Click on an example to execute it</li>
                  <li>Check the output below to see results</li>
                  <li>Try different combinations</li>
                </ol>
                <p>
                  💡 <strong>Tip:</strong> Run Example 1 first to create a vault, then use Examples 2-4 with that vault.
                </p>
              </div>
            </section>
          </div>
        ) : (
          <div className={styles.message}>
            <p>👋 Please connect your wallet to see examples</p>
          </div>
        )}

        {error && <p className={styles.error}>{error}</p>}
      </div>
    </main>
  );
}
