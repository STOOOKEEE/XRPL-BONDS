import { create } from "zustand"

type WalletState = {
  address: string | null
  isConnected: boolean
  setWallet: (address: string) => void
  disconnect: () => void
}

export const useWalletStore = create<WalletState>((set) => ({
  address: null,
  isConnected: false,
  setWallet: (address) => set({ address, isConnected: true }),
  disconnect: () => set({ address: null, isConnected: false }),
}))
