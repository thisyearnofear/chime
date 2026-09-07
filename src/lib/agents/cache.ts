import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { getPersonality } from '@/lib/personality-presets'
import type { WindowDecision } from '@/types/markets'

const cache = new Map<string, WindowDecision>()
const MAX = 200
const FILE = join(process.cwd(), '.data', 'chime-decisions.json')

function remapDecision(row: WindowDecision): WindowDecision {
  if (!row?.seats?.[0] || !row?.seats?.[1]) return row
  return {
    ...row,
    seats: [
      { ...row.seats[0], label: getPersonality(row.seats[0].label).label },
      { ...row.seats[1], label: getPersonality(row.seats[1].label).label },
    ],
  }
}

function persist(): void {
  try {
    mkdirSync(join(process.cwd(), '.data'), { recursive: true })
    writeFileSync(FILE, JSON.stringify(listDecisions()), 'utf8')
  } catch (error) {
    console.error('agents/cache persist', error)
  }
}

function hydrate(): void {
  try {
    if (!existsSync(FILE)) return
    const rows = JSON.parse(readFileSync(FILE, 'utf8')) as WindowDecision[]
    if (!Array.isArray(rows)) return
    let dirty = false
    for (const row of rows) {
      if (!row?.marketId || !Array.isArray(row.seats)) continue
      const remapped = remapDecision(row)
      if (
        remapped.seats[0]?.label !== row.seats[0]?.label ||
        remapped.seats[1]?.label !== row.seats[1]?.label
      ) {
        dirty = true
      }
      cache.set(row.marketId, remapped)
    }
    if (dirty) persist()
  } catch {
    /* first boot or unreadable file */
  }
}

hydrate()

export function getDecision(marketId: string): WindowDecision | undefined {
  return cache.get(marketId)
}

export function listDecisions(): WindowDecision[] {
  return [...cache.values()].sort((a, b) => b.generatedAt - a.generatedAt)
}

export function setDecision(decision: WindowDecision): void {
  cache.set(decision.marketId, decision)
  if (cache.size > MAX) {
    const oldest = [...cache.entries()].sort((a, b) => a[1].generatedAt - b[1].generatedAt)
    for (const [id] of oldest.slice(0, cache.size - MAX)) cache.delete(id)
  }
  persist()
}
