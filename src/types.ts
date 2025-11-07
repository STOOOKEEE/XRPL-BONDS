// Types pour le WalletContext
export interface Event {
  timestamp: string;
  name: string;
  data: any;
}

export interface AccountInfo {
  address: string;
  publicKey?: string;
  network: {
    name: string;
    wss?: string;
    rpc?: string;
  };
}

export interface StatusMessage {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

// Réexporter les types de xrpl-connect qui sont utilisés
export type { WalletManager } from 'xrpl-connect';
