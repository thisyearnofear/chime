'use client'

import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { WindowClock } from './WindowClock'
import { ProbabilityRail } from './ProbabilityRail'
import { ImpliedSpark } from './ImpliedSpark'
import { AgentPit } from './AgentPit'
import { DebateTicker } from './DebateTicker'
import { FollowFadeBar } from './FollowFadeBar'
import { SeriesSwitcher } from './SeriesSwitcher'
import { Frame } from '@/components/ui/Frame'
import { Page } from '@/components/layout/Page'
import { useLiveWindow } from '@/hooks/useLiveWindow'
import { useWindowAgents } from '@/hooks/useWindowAgents'
import { useAgentStore } from '@/stores/agentStore'
import { useExchange } from '@/hooks/useExchange'
import { seriesFromSearch, useMarketStore } from '@/stores/marketStore'
import { getPersonality } from '@/lib/personality-presets'
import { formatInterval, impliedUp } from '@/lib/markets/format'
import { getMarketNetwork } from '@/lib/markets/config'

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
  const mids = useMarketStore((s) => s.mids)
  useExchange()

  useEffect(() => {
    const saved = localStorage.getItem('chime:allegiance')
    const size = Number(localStorage.getItem('chime:size'))
    if (saved) setAllegiance(getPersonality(saved).label)
    if (Number.isFinite(size) && size > 0) setDefaultSize(size)
  }, [setAllegiance, setDefaultSize])

  const up = impliedUp(window?.bestBid ?? null, window?.bestAsk ?? null)
  const net = getMarketNetwork()
  const cadence = window ? `${window.asset} ${formatInterval(window.intervalSec)}` : '…'
  const status =
    !window ? '…' : window.demo ? 'DEMO' : window.status === 1 ? 'LIVE' : 'LOCKED'

  return (
    <Page>
      <div className="mb-4">
        <SeriesSwitcher series={window ? { asset: window.asset, intervalSec: window.intervalSec } : series} />
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(280px,380px)] gap-[var(--gap)] items-start">
        <Frame
          label="WINDOW"
          meta={
            <>
              {status} · {cadence} · {net.collateralSymbol}
            </>
          }
        >
          <div className="flex justify-center lg:justify-start">
            <WindowClock window={window} upProbability={up} locked={window ? window.status !== 1 : false} />
          </div>
          <p className="mt-5 text-[15px] text-[var(--ink)]">Two seats. One window. Follow or fade.</p>
          <p className="mt-1 text-[12px] text-[var(--mute)]">
            Follow rides the seat · fade takes the other side · winners claim on Desk
          </p>
          <div className="mt-3">
            <DebateTicker seats={decision?.seats} />
            <ImpliedSpark mids={mids} window={window} />
            <ProbabilityRail window={window} />
          </div>
          {usingDemo && (
            <p className="mt-4 text-[12px] text-[var(--mute)]">No live book for this cadence. Live windows are listed above.</p>
          )}
          {window && !window.demo && window.status !== 1 && (
            <p className="mt-4 text-[12px] text-[var(--brass)]">Window locked — wait for the next chime</p>
          )}
          {loading && !window && <p className="mt-6 text-[13px] text-[var(--mute)]">Connecting…</p>}
          <div className="lg:hidden mt-6 pt-5 border-t border-[var(--line)]">
            <FollowFadeBar />
          </div>
        </Frame>

        <Frame label="PIT" meta="01 / 02">
          <AgentPit
            seats={decision?.seats}
            allegiance={allegiance}
            onPick={setAllegiance}
            action={<FollowFadeBar />}
          />
        </Frame>
      </div>
    </Page>
  )
}
