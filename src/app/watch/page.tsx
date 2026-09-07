'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { WindowClock } from '@/components/floor/WindowClock'
import { Frame } from '@/components/ui/Frame'
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
    <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
      <h1 className="font-display text-4xl text-[var(--ink)]">Watch</h1>
      <p className="mt-2 text-[13px] text-[var(--mute)] max-w-md">
        Live series on this venue. Tap a clock to stand on that floor.
      </p>

      {loading && windows.length === 0 && (
        <p className="mt-10 text-[13px] text-[var(--mute)]">Listing windows…</p>
      )}

      <div className="mt-8 grid sm:grid-cols-2 gap-4">
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
    </div>
  )
}
