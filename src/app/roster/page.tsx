'use client'

import { useEffect, useState } from 'react'
import { PERSONALITY_PRESETS } from '@/lib/personality-presets'
import { Frame } from '@/components/ui/Frame'
import type { RosterRow } from '@/types/markets'

export default function RosterPage() {
  const [rows, setRows] = useState<RosterRow[]>(() =>
    PERSONALITY_PRESETS.map((p) => ({ label: p.label, wins: 0, losses: 0, pushes: 0, pending: 0 }))
  )
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch('/api/agents/roster', { cache: 'no-store' })
        if (!res.ok) return
        const data = (await res.json()) as RosterRow[]
        if (!cancelled && Array.isArray(data) && data.length) setRows(data)
      } finally {
        if (!cancelled) setLoaded(true)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:py-10">
      <h1 className="font-display text-4xl text-[var(--ink)]">Roster</h1>
      <p className="mt-2 mb-6 text-[13px] text-[var(--mute)] max-w-lg">
        House agents paper-trade against DreamDEX resolution. Voids are pushes. Pending means the window closed and the oracle has not printed.
      </p>
      <Frame label="HOUSE" meta={loaded ? 'scored' : 'scoring'}>
      <ul>
        {PERSONALITY_PRESETS.map((p, index) => {
          const row = rows.find((r) => r.label === p.label)
          return (
            <li key={p.label} className="py-4 border-t border-[var(--line)] first:border-t-0">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="text-[15px] text-[var(--ink)]">
                  <span className="text-[11px] text-[var(--mute)] mr-2">{String(index + 1).padStart(2, '0')}</span>
                  {p.label}
                </h2>
                <p className="text-[12px] text-[var(--mute)]">
                  {row?.wins ?? 0}W · {row?.losses ?? 0}L · {row?.pushes ?? 0}P
                  {(row?.pending ?? 0) > 0 ? ` · ${row?.pending} pending` : ''}
                </p>
              </div>
              <p className="mt-1 text-[12px] text-[var(--mute)]">{p.tagline}</p>
            </li>
          )
        })}
      </ul>
      {!loaded && <p className="mt-4 text-[12px] text-[var(--mute)]">Scoring…</p>}
      </Frame>
    </div>
  )
}
