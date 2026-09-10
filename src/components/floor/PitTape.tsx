'use client'

import { useEffect } from 'react'
import { formatSide } from '@/lib/markets/format'
import { useMarketStore } from '@/stores/marketStore'
import { usePositionStore } from '@/stores/positionStore'
import { useChorusStore } from '@/stores/chorusStore'
import type { TapeRow } from '@/types/markets'

function clock(at: number): string {
  const d = new Date(at)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function PitTape() {
  const prints = useMarketStore((s) => s.tape)
  const events = usePositionStore((s) => s.events)
  const chimes = useChorusStore((s) => s.chimes)
  const hydrateChorus = useChorusStore((s) => s.hydrate)
  const window = useMarketStore((s) => s.window)

  useEffect(() => {
    hydrateChorus()
  }, [hydrateChorus])

  const follows: TapeRow[] = events
    .filter((e): e is typeof e & { type: 'follow' | 'fade' } => e.type === 'follow' || e.type === 'fade')
    .map((e) => ({
      id: e.id,
      at: e.at,
      kind: e.type,
      text: e.side
        ? `${e.type === 'follow' ? 'Follow' : 'Fade'} ${formatSide(e.side)}${e.detail ? ` · ${e.detail}` : ''}`
        : e.title,
      side: e.side,
    }))

  const chimed: TapeRow[] = chimes
    .filter((c) => !window || c.marketId === window.marketId)
    .map((c) => ({
      id: c.id,
      at: c.at,
      kind: 'chime' as const,
      text: `Chimed ${formatSide(c.side)}`,
      side: c.side,
    }))

  const rows = [...follows, ...prints, ...chimed].sort((a, b) => b.at - a.at).slice(0, 6)
  if (rows.length === 0) {
    return (
      <p className="mt-5 pt-4 border-t border-[var(--line)] text-[11px] text-[var(--mute)]">
        No prints yet — chimes, fills and follows show up here.
      </p>
    )
  }

  return (
    <ol className="mt-5 pt-4 border-t border-[var(--line)]">
      {rows.map((row) => (
        <li key={row.id} className="flex items-baseline justify-between gap-3 py-1.5 text-[11px] text-[var(--mute)]">
          <span className={row.side === 'up' ? 'text-[var(--brass)]' : row.side === 'down' ? 'text-[var(--slate)]' : undefined}>
            {row.text}
          </span>
          <span>{clock(row.at)}</span>
        </li>
      ))}
    </ol>
  )
}
