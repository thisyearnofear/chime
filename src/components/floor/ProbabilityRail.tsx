'use client'

import { useEffect } from 'react'
import { impliedUp } from '@/lib/markets/format'
import { mergedChorus, useChorusStore } from '@/stores/chorusStore'
import type { LiveWindow } from '@/types/markets'

export function ProbabilityRail({ window }: { window: LiveWindow | null }) {
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
    const id = setInterval(() => void fetchShared(window.marketId), 8000)
    return () => clearInterval(id)
    // Keyed on marketId — the window object identity churns on every book poll.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [window?.marketId, fetchShared])

  if (!window) return null
  if (window.bestBid == null && window.bestAsk == null) {
    return (
      <p className="mt-4 text-[11px] text-[var(--mute)]">
        No book yet — best bid and ask print here once trading opens.
      </p>
    )
  }
  const up = impliedUp(window.bestBid, window.bestAsk)
  const pct = Math.round(up * 100)
  const { up: chorusUp, down: chorusDown, total } = mergedChorus(window.marketId, chimes, shared, sharedMarketId)
  const chorusPct = total > 0 ? Math.round((chorusUp / total) * 100) : null
  const lean =
    chorusPct == null
      ? null
      : chorusPct >= 60
        ? 'crowd leans Up'
        : chorusPct <= 40
          ? 'crowd leans Down'
          : 'crowd split'

  return (
    <div className="mt-4 text-[11px] text-[var(--mute)]">
      <div className="flex justify-between mb-1">
        <span className="text-[var(--brass)]">Up {pct}¢</span>
        <span className="text-[var(--slate)]">Down {100 - pct}¢</span>
      </div>
      <div className="h-px bg-[var(--line)]">
        <div className="h-px bg-[var(--brass)]" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between mt-1">
        <span>bid {window.bestBid?.toFixed(3)}</span>
        <span>ask {window.bestAsk?.toFixed(3)}</span>
      </div>
      {total > 0 && chorusPct != null && (
        <div className="mt-3">
          <div className="flex justify-between mb-1">
            <span>chorus {chorusUp} Up · {chorusDown} Down</span>
            {lean ? <span className="text-[var(--ink)]">{lean}</span> : null}
          </div>
          <div className="h-px bg-[var(--line)]">
            <div className="h-px bg-[var(--slate)]" style={{ width: `${chorusPct}%` }} />
          </div>
        </div>
      )}
    </div>
  )
}
