'use client'

import { secondsLeft } from '@/lib/markets/format'
import type { LiveWindow, MidSample } from '@/types/markets'

function range(mids: MidSample[]): { lo: number; hi: number } {
  const values = mids.map((s) => s.mid)
  let lo = Math.min(...values)
  let hi = Math.max(...values)
  if (hi - lo < 0.04) {
    const mid = (lo + hi) / 2
    lo = mid - 0.05
    hi = mid + 0.05
  }
  return { lo: Math.max(0, lo), hi: Math.min(1, hi) }
}

export function ImpliedSpark({
  mids,
  window,
}: {
  mids: MidSample[]
  window: LiveWindow | null
}) {
  if (!window) return null
  if (window.bestBid == null && window.bestAsk == null) {
    return (
      <p className="mt-4 text-[11px] text-[var(--mute)]">
        No book yet — sparkline plots implied Up once a bid or ask prints.
      </p>
    )
  }

  const halt = secondsLeft(window.expiry) < 30 || window.status !== 1
  const last = mids[mids.length - 1]
  const { lo, hi } = range(mids)
  const span = Math.max(0.001, hi - lo)
  const w = 100
  const h = 28
  const x = (i: number) => (mids.length === 1 ? w : (i / (mids.length - 1)) * w)
  const y = (mid: number) => h - ((mid - lo) / span) * h
  const d = mids.map((s, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(2)} ${y(s.mid).toFixed(2)}`).join(' ')
  const midY = 0.5 >= lo && 0.5 <= hi ? y(0.5) : null
  const stroke = halt ? 'var(--halt)' : last.mid >= 0.5 ? 'var(--brass)' : 'var(--slate)'
  const cents = Math.round(last.mid * 100)

  return (
    <div className="mt-4">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        width="100%"
        height="48"
        preserveAspectRatio="none"
        role="img"
        aria-label={`Implied up ${cents} cents`}
      >
        {midY != null && (
          <line x1="0" y1={midY} x2={w} y2={midY} stroke="var(--line)" strokeWidth="0.6" />
        )}
        {mids.length === 1 ? (
          <circle cx={w} cy={y(last.mid)} r="1.6" fill={stroke} />
        ) : (
          <path d={d} fill="none" stroke={stroke} strokeWidth="1.6" strokeLinejoin="miter" />
        )}
      </svg>
    </div>
  )
}
