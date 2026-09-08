'use client'

import { formatUnits } from 'viem'
import { getExchange } from './exchange'
import { getMarketNetwork } from './config'
import { formatInterval } from './format'
import type { DeskFill, DeskPosition, LiveWindow, Side } from '@/types/markets'

export type PortfolioMarket = {
  id: string
  marketAddress: string
  asset: string
  status: string
  expiry: string
  intervalSec: string | null
  interval: string | null
  quoteDecimals: number
  winningOutcome?: number | null
  voided: boolean
}

export type RawPosition = {
  outcomeIndex: number
  balance: string
  market: PortfolioMarket
}

export type RawTrade = {
  id: string
  fillPrice: string
  quantity: string
  timestamp: string
  txHash: string
  side: string | null
  market: {
    asset: string
    interval: string | null
    expiry: string | null
    quoteDecimals: number
  }
}

function shares(raw: string, decimals: number): string {
  try {
    const n = Number(formatUnits(BigInt(raw), decimals))
    if (!Number.isFinite(n) || n === 0) return '0'
    if (n >= 100) return n.toFixed(2)
    if (n >= 1) return n.toFixed(3)
    return n.toPrecision(3)
  } catch {
    return '0'
  }
}

function intervalLabel(market: { interval: string | null; intervalSec?: string | null }): string {
  if (market.interval) return market.interval
  const sec = Number(market.intervalSec)
  return Number.isFinite(sec) && sec > 0 ? formatInterval(sec) : '—'
}

function asSide(outcomeIndex: number): Side {
  return outcomeIndex === 1 ? 'down' : 'up'
}

export function isClaimable(market: PortfolioMarket, outcomeIndex: number): boolean {
  if (market.voided || market.status === 'Voided') return true
  if (market.winningOutcome === 0 || market.winningOutcome === 1) {
    return outcomeIndex === market.winningOutcome
  }
  return false
}

export function mapPosition(row: RawPosition): DeskPosition {
  return {
    marketId: row.market.id,
    marketAddress: row.market.marketAddress,
    asset: row.market.asset,
    interval: intervalLabel(row.market),
    expiry: Number(row.market.expiry) || 0,
    side: asSide(row.outcomeIndex),
    amountLabel: shares(row.balance, row.market.quoteDecimals),
    status: row.market.status,
    claimable: isClaimable(row.market, row.outcomeIndex),
    outcomeIdx: row.outcomeIndex === 1 ? 1 : 0,
  }
}

function tradeSide(side: string | null): Side | undefined {
  if (!side) return undefined
  const lower = side.toLowerCase()
  if (lower.includes('no') || lower.includes('down') || lower.endsWith('_ask')) return 'down'
  if (lower.includes('yes') || lower.includes('up') || lower.endsWith('_bid')) return 'up'
  return undefined
}

export function mapTrade(row: RawTrade): DeskFill {
  const side = tradeSide(row.side)
  const qty = shares(row.quantity, row.market.quoteDecimals)
  const cadence = row.market.interval ? `${row.market.asset} ${row.market.interval}` : row.market.asset
  return {
    id: row.id,
    at: Number(row.timestamp) * 1000,
    title: side ? `${side === 'up' ? 'Up' : 'Down'} fill · ${cadence}` : `Fill · ${cadence}`,
    detail: qty !== '0' ? `${qty} shares` : undefined,
    txHash: row.txHash,
    side,
  }
}

function onchainStatus(status: number): string {
  return ['Listed', 'Trading', 'Locked', 'Settling', 'Resolved', 'Voided'][status] ?? 'Trading'
}

export async function loadChainSeat(account: string, window: LiveWindow): Promise<DeskPosition[]> {
  if (window.demo || !window.marketId.startsWith('0x')) return []
  const ex = await getExchange()
  if (!ex.client.getOutcomeBalance) return []
  const oc = await ex.client.getMarketOnchain(window.marketId as `0x${string}`)
  if (!oc.outcomeToken || oc.yesId == null || oc.noId == null) return []

  const decimals = oc.quoteDecimals ?? getMarketNetwork().collateralDecimals
  const status = onchainStatus(Number(oc.status))
  const expiry = Number(oc.expiry ?? window.expiry)
  const market: PortfolioMarket = {
    id: window.marketId,
    marketAddress: String(oc.marketAddress ?? ''),
    asset: window.asset,
    status,
    expiry: String(expiry),
    intervalSec: String(window.intervalSec),
    interval: formatInterval(window.intervalSec),
    quoteDecimals: Number(decimals) || 6,
    winningOutcome: oc.winningOutcome ?? null,
    voided: Boolean(oc.isVoided),
  }

  const rows: DeskPosition[] = []
  for (const [outcomeIndex, id] of [
    [0, oc.yesId],
    [1, oc.noId],
  ] as const) {
    const balance = await ex.client.getOutcomeBalance({
      outcomeToken: oc.outcomeToken,
      account,
      id,
    })
    if (!balance || balance === BigInt(0)) continue
    rows.push(mapPosition({ outcomeIndex, balance: balance.toString(), market }))
  }
  return rows
}

function mergePositions(indexed: DeskPosition[], chain: DeskPosition[]): DeskPosition[] {
  const extra = chain.filter(
    (row) =>
      !indexed.some(
        (p) => p.marketId.toLowerCase() === row.marketId.toLowerCase() && p.outcomeIdx === row.outcomeIdx
      )
  )
  return [...extra, ...indexed]
}

export async function loadDesk(
  account: string,
  window?: LiveWindow | null
): Promise<{ positions: DeskPosition[]; fills: DeskFill[] }> {
  const ex = await getExchange()
  let chain: DeskPosition[] = []
  if (window && !window.demo) {
    try {
      chain = await loadChainSeat(account, window)
    } catch (error) {
      console.warn('desk chain seat', error)
    }
  }

  let indexed: { positions: DeskPosition[]; fills: DeskFill[] } = { positions: [], fills: [] }
  try {
    if (ex.client.getPortfolio) {
      const portfolio = await Promise.race([
        ex.client.getPortfolio(account, { tradesLimit: 80, ordersLimit: 20 }),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('portfolio timeout')), 8000)
        }),
      ])
      indexed = {
        positions: (portfolio.positions ?? []).map(mapPosition),
        fills: (portfolio.trades ?? []).map(mapTrade),
      }
    }
  } catch (error) {
    console.warn('desk portfolio', error)
  }
  return { positions: mergePositions(indexed.positions, chain), fills: indexed.fills }
}
