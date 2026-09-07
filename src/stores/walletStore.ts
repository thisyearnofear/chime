import { create } from 'zustand'

interface WalletState {
  walletAddress: string | null
  isWalletConnected: boolean
  setWalletAddress: (address: string | null) => void
  setWalletConnected: (connected: boolean) => void
}

export const useWalletStore = create<WalletState>((set) => ({
  walletAddress: null,
  isWalletConnected: false,
  setWalletAddress: (address) => set({ walletAddress: address }),
  setWalletConnected: (connected) => set({ isWalletConnected: connected }),
}))
