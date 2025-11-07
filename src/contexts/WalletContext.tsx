'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useXRPLWallet } from '@/hooks/useXRPLWallet';

interface WalletContextType {
  wallet: { address: string; publicKey: string } | null;
  loading: boolean;
  error: string | null;
  isConnected: boolean;
  connect: () => Promise<any>;
  disconnect: () => void;
  signTransaction: (transaction: any) => Promise<any>;
  isCrossmarkAvailable: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

/**
 * Provider de contexte pour le wallet XRPL
 * À wrapper autour de votre app pour accéder au wallet partout
 */
export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const wallet = useXRPLWallet();

  return (
    <WalletContext.Provider value={wallet}>
      {children}
    </WalletContext.Provider>
  );
};

/**
 * Hook pour accéder au wallet depuis n'importe quel composant
 */
export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
};
