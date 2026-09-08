'use client'

import { impliedUp } from '@/lib/markets/format'
import type { LiveWindow } from '@/types/markets'

export function ProbabilityRail({ window }: { window: LiveWindow | null }) {
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
    </div>
  )
}
