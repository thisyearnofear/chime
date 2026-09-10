'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { PERSONALITY_PRESETS } from '@/lib/personality-presets'
import { useAgentStore } from '@/stores/agentStore'
import { Frame } from '@/components/ui/Frame'
import { Page, PageHead } from '@/components/layout/Page'
import type { RosterRow } from '@/types/markets'

function winRate(row: RosterRow): number {
  const decided = row.wins + row.losses
  return decided === 0 ? 0 : row.wins / decided
}

export default function RosterPage() {
  const [rows, setRows] = useState<RosterRow[]>(() =>
    PERSONALITY_PRESETS.map((p) => ({ label: p.label, wins: 0, losses: 0, pushes: 0, pending: 0 }))
  )
  const [loaded, setLoaded] = useState(false)
  const [riding, setRiding] = useState<string | null>(null)
  const setAllegiance = useAgentStore((s) => s.setAllegiance)
  const allegiance = useAgentStore((s) => s.allegiance)

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

  const ranked = useMemo(
    () =>
      PERSONALITY_PRESETS.map((p, index) => ({
        preset: p,
        index,
        row: rows.find((r) => r.label === p.label) ?? { label: p.label, wins: 0, losses: 0, pushes: 0, pending: 0 },
      })).sort((a, b) => winRate(b.row) - winRate(a.row) || b.row.wins - a.row.wins),
    [rows]
  )

  const ride = (label: string) => {
    setAllegiance(label)
    setRiding(label)
    setTimeout(() => setRiding((v) => (v === label ? null : v)), 2000)
  }

  return (
    <Page>
      <PageHead title="Roster">
        House agents paper-trade against DreamDEX resolution. Voids are pushes. Pending means the window closed
        and the oracle has not printed. Ride the leader — allegiance follows you to the floor.
      </PageHead>
      <div className="max-w-3xl">
      <Frame label="HOUSE" meta={loaded ? 'scored' : 'scoring'}>
      <ul>
        {ranked.map(({ preset: p, row }) => {
          const rate = winRate(row)
          const pct = Math.round(rate * 100)
          const ridingThis = allegiance === p.label
          return (
            <li key={p.label} className="py-4 border-t border-[var(--line)] first:border-t-0">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="text-[15px] text-[var(--ink)]">
                  {p.icon ? <span aria-hidden className="mr-1.5 text-[13px]">{p.icon}</span> : null}
                  {p.label}
                  {ridingThis ? <span className="ml-2 text-[11px] text-[var(--brass)]">· you</span> : null}
                </h2>
                <p className="text-[12px] text-[var(--mute)]">
                  {row?.wins ?? 0}W · {row?.losses ?? 0}L · {row?.pushes ?? 0}P
                  {(row?.pending ?? 0) > 0 ? ` · ${row?.pending} pending` : ''}
                </p>
              </div>
              <div className="mt-2 h-px bg-[var(--line)]" role="img" aria-label={`${p.label} win rate ${pct} percent`}>
                <div className="h-px bg-[var(--brass)]" style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-2 flex items-center justify-between gap-4">
                <p className="text-[12px] text-[var(--mute)]">{p.tagline} · {pct}%</p>
                <span className="flex items-center gap-3">
                  {ridingThis ? (
                    <Link href="/" className="text-[12px] text-[var(--brass)] hover:underline">
                      Floor →
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => ride(p.label)}
                      className="text-[12px] text-[var(--mute)] hover:text-[var(--brass)]"
                    >
                      {riding === p.label ? 'riding' : 'Ride'}
                    </button>
                  )}
                </span>
              </div>
            </li>
          )
        })}
      </ul>
      {!loaded && <p className="mt-4 text-[12px] text-[var(--mute)]">Scoring…</p>}
      </Frame>
      </div>
    </Page>
  )
}
