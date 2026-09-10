'use client'

import { useCallback, useRef, useState } from 'react'
import { formatInterval } from '@/lib/markets/format'
import type { LiveWindow, Side } from '@/types/markets'

interface ChimeCardProps {
  window: LiveWindow
  finalUp: number
  voices: number
  userSide?: Side
  userWon?: boolean
  onDismiss?: () => void
}

/**
 * Pure SVG snapshot shown after a window closes.
 * Generates a shareable tweet text and copies it to clipboard.
 * No new colors — uses the existing CSS custom properties.
 */
export function ChimeCard({ window: win, finalUp, voices, userSide, userWon, onDismiss }: ChimeCardProps) {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const upPct = Math.round(finalUp * 100)
  const downPct = 100 - upPct
  const cadence = `${win.asset} ${formatInterval(win.intervalSec)}`
  const closeTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  // Compose tweet text
  const outcome = userSide
    ? userWon === true
      ? `I called ${userSide === 'up' ? 'Up' : 'Down'} · won`
      : userWon === false
        ? `I called ${userSide === 'up' ? 'Up' : 'Down'} · lost`
        : `I chimed in on ${userSide === 'up' ? 'Up' : 'Down'}`
    : null

  const voiceLabel = voices === 1 ? '1 voice chimed in' : `${voices} voices chimed in`
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://chime.floor'

  const tweetText = [
    `${cadence} closed at ↑${upPct}¢`,
    outcome ?? voiceLabel,
    `#ChimeIn`,
    baseUrl,
  ].join(' · ')

  const handleShare = useCallback(() => {
    void navigator.clipboard?.writeText(tweetText).then(() => {
      setCopied(true)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setCopied(false), 2500)
    })
  }, [tweetText])

  // SVG card dimensions
  const W = 400
  const H = 220
  const cx = W / 2
  // Ring geometry
  const rOuter = 60
  const rInner = 44
  const ringCirc = 2 * Math.PI * rOuter
  const upArc = ringCirc * finalUp
  const downArc = ringCirc * (1 - finalUp)

  return (
    <div className="mt-6 border border-[var(--brass)] bg-[var(--paper)] relative">
      {/* Brass corner ticks */}
      <span className="tick tick-tl" aria-hidden />
      <span className="tick tick-tr" aria-hidden />
      <span className="tick tick-bl" aria-hidden />
      <span className="tick tick-br" aria-hidden />

      {/* Header */}
      <div className="flex items-baseline justify-between px-4 py-2 border-b border-[var(--brass)] text-[11px]">
        <span className="text-[var(--ink)]">CHIME</span>
        <span className="text-[var(--mute)]">{closeTime}</span>
      </div>

      {/* SVG card body */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label={`${cadence} closed at Up ${upPct} cents`}
        className="block"
      >
        {/* Left: ring + final probability */}
        <g transform="translate(90, 110)">
          {/* outer border ring */}
          <circle cx={0} cy={0} r={rOuter + 8} fill="none" stroke="#2a261f" strokeWidth="1" />
          {/* Up arc */}
          <circle
            cx={0} cy={0} r={rOuter}
            fill="none"
            stroke="#c4a15a"
            strokeWidth="7"
            strokeDasharray={`${upArc} ${ringCirc}`}
            transform="rotate(-90)"
            strokeLinecap="butt"
          />
          {/* Down arc */}
          <circle
            cx={0} cy={0} r={rOuter}
            fill="none"
            stroke="#7d847c"
            strokeWidth="7"
            strokeDasharray={`${downArc} ${ringCirc}`}
            strokeDashoffset={-upArc}
            transform="rotate(-90)"
            strokeLinecap="butt"
          />
          {/* Inner well */}
          <circle cx={0} cy={0} r={rInner} fill="#100e0b" stroke="#2a261f" strokeWidth="1" />
          {/* Final % */}
          <text
            x={0} y={-5}
            textAnchor="middle"
            fill="#c4a15a"
            fontFamily="var(--font-jetbrains), ui-monospace, monospace"
            fontSize="22"
            fontWeight="500"
          >
            ↑{upPct}¢
          </text>
          <text
            x={0} y={14}
            textAnchor="middle"
            fill="#7d847c"
            fontFamily="var(--font-jetbrains), ui-monospace, monospace"
            fontSize="10"
          >
            ↓{downPct}¢
          </text>
        </g>

        {/* Divider */}
        <line x1="170" y1="20" x2="170" y2="200" stroke="#2a261f" strokeWidth="1" />

        {/* Right: metadata */}
        <g transform="translate(192, 0)">
          {/* Wordmark */}
          <text
            x={0} y={46}
            fill="#ece7dc"
            fontFamily="'Newsreader', 'Times New Roman', serif"
            fontSize="28"
            fontWeight="400"
          >
            CHIME
          </text>

          {/* Cadence */}
          <text
            x={0} y={72}
            fill="#8a8478"
            fontFamily="var(--font-jetbrains), ui-monospace, monospace"
            fontSize="11"
          >
            {cadence}
          </text>

          {/* Voices */}
          <text
            x={0} y={102}
            fill="#c4a15a"
            fontFamily="var(--font-jetbrains), ui-monospace, monospace"
            fontSize="13"
            fontWeight="500"
          >
            {voices === 1 ? '1 voice' : `${voices} voices`}
          </text>
          <text
            x={0} y={118}
            fill="#8a8478"
            fontFamily="var(--font-jetbrains), ui-monospace, monospace"
            fontSize="11"
          >
            chimed in
          </text>

          {/* User outcome if present */}
          {outcome && (
            <>
              <line x1={0} y1={132} x2={200} y2={132} stroke="#2a261f" strokeWidth="1" />
              <text
                x={0} y={150}
                fill={userWon === true ? '#c4a15a' : userWon === false ? '#7d847c' : '#ece7dc'}
                fontFamily="var(--font-jetbrains), ui-monospace, monospace"
                fontSize="11"
              >
                {outcome}
              </text>
            </>
          )}

          {/* #ChimeIn tag */}
          <text
            x={0} y={H - 20}
            fill="#8a8478"
            fontFamily="var(--font-jetbrains), ui-monospace, monospace"
            fontSize="11"
          >
            #ChimeIn
          </text>
        </g>
      </svg>

      {/* Action bar */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-[var(--line)]">
        <button
          type="button"
          onClick={handleShare}
          className="h-9 px-4 text-[12px] bg-[var(--brass)] text-[var(--paper)] hover:brightness-110 transition-[filter]"
        >
          {copied ? 'copied ✓' : 'Share your call'}
        </button>
        <p className="text-[11px] text-[var(--mute)] flex-1 truncate hidden sm:block">
          {tweetText}
        </p>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-[11px] text-[var(--mute)] hover:text-[var(--ink)]"
            aria-label="Dismiss"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}
