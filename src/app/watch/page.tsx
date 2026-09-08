'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { WindowClock } from '@/components/floor/WindowClock'
import { Frame } from '@/components/ui/Frame'
import { Page, PageHead } from '@/components/layout/Page'
import { listLiveSeries } from '@/lib/markets/windows'
import { formatInterval, impliedUp } from '@/lib/markets/format'
import type { LiveWindow } from '@/types/markets'

export default function WatchPage() {
  const [windows, setWindows] = useState<LiveWindow[]>([])
  const [loading, setLoading] = useState(true)

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

  return (
    <Page>
      <PageHead title="Watch">Live series on this venue. Tap a clock to stand on that floor.</PageHead>

      {loading && windows.length === 0 && (
        <p className="text-[13px] text-[var(--mute)]">Listing windows…</p>
      )}

      <div className="grid sm:grid-cols-2 gap-[var(--gap)]">
        {windows.map((w) => (
          <Link
            key={w.marketId}
            href={`/?asset=${w.asset}&window=${formatInterval(w.intervalSec)}`}
            className="block hover:opacity-90"
          >
            <Frame
              label={`${w.asset} ${formatInterval(w.intervalSec)}`}
              meta={w.demo ? 'DEMO' : w.status === 1 ? 'LIVE' : 'LOCKED'}
            >
              <WindowClock window={w} upProbability={impliedUp(w.bestBid, w.bestAsk)} compact />
            </Frame>
          </Link>
        ))}
      </div>
    </Page>
  )
}
