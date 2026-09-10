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
}

export function WindowClock({ window, upProbability, locked, compact }: WindowClockProps) {
  const [, setTick] = useState(0)
  const wasOpen = useRef(false)

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

  const size = compact ? 220 : 360
  const cx = size / 2
  const cy = size / 2
  const r = compact ? 84 : 138
  const circ = 2 * Math.PI * r
  const dash = circ * remain
  const display = !window ? '—' : done ? 'CHIME' : formatCountdown(left)
  const cadence = window ? `${window.asset} ${formatInterval(window.intervalSec)}` : '…'
  const ringR = r - (compact ? 14 : 18)
  const ringCirc = 2 * Math.PI * ringR

  useEffect(() => {
    if (!window) return
    if (!done) {
      wasOpen.current = true
      return
    }
    if (wasOpen.current) {
      wasOpen.current = false
      playClosingBell()
    }
  }, [done, window])

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
      {hasBook && (
        <>
          <circle cx={cx} cy={cy} r={ringR} fill="none" stroke="var(--line)" strokeWidth="1" />
          <circle
            cx={cx}
            cy={cy}
            r={ringR}
            fill="none"
            stroke="var(--brass)"
            strokeWidth="4"
            strokeDasharray={`${ringCirc * up} ${ringCirc}`}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
          <circle
            cx={cx}
            cy={cy}
            r={ringR}
            fill="none"
            stroke="var(--slate)"
            strokeWidth="4"
            strokeDasharray={`${ringCirc * (1 - up)} ${ringCirc}`}
            strokeDashoffset={-(ringCirc * up)}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        </>
      )}
      <circle cx={cx} cy={cy} r={compact ? 52 : 78} fill="none" stroke="var(--line)" strokeWidth="1" />
      <text
        x={cx}
        y={cy - 4}
        textAnchor="middle"
        fill={done ? 'var(--brass)' : 'var(--ink)'}
        fontFamily="var(--font-jetbrains), ui-monospace, monospace"
        fontSize={compact || display.length > 5 ? 28 : 40}
        fontWeight="500"
      >
        {display}
      </text>
      <text
        x={cx}
        y={cy + 24}
        textAnchor="middle"
        fill="var(--mute)"
        fontFamily="var(--font-jetbrains), ui-monospace, monospace"
        fontSize="12"
      >
        {cadence}
      </text>
    </svg>
  )
}
