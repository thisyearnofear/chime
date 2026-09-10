'use client'

import { useCallback } from 'react'
import { formatCountdown, formatInterval } from '@/lib/markets/format'
import type { LiveWindow } from '@/types/markets'

interface TensionShareProps {
  window: LiveWindow
  upPct: number
  secondsLeft: number
}

/**
 * "Share the tension" micro-button shown in the last 60s of a live window.
 * Opens a pre-filled Twitter/X intent so spectators can share the live
 * probability before the result is known — drama > receipts.
 */
export function TensionShare({ window: win, upPct, secondsLeft }: TensionShareProps) {
  const cadence = `${win.asset} ${formatInterval(win.intervalSec)}`
  const origin = typeof window !== 'undefined' ? globalThis.location.origin : 'https://chime.floor'

  // Deep-link back to this exact window
  const params = new URLSearchParams({ asset: win.asset, window: formatInterval(win.intervalSec) })
  const url = `${origin}/?${params.toString()}`

  const countdownStr = formatCountdown(secondsLeft)

  const tweetText = [
    `${cadence} · ${countdownStr} left · ↑${upPct}¢`,
    `Watch the last seconds live`,
    `#ChimeIn`,
    url,
  ].join(' · ')

  const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`

  const handleShare = useCallback(() => {
    globalThis.open(intentUrl, '_blank', 'noopener,noreferrer,width=600,height=500')
  }, [intentUrl])

  return (
    <button
      type="button"
      onClick={handleShare}
      className="chime-rise mt-4 inline-block text-[11px] text-[var(--halt)] hover:brightness-125 transition-[filter]"
      aria-label={`Share: ${cadence} · ${countdownStr} left`}
    >
      ↗ share the tension
    </button>
  )
}
