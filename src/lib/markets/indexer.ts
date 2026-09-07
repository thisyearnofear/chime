import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { getMarketNetwork } from './config'
import { cadenceToInterval, synthesizeBinarySymbols } from './format'
import type { Asset, IntervalSec, LiveWindow, ResolvedMarket } from '@/types/markets'

interface IndexerMarket {
  marketId?: string
  asset?: string
  intervalSec?: string | number
  expiry?: string | number
  clobStatus?: string
  strike?: string
  collateral?: string
  quoteSymbol?: string | null
  winningOutcome?: number | null
  voided?: boolean
  tradingStart?: string | number
}

const LIVE_FILE = join(process.cwd(), '.data', 'chime-live.json')
const INDEXER_TIMEOUT_MS = 8_000
const LIVE_TTL_MS = 30_000
let liveMemory: { at: number; rows: LiveWindow[] } | null = null

function asAsset(value: unknown): Asset | null {
  const v = String(value ?? '').toUpperCase()
  return v === 'BTC' || v === 'ETH' ? v : null
}

function statusToNumber(status: unknown): number {
  if (typeof status === 'number') return status
  const map: Record<string, number> = {
    Listed: 0,
    Trading: 1,
    Locked: 2,
    Settling: 3,
    Resolved: 4,
    Voided: 5,
    Finalized: 4,
  }
  return map[String(status)] ?? 1
}

async function graphql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const net = getMarketNetwork()
  const res = await fetch(net.indexerUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
    signal: AbortSignal.timeout(INDEXER_TIMEOUT_MS),
  })
  if (!res.ok) throw new Error(`Indexer HTTP ${res.status}`)
  const json = (await res.json()) as { data?: T; errors?: { message: string }[] }
  if (json.errors?.length) throw new Error(json.errors[0].message)
  if (!json.data) throw new Error('Indexer returned no data')
  return json.data
}

function toLiveWindow(row: IndexerMarket): LiveWindow | null {
  const net = getMarketNetwork()
  const marketId = String(row.marketId ?? '')
  const asset = asAsset(row.asset)
  const intervalSec: IntervalSec | null =
    cadenceToInterval(row.intervalSec) ??
    cadenceToInterval(Number(row.expiry) - Number(row.tradingStart))
  const expiry = Number(row.expiry)
  if (!marketId || !asset || !intervalSec || !expiry) return null
  const status = statusToNumber(row.clobStatus)
  if (status !== 1 && status !== 2) return null
  const symbols = synthesizeBinarySymbols({
    asset,
    strike: row.strike ?? '0',
    expiry,
    quote: row.quoteSymbol || net.collateralSymbol,
  })
  return {
    marketId,
    asset,
    intervalSec,
    expiry,
    status,
    upSymbol: symbols.upSymbol,
    downSymbol: symbols.downSymbol,
    bestBid: null,
    bestAsk: null,
    demo: false,
  }
}

function stillOpen(rows: LiveWindow[]): LiveWindow[] {
  const now = Date.now() / 1000
  return rows.filter((w) => w.expiry > now)
}

function readLiveCache(): LiveWindow[] {
  if (liveMemory?.rows.length) return stillOpen(liveMemory.rows)
  try {
    if (!existsSync(LIVE_FILE)) return []
    const rows = JSON.parse(readFileSync(LIVE_FILE, 'utf8')) as LiveWindow[]
    const open = Array.isArray(rows) ? stillOpen(rows) : []
    if (open.length) liveMemory = { at: 0, rows: open }
    return open
  } catch {
    return []
  }
}

function writeLiveCache(rows: LiveWindow[]): void {
  liveMemory = { at: Date.now(), rows }
  try {
    mkdirSync(join(process.cwd(), '.data'), { recursive: true })
    writeFileSync(LIVE_FILE, JSON.stringify(rows), 'utf8')
  } catch (error) {
    console.error('markets/live cache', error)
  }
}

export async function listLiveFromIndexer(): Promise<LiveWindow[]> {
  const cached = readLiveCache()
  if (cached.length && liveMemory && liveMemory.at > 0 && Date.now() - liveMemory.at < LIVE_TTL_MS) {
    return cached
  }

  const net = getMarketNetwork()
  const now = Math.floor(Date.now() / 1000)
  try {
    const data = await graphql<{ live: IndexerMarket[] }>(
      `query($now: numeric!, $venue: String!) {
        live: Market(
          where: {
            marketType: {_eq: BINARY}
            venueId: {_eq: $venue}
            expiry: {_gt: $now}
            asset: {_in: ["BTC", "ETH"]}
          }
          order_by: {expiry: asc}
          limit: 24
        ) {
          marketId asset intervalSec expiry clobStatus strike quoteSymbol tradingStart
        }
      }`,
      { now: String(now), venue: net.venueId }
    )
    const rows = data.live.map(toLiveWindow).filter((w): w is LiveWindow => w !== null)
    if (rows.length) writeLiveCache(rows)
    else if (cached.length) {
      liveMemory = { at: Date.now(), rows: cached }
      return cached
    }
    return rows
  } catch (error) {
    if (cached.length) {
      liveMemory = { at: Date.now(), rows: cached }
      console.warn('markets/live using cache after indexer error', error)
      return cached
    }
    throw error
  }
}

export async function listResolvedFromIndexer(): Promise<ResolvedMarket[]> {
  const net = getMarketNetwork()
  const now = Math.floor(Date.now() / 1000)
  try {
    const data = await graphql<{ past: IndexerMarket[] }>(
      `query($now: numeric!, $venue: String!) {
        past: Market(
          where: {
            marketType: {_eq: BINARY}
            venueId: {_eq: $venue}
            expiry: {_lte: $now}
            asset: {_in: ["BTC", "ETH"]}
          }
          order_by: {expiry: desc}
          limit: 40
        ) {
          marketId asset intervalSec expiry clobStatus winningOutcome voided
        }
      }`,
      { now: String(now), venue: net.venueId }
    )
    return data.past
      .map((row) => {
        const marketId = String(row.marketId ?? '')
        if (!marketId) return null
        return {
          marketId,
          asset: String(row.asset ?? ''),
          intervalSec: Number(row.intervalSec ?? 0),
          expiry: Number(row.expiry ?? 0),
          voided: Boolean(row.voided),
          winningOutcome:
            row.winningOutcome === 0 || row.winningOutcome === 1 ? row.winningOutcome : null,
          status: String(row.clobStatus ?? ''),
        } satisfies ResolvedMarket
      })
      .filter((row): row is ResolvedMarket => row !== null)
  } catch (error) {
    console.warn('markets/resolved indexer error', error)
    return []
  }
}
