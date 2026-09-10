'use client'

import { useEffect, useRef, useState } from 'react'
import { formatCountdown, formatInterval, remainingFraction, secondsLeft } from '@/lib/markets/format'
import { playClosingBell } from '@/lib/chime-sound'
import type { LiveWindow } from '@/types/markets'

interface WindowClockProps {
  window: LiveWindow | null
  upProbability: number
  locked?: boolean
  compact?: boolean
  /** Called once when the window transitions to done (CHIME moment) */
  onChime?: (finalUp: number) => void
}

export function WindowClock({ window, upProbability, locked, compact, onChime }: WindowClockProps) {
  const [, setTick] = useState(0)
  const wasOpen = useRef(false)
  /** Frozen final up-probability captured at the moment of close */
  const [cascadeUp, setCascadeUp] = useState<number | null>(null)
  /** Whether the cascade ring-sweep animation is running */
  const [sweeping, setSweeping] = useState(false)
  const prefersReduced = useRef(false)

  useEffect(() => {
    prefersReduced.current = globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 250)
    return () => clearInterval(id)
  }, [])

  const expiry = window?.expiry ?? 0
  const interval = window?.intervalSec ?? 900
  const left = window ? secondsLeft(expiry) : 0
  const remain = remainingFraction(expiry, interval)
  const done = left <= 0 || locked || (window != null && window.status !== 1)
  const hasBook = window?.bestBid != null || window?.bestAsk != null
  const up = hasBook ? Math.min(0.92, Math.max(0.08, upProbability)) : 0.5

  // Fire once on the done transition: freeze final probability, animate cascade
  useEffect(() => {
    if (!window) return
    if (!done) {
      wasOpen.current = true
      return
    }
    if (wasOpen.current) {
      wasOpen.current = false
      playClosingBell()
      const final = hasBook ? Math.min(0.92, Math.max(0.08, upProbability)) : 0.5
      setCascadeUp(final)
      onChime?.(final)
      if (!prefersReduced.current) {
        setSweeping(true)
        setTimeout(() => setSweeping(false), 2000)
      }
    }
  }, [done, window, hasBook, upProbability, onChime])

  const size = compact ? 220 : 360
  const cx = size / 2
  const cy = size / 2
  const r = compact ? 84 : 138
  const circ = 2 * Math.PI * r
  const dash = circ * remain
  const ringR = r - (compact ? 14 : 18)
  const ringCirc = 2 * Math.PI * ringR

  // After close, use frozen cascadeUp so the ring stays at final state
  const displayUp = done && cascadeUp !== null ? cascadeUp : up
  const cadence = window ? `${window.asset} ${formatInterval(window.intervalSec)}` : '…'

  // Display logic: during 2s cascade show final %, then switch to CHIME
  const finalPct = cascadeUp !== null ? Math.round(cascadeUp * 100) : null
  const display = !window
    ? '—'
    : done && sweeping && finalPct !== null
      ? `↑${finalPct}¢`
      : done
        ? 'CHIME'
        : formatCountdown(left)

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={compact ? 'min(56vw, 220px)' : 'min(72vw, 300px)'}
      height={compact ? 'min(56vw, 220px)' : 'min(72vw, 300px)'}
      role="img"
      aria-label={done ? 'Window closed' : `${display} remaining`}
      className={done && !locked ? 'chime-flash' : undefined}
    >
      <circle cx={cx} cy={cy} r={r + 12} fill="none" stroke="var(--line)" strokeWidth="1" />
      {Array.from({ length: 12 }, (_, i) => {
        const deg = i * 30
        const rad = ((deg - 90) * Math.PI) / 180
        const cardinal = deg % 90 === 0
        const inner = r + (cardinal ? 4 : 7)
        const outer = r + 12
        return (
          <line
            key={deg}
            x1={cx + Math.cos(rad) * inner}
            y1={cy + Math.sin(rad) * inner}
            x2={cx + Math.cos(rad) * outer}
            y2={cy + Math.sin(rad) * outer}
            stroke={cardinal ? 'var(--brass)' : 'var(--line)'}
            strokeWidth={cardinal ? 1.5 : 1}
          />
        )
      })}
      <circle cx={cx} cy={cy} r={r} fill="var(--paper)" stroke="var(--line)" strokeWidth="1" />
      {/* Remaining-time arc */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={left < 30 ? 'var(--halt)' : 'var(--brass)'}
        strokeWidth="3"
        strokeLinecap="butt"
        strokeDasharray={`${dash} ${circ}`}
        transform={`rotate(-90 ${cx} ${cy})`}
        opacity={done ? 0.25 : 1}
      />
      {/* Implied-up ring — animates to final value on cascade */}
      {hasBook && (
        <>
          <circle cx={cx} cy={cy} r={ringR} fill="none" stroke="var(--line)" strokeWidth="1" />
          <circle
            cx={cx}
            cy={cy}
            r={ringR}
            fill="none"
            stroke="var(--brass)"
            strokeWidth={sweeping ? 6 : 4}
            strokeDasharray={`${ringCirc * displayUp} ${ringCirc}`}
            transform={`rotate(-90 ${cx} ${cy})`}
            style={sweeping ? { transition: 'stroke-dasharray 1.8s cubic-bezier(0.4,0,0.2,1), stroke-width 0.3s' } : undefined}
          />
          <circle
            cx={cx}
            cy={cy}
            r={ringR}
            fill="none"
            stroke="var(--slate)"
            strokeWidth={sweeping ? 6 : 4}
            strokeDasharray={`${ringCirc * (1 - displayUp)} ${ringCirc}`}
            strokeDashoffset={-(ringCirc * displayUp)}
            transform={`rotate(-90 ${cx} ${cy})`}
            style={sweeping ? { transition: 'stroke-dasharray 1.8s cubic-bezier(0.4,0,0.2,1), stroke-width 0.3s' } : undefined}
          />
        </>
      )}
      <circle cx={cx} cy={cy} r={compact ? 52 : 78} fill="none" stroke="var(--line)" strokeWidth="1" />
      {/* Centre numeral: final % during sweep, then CHIME */}
      <text
        x={cx}
        y={cy - 4}
        textAnchor="middle"
        fill="var(--brass)"
        fontFamily="var(--font-jetbrains), ui-monospace, monospace"
        fontSize={compact || display.length > 5 ? 28 : done && sweeping ? 32 : 40}
        fontWeight="500"
      >
        {display}
      </text>
      {/* During cascade: show "closed at" sub-label */}
      <text
        x={cx}
        y={cy + 24}
        textAnchor="middle"
        fill={sweeping ? 'var(--brass)' : 'var(--mute)'}
        fontFamily="var(--font-jetbrains), ui-monospace, monospace"
        fontSize="12"
        style={sweeping ? { transition: 'fill 0.4s' } : undefined}
      >
        {sweeping ? 'closed at' : cadence}
      </text>
    </svg>
  )
}
