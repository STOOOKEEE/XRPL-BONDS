'use client';

import { WalletManager } from 'xrpl-connect';
import { XamanAdapter } from 'xrpl-connect';
import { WalletConnectAdapter } from 'xrpl-connect';
import { CrossmarkAdapter } from 'xrpl-connect';
import { GemWalletAdapter } from 'xrpl-connect';

// Configuration des API keys depuis les variables d'environnement
const XAMAN_API_KEY = process.env.NEXT_PUBLIC_XAMAN_API_KEY || '';
const WALLETCONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

/**
 * Crée et configure le WalletManager avec tous les adaptateurs
 * - Xaman: OAuth wallet (nécessite API key)
 * - WalletConnect: QR code universel (nécessite Project ID)
 * - Crossmark: Extension navigateur (pas d'API key)
 * - GemWallet: Extension navigateur (pas d'API key)
 */
export function createWalletManager(): WalletManager {
  const adapters = [];

  // Xaman (ex-XUMM) - OAuth wallet avec popup
  if (XAMAN_API_KEY && XAMAN_API_KEY !== 'your-xaman-api-key-here') {
    adapters.push(new XamanAdapter());
    console.info('✅ Xaman adapter activé');
  } else {
    console.warn(
      '⚠️ Xaman API key non configurée. Xaman wallet désactivé. Obtenez une clé sur https://apps.xumm.dev/'
    );
  }

  // WalletConnect - QR code multi-wallet
  if (WALLETCONNECT_PROJECT_ID && WALLETCONNECT_PROJECT_ID !== 'your-walletconnect-project-id-here') {
    adapters.push(new WalletConnectAdapter());
    console.info('✅ WalletConnect adapter activé');
  } else {
    console.warn(
      '⚠️ WalletConnect Project ID non configuré. WalletConnect désactivé. Obtenez un ID sur https://cloud.walletconnect.com'
    );
  }

  // Crossmark - Extension navigateur (toujours disponible)
  adapters.push(new CrossmarkAdapter());
  console.info('✅ Crossmark adapter activé');

  // GemWallet - Extension navigateur (toujours disponible)
  adapters.push(new GemWalletAdapter());
  console.info('✅ GemWallet adapter activé');

  // Création du WalletManager
  const walletManager = new WalletManager({
    adapters,
    network: 'testnet', // Change to 'mainnet' for production
    autoConnect: true, // Reconnecte automatiquement au dernier wallet
  });

  console.info(`🎯 WalletManager créé avec ${adapters.length} adaptateurs`);

  return walletManager;
}
