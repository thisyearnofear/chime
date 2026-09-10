'use client'

import { useMemo } from 'react'
import { useMarketStore } from '@/stores/marketStore'
import { usePositionStore } from '@/stores/positionStore'

/**
 * Returns the count of distinct "voices" (Follow/Fade participants) for the
 * current floor window. Counts:
 *   - Each follow/fade event in positionStore (the user's own trades)
 *   - Each follow/fade print in the pit tape (market activity prints)
 *
 * Deduped by event id so reloads don't double-count.
 * Returns 0 if no window is active.
 */
export function useVoices(): number {
  const tape = useMarketStore((s) => s.tape)
  const events = usePositionStore((s) => s.events)
  const window = useMarketStore((s) => s.window)

  return useMemo(() => {
    if (!window) return 0

    const seen = new Set<string>()

    // Count follow/fade prints from the pit tape (one per unique id)
    for (const row of tape) {
      if (row.kind === 'follow' || row.kind === 'fade') {
        seen.add(row.id)
      }
    }

    // Count the user's own follow/fade events for this window
    for (const ev of events) {
      if (
        (ev.type === 'follow' || ev.type === 'fade') &&
        (!ev.marketId || ev.marketId === window.marketId)
      ) {
        seen.add(ev.id)
      }
    }

    // Always count at least 1 when there is an active book (implies market makers)
    const base = window.bestBid != null || window.bestAsk != null ? 1 : 0
    return Math.max(base, seen.size)
  }, [tape, events, window])
}
