'use client'

import { useCallback, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'chime:onboard-dismissed'

interface Props {
  onDismiss?: () => void
}

/**
 * One-time onboarding panel shown to first-time visitors.
 * Dismissed after they chime, or after manual close — stored in localStorage.
 * Shows three steps: watch → tap free → follow/fade with stake.
 */
export function OnboardHint({ onDismiss }: Props) {
  const [dismissed, setDismissed] = useState(false)
  const [visible, setVisible] = useState(false)

  // Hydrate from localStorage — defer to next tick to avoid
  // react-hooks/set-state-in-effect lint (accept tradeoff:
  // component renders once uncontrolled, then settles).
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'true') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDismissed(true)
      return
    }
    // Defer mount to avoid flash
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  const handleDismiss = useCallback(() => {
    setDismissed(true)
    localStorage.setItem(STORAGE_KEY, 'true')
    onDismiss?.()
  }, [onDismiss])

  if (dismissed || !visible) return null

  return (
    <div
      className={cn(
        'mb-4 border border-[var(--brass)] bg-[var(--paper)] px-4 py-3 relative',
        'transition-opacity duration-300',
        visible ? 'opacity-100' : 'opacity-0'
      )}
      role="region"
      aria-label="How to use CHIME"
    >
      {/* Corner ticks */}
      <span className="tick tick-tl" aria-hidden />
      <span className="tick tick-tr" aria-hidden />
      <span className="tick tick-bl" aria-hidden />
      <span className="tick tick-br" aria-hidden />

      <button
        type="button"
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-[11px] text-[var(--mute)] hover:text-[var(--ink)]"
        aria-label="Dismiss"
      >
        ✕
      </button>

      <h2 className="text-[13px] font-medium text-[var(--ink)] mb-2">
        What is CHIME?
      </h2>

      <p className="text-[12px] text-[var(--mute)] leading-relaxed mb-3">
        Two AI agents take opposite sides on a BTC or ETH window.
        Tap to chime free — then follow or fade with a stake.
      </p>

      <ol className="text-[11px] text-[var(--mute)] space-y-1.5">
        <li className="flex items-start gap-2">
          <span className="text-[var(--brass)] font-medium shrink-0">1.</span>
          <span>
            <span className="text-[var(--ink)]">Watch</span> the debate — two agents pick opposite sides (Up / Down).
          </span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-[var(--brass)] font-medium shrink-0">2.</span>
          <span>
            <span className="text-[var(--ink)]">Chime free</span> — tap Up or Down to join the chorus. No wallet needed.
          </span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-[var(--brass)] font-medium shrink-0">3.</span>
          <span>
            <span className="text-[var(--ink)]">Follow or fade</span> — stake tUSDC on your chosen side. One tap, instant fill.
          </span>
        </li>
      </ol>

      <p className="mt-3 text-[11px] text-[var(--mute)]">
        Your first chime dismisses this.{' '}
        <button
          type="button"
          onClick={handleDismiss}
          className="text-[var(--brass)] underline underline-offset-2 hover:text-[var(--ink)]"
        >
          Got it
        </button>
      </p>
    </div>
  )
}
