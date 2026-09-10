'use client'

import { useEffect, useMemo } from 'react'
import { useMarketStore } from '@/stores/marketStore'
import { usePositionStore } from '@/stores/positionStore'
import { mergedChorus, useChorusStore } from '@/stores/chorusStore'

/**
 * Returns the count of distinct "voices" (Follow/Fade participants + free
 * chimes) for the current floor window. Counts:
 *   - Each follow/fade event in positionStore (the user's own trades)
 *   - Each follow/fade print in the pit tape (market activity prints)
 *   - The shared chorus tally (all browsers) + local chimes
 *
 * Deduped by event id so reloads don't double-count.
 * Returns 0 if no window is active.
 */
export function useVoices(): number {
  const tape = useMarketStore((s) => s.tape)
  const events = usePositionStore((s) => s.events)
  const window = useMarketStore((s) => s.window)
  const chimes = useChorusStore((s) => s.chimes)
  const shared = useChorusStore((s) => s.shared)
  const sharedMarketId = useChorusStore((s) => s.sharedMarketId)
  const hydrateChorus = useChorusStore((s) => s.hydrate)
  const fetchShared = useChorusStore((s) => s.fetchShared)

  useEffect(() => {
    hydrateChorus()
  }, [hydrateChorus])

  useEffect(() => {
    if (!window) return
    void fetchShared(window.marketId)
    // Keyed on marketId — the window object identity churns on every book poll.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [window?.marketId, fetchShared])

  return useMemo(() => {
    if (!window) return 0

    const seen = new Set<string>()

    // Count follow/fade prints from the pit tape (one per unique id)
    for (const row of tape) {
      if (row.kind === 'follow' || row.kind === 'fade' || row.kind === 'chime') {
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

    // Count the shared chorus (all browsers) or local chimes as fallback
    const { total } = mergedChorus(window.marketId, chimes, shared, sharedMarketId)
    for (let i = 0; i < total; i += 1) seen.add(`chime-${window.marketId}-${i}`)

    // Always count at least 1 when there is an active book (implies market makers)
    const base = window.bestBid != null || window.bestAsk != null ? 1 : 0
    return Math.max(base, seen.size)
  }, [tape, events, window, chimes, shared, sharedMarketId])
}
