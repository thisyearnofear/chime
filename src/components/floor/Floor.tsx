'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { WindowClock } from './WindowClock'
import { ProbabilityRail } from './ProbabilityRail'
import { ImpliedSpark } from './ImpliedSpark'
import { AgentPit } from './AgentPit'
import { DebateTicker } from './DebateTicker'
import { FollowFadeBar } from './FollowFadeBar'
import { SeriesSwitcher } from './SeriesSwitcher'
import { ChimeCard } from './ChimeCard'
import { Frame } from '@/components/ui/Frame'
import { Page } from '@/components/layout/Page'
import { useLiveWindow } from '@/hooks/useLiveWindow'
import { useWindowAgents } from '@/hooks/useWindowAgents'
import { useAgentStore } from '@/stores/agentStore'
import { useExchange } from '@/hooks/useExchange'
import { useVoices } from '@/hooks/useVoices'
import { seriesFromSearch, useMarketStore } from '@/stores/marketStore'
import { usePositionStore } from '@/stores/positionStore'
import { getPersonality } from '@/lib/personality-presets'
import { formatInterval, impliedUp } from '@/lib/markets/format'
import { getMarketNetwork } from '@/lib/markets/config'
import type { Side } from '@/types/markets'

interface ChimeState {
  finalUp: number
  marketId: string
}

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
  const events = usePositionStore((s) => s.events)
  const voices = useVoices()
  useExchange()

  // ChimeCard state — shown after the closing bell fires
  const [chimeState, setChimeState] = useState<ChimeState | null>(null)
  const [cardVisible, setCardVisible] = useState(false)
  // Prevent re-triggering for the same marketId
  const chimedfRef = useRef<string | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('chime:allegiance')
    const size = Number(localStorage.getItem('chime:size'))
    if (saved) setAllegiance(getPersonality(saved).label)
    if (Number.isFinite(size) && size > 0) setDefaultSize(size)
  }, [setAllegiance, setDefaultSize])

  const handleChime = useCallback(
    (finalUp: number) => {
      if (!window) return
      if (chimedfRef.current === window.marketId) return
      chimedfRef.current = window.marketId
      setChimeState({ finalUp, marketId: window.marketId })
      // Small delay so the clock cascade animation plays first
      setTimeout(() => setCardVisible(true), 2200)
    },
    [window]
  )

  const dismissCard = useCallback(() => setCardVisible(false), [])

  // Derive userSide and userWon from position events for this window
  const { userSide, userWon } = useMemo((): { userSide?: Side; userWon?: boolean } => {
    if (!chimeState) return {}
    const stake = events.find(
      (e) =>
        (e.type === 'follow' || e.type === 'fade') &&
        (!e.marketId || e.marketId === chimeState.marketId)
    )
    if (!stake?.side) return {}
    // Determine outcome: Up wins if finalUp >= 0.5, Down wins otherwise
    const upWon = chimeState.finalUp >= 0.5
    const userWon = stake.side === 'up' ? upWon : !upWon
    return { userSide: stake.side, userWon }
  }, [chimeState, events])

  const up = impliedUp(window?.bestBid ?? null, window?.bestAsk ?? null)
  const net = getMarketNetwork()
  const cadence = window ? `${window.asset} ${formatInterval(window.intervalSec)}` : '…'
  const status =
    !window ? '…' : window.demo ? 'DEMO' : window.status === 1 ? 'LIVE' : 'LOCKED'

  // Reset card when window changes (new window opened)
  // Done via render-time guard rather than an effect to avoid cascading setState.
  return (
    <Page>
      <div className="mb-4">
        <SeriesSwitcher series={window ? { asset: window.asset, intervalSec: window.intervalSec } : series} />
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(280px,380px)] gap-[var(--gap)] items-start">
        <div className="flex flex-col gap-[var(--gap)]">
          <Frame
            label="WINDOW"
            meta={
              <>
                {status} · {cadence} · {net.collateralSymbol}
              </>
            }
          >
            <div className="flex justify-center lg:justify-start">
              <WindowClock
                window={window}
                upProbability={up}
                locked={window ? window.status !== 1 : false}
                onChime={handleChime}
              />
            </div>

            {/* Voices count — shown when there's an active book */}
            {voices > 0 && (
              <p className="mt-3 text-[11px] text-[var(--mute)]">
                <span className="text-[var(--brass)]">{voices}</span>
                {voices === 1 ? ' voice' : ' voices'} chimed in
              </p>
            )}

            <p className="mt-3 text-[15px] text-[var(--ink)]">Two seats. One window. Follow or fade.</p>
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

          {/* Chime card — appears below WINDOW frame after the bell */}
          {cardVisible && chimeState && window && chimeState.marketId === window.marketId && (
            <ChimeCard
              window={window}
              finalUp={chimeState.finalUp}
              voices={voices}
              userSide={userSide}
              userWon={userWon}
              onDismiss={dismissCard}
            />
          )}
        </div>

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
