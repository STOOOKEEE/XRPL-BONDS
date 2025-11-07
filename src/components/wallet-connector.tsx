'use client';

import { useEffect, useRef } from 'react';
import { useWallet } from '@/context/WalletContext';
import { createWalletManager } from '@/lib/wallet-manager';

// Import du package UI pour enregistrer le web component
// Note: xrpl-connect 0.3.0 pourrait ne pas avoir le web component
// Cette implémentation est préparée pour la version complète

/**
 * Composant wrapper pour le web component xrpl-wallet-connector
 * Gère l'initialisation du WalletManager et les événements
 */
export function WalletConnector() {
  const connectorRef = useRef<any>(null);
  const {
    walletManager,
    setWalletManager,
    setIsConnected,
    setAccountInfo,
    addEvent,
    showStatus,
  } = useWallet();

  // Initialisation du WalletManager
  useEffect(() => {
    if (!walletManager) {
      const manager = createWalletManager();
      setWalletManager(manager);

      // Écouter les événements du WalletManager
      manager.on('connect', (account: any) => {
        console.log('✅ Wallet connecté:', account);
        setIsConnected(true);
        setAccountInfo(account);
        addEvent('connect', account);
        showStatus(`Connecté à ${account.address}`, 'success');
      });

      manager.on('disconnect', () => {
        console.log('❌ Wallet déconnecté');
        setIsConnected(false);
        setAccountInfo(null);
        addEvent('disconnect', {});
        showStatus('Wallet déconnecté', 'info');
      });

      manager.on('accountChanged', (account: any) => {
        console.log('🔄 Compte changé:', account);
        setAccountInfo(account);
        addEvent('accountChanged', account);
        showStatus('Compte changé', 'info');
      });

      manager.on('error', (error: any) => {
        console.error('❌ Erreur wallet:', error);
        addEvent('error', error);
        showStatus(error.message || 'Erreur de connexion', 'error');
      });
    }
  }, [walletManager, setWalletManager, setIsConnected, setAccountInfo, addEvent, showStatus]);

  // Configuration du web component (si disponible)
  useEffect(() => {
    const setupWebComponent = async () => {
      if (typeof window === 'undefined') return;

      try {
        // Attendre que le custom element soit défini
        if (customElements && customElements.whenDefined) {
          await customElements.whenDefined('xrpl-wallet-connector');
        }

        const connector = connectorRef.current;
        if (connector && walletManager) {
          // Appeler setWalletManager sur le web component
          if (typeof connector.setWalletManager === 'function') {
            connector.setWalletManager(walletManager);
            console.log('✅ Web component configuré');
          }
        }
      } catch (error) {
        console.warn('⚠️ Web component non disponible dans xrpl-connect 0.3.0:', error);
      }
    };

    setupWebComponent();
  }, [walletManager]);

  // Dans xrpl-connect 0.3.0, le web component n'est pas encore disponible
  // On retourne null pour l'instant, l'intégration se fera via wallet-button.tsx
  return null;
}
