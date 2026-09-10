'use client'

import type { MidSample } from '@/types/markets'

interface WindowStoryProps {
  mids: MidSample[]
}

/**
 * One-line narrative derived from the mid-price history:
 * "Opened 45¢ · high 71¢ · now 63¢"
 *
 * Gives inbound visitors (e.g. from a tweet) instant context
 * without needing to read the sparkline.
 * Hidden until at least 2 samples exist.
 */
export function WindowStory({ mids }: WindowStoryProps) {
  if (mids.length < 2) return null

  const opened = Math.round(mids[0].mid * 100)
  const high = Math.round(Math.max(...mids.map((s) => s.mid)) * 100)
  const low = Math.round(Math.min(...mids.map((s) => s.mid)) * 100)
  const now = Math.round(mids[mids.length - 1].mid * 100)

  // Only show high/low if there's meaningful movement (>3¢ spread)
  const spread = high - low
  const hasMovement = spread >= 3

  return (
    <p className="mt-2 text-[11px] text-[var(--mute)]">
      <span>opened </span>
      <span className="text-[var(--ink)]">{opened}¢</span>
      {hasMovement && (
        <>
          <span> · high </span>
          <span className="text-[var(--brass)]">{high}¢</span>
        </>
      )}
      <span> · now </span>
      <span className={now >= 50 ? 'text-[var(--brass)]' : 'text-[var(--slate)]'}>{now}¢</span>
    </p>
  )
}
