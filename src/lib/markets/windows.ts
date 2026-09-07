'use client'

import type { LiveWindow, Series } from '@/types/markets'
import { demoWindow } from '@/lib/demo-data'
import { getExchange } from './exchange'

export async function fetchLiveCatalog(): Promise<LiveWindow[]> {
  try {
    const res = await fetch('/api/markets/live', { cache: 'no-store' })
    if (!res.ok) return []
    return (await res.json()) as LiveWindow[]
  } catch {
    return []
  }
}

function pickFromCatalog(catalog: LiveWindow[], series: Series | null): LiveWindow | null {
  if (series) {
    const exact = catalog
      .filter((w) => w.asset === series.asset && w.intervalSec === series.intervalSec)
      .sort((a, b) => a.expiry - b.expiry)[0]
    if (exact) return exact
    return null
  }
  return catalog.slice().sort((a, b) => a.expiry - b.expiry)[0] ?? null
}

export async function findLiveWindow(
  series: Series | null,
  allowDemo = true,
  catalog?: LiveWindow[]
): Promise<LiveWindow> {
  const rows = catalog ?? (await fetchLiveCatalog())
  const match = pickFromCatalog(rows, series)
  if (match) return match
  if (!allowDemo) throw new Error('NO_WINDOW')
  if (series) return demoWindow(series.asset, series.intervalSec)
  return demoWindow('BTC', 86400)
}

export async function listLiveSeries(allowDemo = true): Promise<LiveWindow[]> {
  const catalog = await fetchLiveCatalog()
  if (catalog.length > 0) return catalog
  if (!allowDemo) return []
  return [
    demoWindow('BTC', 900),
    demoWindow('ETH', 900),
    demoWindow('BTC', 3600),
    demoWindow('ETH', 3600),
  ]
}

export async function resolveCanonicalSymbols(window: LiveWindow): Promise<LiveWindow> {
  if (window.demo || !window.marketId.startsWith('0x')) return window
  try {
    const ex = await getExchange()
    const markets = await ex.loadMarkets(true)
    const match = Object.values(markets).find(
      (m) => m.id?.toLowerCase() === window.marketId.toLowerCase()
    )
    if (!match) return window
    const up = match.outcomes?.find((o) => o.label === 'YES')?.symbol ?? `${match.symbol}#YES`
    const down = match.outcomes?.find((o) => o.label === 'NO')?.symbol ?? `${match.symbol}#NO`
    return { ...window, upSymbol: up, downSymbol: down }
  } catch {
    return window
  }
}

export async function attachBook(window: LiveWindow): Promise<LiveWindow> {
  if (window.demo) return window
  const refs = [window.upSymbol, window.marketId].filter(Boolean)
  for (const ref of refs) {
    try {
      const ex = await getExchange()
      await ex.loadMarkets(true)
      const book = await ex.fetchOrderBook(ref, 5)
      return {
        ...window,
        bestBid: book.bids?.[0]?.[0] ?? null,
        bestAsk: book.asks?.[0]?.[0] ?? null,
      }
    } catch {
      continue
    }
  }
  return window
}

export async function refreshOnchainStatus(window: LiveWindow): Promise<LiveWindow> {
  if (window.demo || !window.marketId.startsWith('0x')) return window
  try {
    const ex = await getExchange()
    const onchain = await ex.client.getMarketOnchain(window.marketId as `0x${string}`)
    return { ...window, status: Number(onchain.status), expiry: Number(onchain.expiry ?? window.expiry) }
  } catch {
    return window
  }
}
