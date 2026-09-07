import { create } from 'zustand'

interface UIState {
  isOnline: boolean
  isConnected: boolean
  networkMetrics: {
    lastTxSpeed: number | null
    isOnSomnia: boolean
  }
  setOnline: (online: boolean) => void
  setConnected: (connected: boolean) => void
  updateNetworkMetrics: (metrics: Partial<UIState['networkMetrics']>) => void
}

export const useUIStore = create<UIState>((set) => ({
  isOnline: true,
  isConnected: false,
  networkMetrics: {
    lastTxSpeed: null,
    isOnSomnia: false,
  },
  setOnline: (online) => set({ isOnline: online }),
  setConnected: (connected) => set({ isConnected: connected }),
  updateNetworkMetrics: (metrics) => set((state) => ({
    networkMetrics: { ...state.networkMetrics, ...metrics },
  })),
}))
