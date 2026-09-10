import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

export interface ChorusTally {
  marketId: string
  up: number
  down: number
  updatedAt: number
}

const MAX_MARKETS = 200
const TTL_MS = 24 * 60 * 60 * 1000
const FILE = join(process.cwd(), '.data', 'chime-chorus.json')

const tallies = new Map<string, ChorusTally>()

function persist(): void {
  try {
    mkdirSync(join(process.cwd(), '.data'), { recursive: true })
    writeFileSync(FILE, JSON.stringify([...tallies.values()]), 'utf8')
  } catch (error) {
    console.error('chorus persist', error)
  }
}

function hydrate(): void {
  try {
    if (!existsSync(FILE)) return
    const rows = JSON.parse(readFileSync(FILE, 'utf8')) as ChorusTally[]
    if (!Array.isArray(rows)) return
    const cutoff = Date.now() - TTL_MS
    for (const row of rows) {
      if (!row?.marketId || row.updatedAt < cutoff) continue
      tallies.set(row.marketId, {
        marketId: row.marketId,
        up: Math.max(0, Number(row.up) || 0),
        down: Math.max(0, Number(row.down) || 0),
        updatedAt: row.updatedAt,
      })
    }
  } catch {
    /* first boot or unreadable file */
  }
}

hydrate()

function prune(): void {
  const cutoff = Date.now() - TTL_MS
  for (const [id, row] of tallies) {
    if (row.updatedAt < cutoff) tallies.delete(id)
  }
  if (tallies.size > MAX_MARKETS) {
    const oldest = [...tallies.entries()].sort((a, b) => a[1].updatedAt - b[1].updatedAt)
    for (const [id] of oldest.slice(0, tallies.size - MAX_MARKETS)) tallies.delete(id)
  }
}

export function getTally(marketId: string): ChorusTally {
  prune()
  return (
    tallies.get(marketId) ?? { marketId, up: 0, down: 0, updatedAt: Date.now() }
  )
}

export function addChime(marketId: string, side: 'up' | 'down'): ChorusTally {
  prune()
  const row = getTally(marketId)
  const next: ChorusTally = {
    marketId,
    up: row.up + (side === 'up' ? 1 : 0),
    down: row.down + (side === 'down' ? 1 : 0),
    updatedAt: Date.now(),
  }
  tallies.set(marketId, next)
  persist()
  return next
}
