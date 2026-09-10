import { create } from 'zustand'
import type { Side } from '@/types/markets'

const CHIME_KEY = 'chime:chimes'
const MAX_CHIMES = 200

export interface ChimeEntry {
  /** `${marketId}:${side}` — one chime per side per browser per window */
  id: string
  marketId: string
  side: Side
  at: number
}

export interface SharedTally {
  up: number
  down: number
}

function readChimes(): ChimeEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CHIME_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ChimeEntry[]
    if (!Array.isArray(parsed)) return []
    const dayAgo = Date.now() - 24 * 3600 * 1000
    return parsed.filter((c) => c && typeof c.at === 'number' && c.at > dayAgo).slice(0, MAX_CHIMES)
  } catch {
    return []
  }
}

function writeChimes(chimes: ChimeEntry[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(CHIME_KEY, JSON.stringify(chimes.slice(0, MAX_CHIMES)))
  } catch {
    /* quota */
  }
}

interface ChorusState {
  chimes: ChimeEntry[]
  /** Shared crowd tally for the current window (all browsers). Null until fetched. */
  shared: SharedTally | null
  sharedMarketId: string | null
  /** Free voice for a window side. Idempotent per side per window. Returns true if new. */
  chime: (marketId: string, side: Side) => boolean
  hydrate: () => void
  /** Pull the shared tally for a window into the store. */
  fetchShared: (marketId: string) => Promise<void>
}

export const useChorusStore = create<ChorusState>((set, get) => ({
  chimes: [],
  shared: null,
  sharedMarketId: null,
  hydrate: () => set({ chimes: readChimes() }),
  chime: (marketId, side) => {
    const id = `${marketId}:${side}`
    const existing = get().chimes.find((c) => c.id === id)
    if (existing) return false
    const next = [{ id, marketId, side, at: Date.now() }, ...get().chimes].slice(0, MAX_CHIMES)
    writeChimes(next)
    set({ chimes: next })
    // Report to the shared aggregate (fire-and-forget) then refresh it.
    void fetch(`/api/chorus`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ marketId, side }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((tally) => {
        if (tally && typeof tally.up === 'number') {
          set({ shared: { up: tally.up, down: tally.down }, sharedMarketId: marketId })
        }
      })
      .catch(() => {
        /* offline — local chime still counts */
      })
    return true
  },
  fetchShared: async (marketId) => {
    try {
      const res = await fetch(`/api/chorus?marketId=${encodeURIComponent(marketId)}`, { cache: 'no-store' })
      if (!res.ok) return
      const tally = (await res.json()) as { up?: number; down?: number }
      if (typeof tally.up === 'number' && typeof tally.down === 'number') {
        set({ shared: { up: tally.up, down: tally.down }, sharedMarketId: marketId })
      }
    } catch {
      /* offline — local chimes still render */
    }
  },
}))

/** Chorus split for one window: free-voice counts per side (local browser). */
export function chorusFor(marketId: string | undefined, chimes: ChimeEntry[]): { up: number; down: number; total: number } {
  if (!marketId) return { up: 0, down: 0, total: 0 }
  let up = 0
  let down = 0
  for (const c of chimes) {
    if (c.marketId !== marketId) continue
    if (c.side === 'up') up += 1
    else down += 1
  }
  return { up, down, total: up + down }
}

/**
 * Merged chorus split: shared crowd tally plus this browser's local chimes
 * not yet reflected server-side. Shared wins when present; local is fallback.
 */
export function mergedChorus(
  marketId: string | undefined,
  local: ChimeEntry[],
  shared: SharedTally | null,
  sharedMarketId: string | null
): { up: number; down: number; total: number; shared: boolean } {
  if (!marketId) return { up: 0, down: 0, total: 0, shared: false }
  if (shared && sharedMarketId === marketId) {
    return { up: shared.up, down: shared.down, total: shared.up + shared.down, shared: true }
  }
  const l = chorusFor(marketId, local)
  return { ...l, shared: false }
}

/** Musical rank for a streak of correct chimes — words, not points. */
export function chorusRank(streak: number): string | null {
  if (streak >= 5) return 'Carillon'
  if (streak >= 3) return 'Octave'
  if (streak >= 2) return 'Unison'
  return null
}
