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
  /** Free voice for a window side. Idempotent per side per window. Returns true if new. */
  chime: (marketId: string, side: Side) => boolean
  hydrate: () => void
}

export const useChorusStore = create<ChorusState>((set, get) => ({
  chimes: [],
  hydrate: () => set({ chimes: readChimes() }),
  chime: (marketId, side) => {
    const id = `${marketId}:${side}`
    const existing = get().chimes.find((c) => c.id === id)
    if (existing) return false
    const next = [{ id, marketId, side, at: Date.now() }, ...get().chimes].slice(0, MAX_CHIMES)
    writeChimes(next)
    set({ chimes: next })
    return true
  },
}))

/** Chorus split for one window: free-voice counts per side. */
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

/** Musical rank for a streak of correct chimes — words, not points. */
export function chorusRank(streak: number): string | null {
  if (streak >= 5) return 'Carillon'
  if (streak >= 3) return 'Octave'
  if (streak >= 2) return 'Unison'
  return null
}
