import { create } from 'zustand'
import { impliedUp } from '@/lib/markets/format'
import type { Asset, IntervalSec, LiveWindow, MidSample, Series, TapeRow } from '@/types/markets'

const MAX_MIDS = 40
const MAX_TAPE = 6
const PRINT_DELTA = 0.005

interface MarketState {
  series: Series | null
  window: LiveWindow | null
  loading: boolean
  error: string | null
  usingDemo: boolean
  catalog: LiveWindow[]
  floorMarketId: string | null
  mids: MidSample[]
  tape: TapeRow[]
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

function withBookSample(
  state: Pick<MarketState, 'floorMarketId' | 'mids' | 'tape'>,
  window: LiveWindow | null
): Pick<MarketState, 'floorMarketId' | 'mids' | 'tape'> {
  const id = window?.marketId ?? null
  const reset = id !== state.floorMarketId
  let mids = reset ? [] : state.mids
  let tape = reset ? [] : state.tape
  const hasBook = Boolean(window && (window.bestBid != null || window.bestAsk != null))
  if (!window || !hasBook) {
    return { floorMarketId: id, mids, tape }
  }

  const mid = impliedUp(window.bestBid, window.bestAsk)
  const last = mids[mids.length - 1]
  const now = Date.now()
  const due = !last || now - last.at >= 7500 || Math.abs(last.mid - mid) >= 0.0005
  if (due) {
    mids = [...mids, { at: now, mid }].slice(-MAX_MIDS)
  }
  const print =
    !last || Math.abs(last.mid - mid) >= PRINT_DELTA
  if (print) {
    const cents = Math.round(mid * 100)
    tape = [
      {
        id: `print-${now}`,
        at: now,
        kind: 'print' as const,
        text: `Up ${cents}¢`,
        side: mid >= 0.5 ? ('up' as const) : ('down' as const),
      },
      ...tape,
    ].slice(0, MAX_TAPE)
  }
  return { floorMarketId: id, mids, tape }
}

export const useMarketStore = create<MarketState>((set) => ({
  series: null,
  window: null,
  loading: true,
  error: null,
  usingDemo: false,
  catalog: [],
  floorMarketId: null,
  mids: [],
  tape: [],
  setSeries: (series) => set({ series }),
  setWindow: (window) =>
    set((state) => ({
      window,
      usingDemo: Boolean(window?.demo),
      error: null,
      ...withBookSample(state, window),
    })),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setCatalog: (catalog) => set({ catalog }),
}))
