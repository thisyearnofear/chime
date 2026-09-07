'use client'

import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { WindowClock } from './WindowClock'
import { ProbabilityRail } from './ProbabilityRail'
import { AgentPit } from './AgentPit'
import { DebateTicker } from './DebateTicker'
import { FollowFadeBar } from './FollowFadeBar'
import { SeriesSwitcher } from './SeriesSwitcher'
import { useLiveWindow } from '@/hooks/useLiveWindow'
import { useWindowAgents } from '@/hooks/useWindowAgents'
import { useAgentStore } from '@/stores/agentStore'
import { useExchange } from '@/hooks/useExchange'
import { seriesFromSearch } from '@/stores/marketStore'
import { getPersonality } from '@/lib/personality-presets'
import { impliedUp } from '@/lib/markets/format'

export function Floor() {
  const params = useSearchParams()
  const series = useMemo(() => {
    if (!params.get('asset') && !params.get('window')) return null
    return seriesFromSearch(params.get('asset'), params.get('window'))
  }, [params])
  const { window, loading, usingDemo } = useLiveWindow(series)
  const { decision } = useWindowAgents(window)
  const allegiance = useAgentStore((s) => s.allegiance)
  const setAllegiance = useAgentStore((s) => s.setAllegiance)
  const setDefaultSize = useAgentStore((s) => s.setDefaultSize)
  useExchange()

  useEffect(() => {
    const saved = localStorage.getItem('chime:allegiance')
    const size = Number(localStorage.getItem('chime:size'))
    if (saved) setAllegiance(getPersonality(saved).label)
    if (Number.isFinite(size) && size > 0) setDefaultSize(size)
  }, [setAllegiance, setDefaultSize])

  const up = impliedUp(window?.bestBid ?? null, window?.bestAsk ?? null)

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 md:py-12">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(280px,380px)] gap-10 lg:gap-16 items-start">
        <div>
          <SeriesSwitcher series={window ? { asset: window.asset, intervalSec: window.intervalSec } : series} />
          <div className="mt-8 flex justify-center lg:justify-start">
            <WindowClock window={window} upProbability={up} locked={window ? window.status !== 1 : false} />
          </div>
          <div className="mt-4 max-w-sm">
            <DebateTicker seats={decision?.seats} />
            <ProbabilityRail window={window} />
          </div>
          {usingDemo && (
            <p className="mt-4 text-[12px] text-[var(--mute)]">No live book for this cadence. Live windows are listed above.</p>
          )}
          {window && !window.demo && window.status !== 1 && (
            <p className="mt-4 text-[12px] text-[var(--brass)]">Window locked — wait for the next chime</p>
          )}
          {loading && !window && <p className="mt-8 text-[13px] text-[var(--mute)]">Connecting…</p>}
        </div>

        <aside className="lg:pt-10">
          <AgentPit seats={decision?.seats} allegiance={allegiance} />
          <FollowFadeBar />
        </aside>
      </div>
    </section>
  )
}
