'use client';

import React, { createContext, useContext } from 'react';
import { useXRPLWallet } from '@/hooks/useXRPLWallet';

const WalletContext = createContext(null);

/**
 * Provider de contexte pour le wallet XRPL
 * À wrapper autour de votre app pour accéder au wallet partout
 */
export const WalletProvider = ({ children }) => {
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
