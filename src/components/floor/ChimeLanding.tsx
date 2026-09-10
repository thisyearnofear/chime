'use client'

import { useEffect, useState } from 'react'
import { formatCountdown, formatInterval, impliedUp, secondsLeft } from '@/lib/markets/format'
import { useMarketStore } from '@/stores/marketStore'
import type { LiveWindow } from '@/types/markets'

/** Four-note ritual indicator — observe · chime · stake · claim. Brass = done.
 * Lives here (not Floor) so both Floor and future surfaces share one voice.
 * `observe` is always done: rendering this means the user is looking at the floor. */
export function RitualDots({
  chimed,
  staked,
  claimed,
}: {
  chimed: boolean
  staked: boolean
  claimed: boolean
}) {
  const dots = [
    { label: 'observe', done: true },
    { label: 'chime', done: chimed },
    { label: 'stake', done: staked },
    { label: 'claim', done: claimed },
  ]
  return (
    <p className="mt-3 text-[11px] text-[var(--mute)]" aria-label="Your ritual: observe, chime, stake, claim">
      {dots.map((d, i) => (
        <span key={d.label}>
          {i > 0 && <span aria-hidden> · </span>}
          <span className={d.done ? 'text-[var(--brass)]' : undefined}>{d.label}</span>
        </span>
      ))}
    </p>
  )
}

interface ChimeLandingProps {
  /** The window encoded in the deep-link (currently locked/closed) */
  window: LiveWindow | null
  /** The finalUp value from the ?chime= param (0–100 integer) */
  finalUpPct: number
  /** Compact mode: single next-open line under the price (post-close hook) */
  compact?: boolean
}

/**
 * Banner shown when someone arrives via a ?chime=NN deep-link from a tweet.
 * Shows the closed window's last probability and counts down to the next open.
 * Dismisses itself when the next window opens (status becomes 1).
 */
export function ChimeLanding({ window: linkedWindow, finalUpPct, compact }: ChimeLandingProps) {
  const catalog = useMarketStore((s) => s.catalog)
  const [now, setNow] = useState(() => Date.now())
  const [dismissed, setDismissed] = useState(false)

  // Tick every second — drives countdown and `now`
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  if (dismissed) return null

  // Find the next live window for the same series in the catalog
  const nextLive = catalog.find(
    (w) =>
      w.status === 1 &&
      w.asset === linkedWindow?.asset &&
      w.intervalSec === linkedWindow?.intervalSec
  )

  // If the next window is already live, no countdown needed — just dismiss
  if (nextLive) {
    return null
  }

  // Find the soonest upcoming window across any series if same-series isn't live yet
  const soonest = catalog
    .filter((w) => w.status === 1)
    .sort((a, b) => a.expiry - b.expiry)[0] ?? null

  const cadence = linkedWindow
    ? `${linkedWindow.asset} ${formatInterval(linkedWindow.intervalSec)}`
    : 'that window'

  // Windows are contiguous buckets — the next one opens AT this window's expiry,
  // not one interval later. Count down to expiry; at ~0 fall through to live.
  const nextOpenSec = linkedWindow ? linkedWindow.expiry : null

  const waitLeft = nextOpenSec ? Math.max(0, nextOpenSec - now / 1000) : null
  const soonestLeft = soonest ? secondsLeft(soonest.expiry) : null
  const soonestUp = soonest
    ? Math.round(impliedUp(soonest.bestBid, soonest.bestAsk) * 100)
    : null

  // Compact: one retention line under the price — never a tombstone
  if (compact) {
    if (nextLive) return null
    return (
      <p className="mt-1 text-[11px] text-[var(--mute)]">
        {waitLeft !== null && waitLeft > 0 ? (
          <>next opens in <span className="text-[var(--ink)]">{formatCountdown(waitLeft)}</span> — stay to watch it live</>
        ) : soonest ? (
          <>{`${soonest.asset} ${formatInterval(soonest.intervalSec)}`} is live now{soonestLeft !== null && soonestLeft < 120 ? ` · ${formatCountdown(soonestLeft)} left` : null}{soonestUp !== null ? ` · ↑${soonestUp}¢` : null}</>
        ) : (
          <>checking for the next window…</>
        )}
      </p>
    )
  }

  return (
    <div className="mb-4 border border-[var(--brass)] bg-[var(--paper)] px-4 py-3 relative">
      <span className="tick tick-tl" aria-hidden />
      <span className="tick tick-tr" aria-hidden />
      <span className="tick tick-bl" aria-hidden />
      <span className="tick tick-br" aria-hidden />

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[13px] text-[var(--ink)]">
            <span className="text-[var(--brass)]">{cadence}</span>
            {' closed at '}
            <span className="text-[var(--brass)]">↑{finalUpPct}¢</span>
          </p>

          {waitLeft !== null && waitLeft > 0 ? (
            <p className="mt-1 text-[12px] text-[var(--mute)]">
              Next window opens in{' '}
              <span className="text-[var(--ink)]">{formatCountdown(waitLeft)}</span>
              {' — stay to watch it live'}
            </p>
          ) : soonest ? (
            <p className="mt-1 text-[12px] text-[var(--mute)]">
              {`${soonest.asset} ${formatInterval(soonest.intervalSec)}`} is live now
              {soonestLeft !== null && soonestLeft < 120
                ? ` · ${formatCountdown(soonestLeft)} left`
                : null}
              {soonestUp !== null
                ? ` · ↑${soonestUp}¢`
                : null}
            </p>
          ) : (
            <p className="mt-1 text-[12px] text-[var(--mute)]">
              Checking for the next window…
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-[11px] text-[var(--mute)] hover:text-[var(--ink)] shrink-0 mt-0.5"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
