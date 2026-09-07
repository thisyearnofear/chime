import { create } from 'zustand'
import type { Asset, IntervalSec, LiveWindow, Series } from '@/types/markets'

interface MarketState {
  series: Series | null
  window: LiveWindow | null
  loading: boolean
  error: string | null
  usingDemo: boolean
  catalog: LiveWindow[]
  setSeries: (series: Series | null) => void
  setWindow: (window: LiveWindow | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setCatalog: (catalog: LiveWindow[]) => void
}

export function seriesFromSearch(asset?: string | null, window?: string | null): Series {
  const a: Asset = asset?.toUpperCase() === 'ETH' ? 'ETH' : 'BTC'
  let intervalSec: IntervalSec = 900
  if (window === '1h' || window === '3600') intervalSec = 3600
  else if (window === '4h' || window === '14400') intervalSec = 14400
  else if (window === '24h' || window === '86400') intervalSec = 86400
  return { asset: a, intervalSec }
}

export const useMarketStore = create<MarketState>((set) => ({
  series: null,
  window: null,
  loading: true,
  error: null,
  usingDemo: false,
  catalog: [],
  setSeries: (series) => set({ series }),
  setWindow: (window) => set({ window, usingDemo: Boolean(window?.demo), error: null }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setCatalog: (catalog) => set({ catalog }),
}))
