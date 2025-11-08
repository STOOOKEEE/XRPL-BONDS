/**
 * Utilitaires pour WalletConnect avec XRPL
 * Utilise l'adaptateur WalletConnect de xrpl-connect
 */

import { WalletConnectAdapter } from 'xrpl-connect';

export interface WalletConnectConfig {
  projectId: string;
  metadata?: {
    name: string;
    description: string;
    url: string;
    icons: string[];
  };
}

/**
 * Crée et initialise un adaptateur WalletConnect
 */
export async function createWalletConnectAdapter(
  projectId: string
): Promise<WalletConnectAdapter> {
  console.log('🔧 Création de l\'adaptateur WalletConnect...');
  console.log('📋 Project ID:', projectId.substring(0, 8) + '...');

  const adapter = new WalletConnectAdapter({
    projectId,
    metadata: {
      name: 'XRPL Corporate Bonds',
      description: 'Invest in tokenized corporate bonds on XRPL',
      url: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
      icons: [
        typeof window !== 'undefined' 
          ? `${window.location.origin}/icon.svg`
          : 'http://localhost:3000/icon.svg'
      ],
    },
  });

  console.log('✅ Adaptateur WalletConnect créé');
  return adapter;
}

/**
 * Obtient l'URI WalletConnect pour le QR code
 */
export async function getWalletConnectUri(
  adapter: WalletConnectAdapter
): Promise<string> {
  // L'URI devrait être disponible après l'initialisation
  // Selon l'implémentation de xrpl-connect
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Timeout: URI WalletConnect non reçu'));
    }, 30000);

    // Écouter l'événement d'URI (si disponible dans xrpl-connect)
    if (typeof (adapter as any).on === 'function') {
      (adapter as any).on('display_uri', (uri: string) => {
        clearTimeout(timeout);
        resolve(uri);
      });
    } else {
      clearTimeout(timeout);
      reject(new Error('L\'adaptateur ne supporte pas les événements URI'));
    }
  });
}
