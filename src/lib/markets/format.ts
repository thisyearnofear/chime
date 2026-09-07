import type { IntervalSec, Side } from '@/types/markets'

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

export function formatInterval(intervalSec: IntervalSec | number): string {
  if (intervalSec === 900) return '15m'
  if (intervalSec === 3600) return '1h'
  if (intervalSec === 14400) return '4h'
  if (intervalSec === 86400) return '24h'
  return `${intervalSec}s`
}

export function parseInterval(value: string | null | undefined): IntervalSec {
  if (value === '1h' || value === '3600') return 3600
  if (value === '4h' || value === '14400') return 14400
  if (value === '24h' || value === '86400') return 86400
  if (value === '15m' || value === '900') return 900
  return 900
}

export function cadenceToInterval(value: unknown): IntervalSec | null {
  const n = Number(value)
  if (!Number.isFinite(n)) return null
  if (n >= 800 && n <= 1100) return 900
  if (n >= 3300 && n <= 3900) return 3600
  if (n >= 13000 && n <= 16000) return 14400
  if (n >= 80000 && n <= 90000) return 86400
  return null
}

export function expiryCode(expirySec: number): string {
  const d = new Date(expirySec * 1000)
  const day = String(d.getUTCDate()).padStart(2, '0')
  const date = `${day}${MONTHS[d.getUTCMonth()]}${String(d.getUTCFullYear() % 100).padStart(2, '0')}`
  if (expirySec % 86400 === 0) return date
  const hh = String(d.getUTCHours()).padStart(2, '0')
  const mm = String(d.getUTCMinutes()).padStart(2, '0')
  return `${date}-${hh}${mm}`
}

export function synthesizeBinarySymbols(input: {
  asset: string
  strike?: string
  expiry: number
  quote: string
}): { upSymbol: string; downSymbol: string } {
  const asset = input.asset.replace(/[^A-Za-z0-9.]+/g, '') || 'MKT'
  const strike = String(input.strike ?? '0').replace(/[^A-Za-z0-9.]+/g, '') || '0'
  const quote = input.quote.replace(/[^A-Za-z0-9.]+/g, '') || 'USDso'
  const base = `${asset}-${strike}-${expiryCode(input.expiry)}/${quote}`
  return { upSymbol: `${base}#YES`, downSymbol: `${base}#NO` }
}

export function formatSide(side: Side): string {
  return side === 'up' ? 'Up' : 'Down'
}

export function impliedUp(bestBid: number | null, bestAsk: number | null): number {
  if (bestBid != null && bestAsk != null) return (bestBid + bestAsk) / 2
  if (bestAsk != null) return bestAsk
  if (bestBid != null) return bestBid
  return 0.5
}

export function formatCountdown(leftSec: number): string {
  const left = Math.max(0, Math.floor(leftSec))
  const hours = Math.floor(left / 3600)
  const minutes = Math.floor((left % 3600) / 60)
  const seconds = left % 60
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function secondsLeft(expirySec: number): number {
  return Math.max(0, expirySec - Date.now() / 1000)
}

export function remainingFraction(expirySec: number, intervalSec: number): number {
  const left = secondsLeft(expirySec)
  const span = Math.max(1, intervalSec)
  return Math.min(1, Math.max(0, left / span))
}

export function explorerTx(base: string, hash: string): string {
  const root = base.replace(/\/$/, '')
  return `${root}/tx/${hash}`
}

export function snapPrice(price: number): number {
  const stepped = Math.round(price * 1000) / 1000
  return Math.min(0.999, Math.max(0.001, stepped))
}
