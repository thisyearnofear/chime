'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { WindowClock } from '@/components/floor/WindowClock'
import { Frame } from '@/components/ui/Frame'
import { Page, PageHead } from '@/components/layout/Page'
import { listLiveSeries } from '@/lib/markets/windows'
import { formatCountdown, formatInterval, impliedUp, secondsLeft } from '@/lib/markets/format'
import type { LiveWindow } from '@/types/markets'

export default function WatchPage() {
  const [windows, setWindows] = useState<LiveWindow[]>([])
  const [loading, setLoading] = useState(true)
  const [, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const rows = await listLiveSeries(true)
        if (!cancelled) setWindows(rows)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    const id = setInterval(() => void load(), 8000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const sorted = useMemo(
    () => windows.slice().sort((a, b) => a.expiry - b.expiry),
    [windows]
  )

  return (
    <Page>
      <PageHead title="Watch">Live series on this venue. Tap a clock to stand on that floor.</PageHead>

      {loading && windows.length === 0 && (
        <p className="text-[13px] text-[var(--mute)]">Listing windows…</p>
      )}

      <div className="grid sm:grid-cols-2 gap-[var(--gap)]">
        {sorted.map((w) => {
          const left = secondsLeft(w.expiry)
          const halt = left < 30
          const up = Math.round(impliedUp(w.bestBid, w.bestAsk) * 100)
          return (
            <Link
              key={w.marketId}
              href={`/?asset=${w.asset}&window=${formatInterval(w.intervalSec)}`}
              className="block hover:opacity-90"
            >
              <Frame
                label={`${w.asset} ${formatInterval(w.intervalSec)}`}
                meta={
                  <span className={halt && w.status === 1 ? 'text-[var(--halt)]' : undefined}>
                    {w.demo ? 'DEMO' : w.status === 1 ? `${formatCountdown(left)} left` : 'LOCKED'}
                  </span>
                }
              >
                <WindowClock window={w} upProbability={impliedUp(w.bestBid, w.bestAsk)} compact />
                <p className="mt-3 text-[12px] text-[var(--mute)]">
                  <span className="text-[var(--brass)]">Up {up}¢</span>
                  {' · '}
                  <span className="text-[var(--slate)]">Down {100 - up}¢</span>
                </p>
              </Frame>
            </Link>
          )
        })}
      </div>
    </Page>
  )
}
