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
import { ChimeLanding, RitualDots } from './ChimeLanding'
import { OnboardHint } from './OnboardHint'
import { TensionShare } from './TensionShare'
import { WindowStory } from './WindowStory'
import { Frame } from '@/components/ui/Frame'
import { Page } from '@/components/layout/Page'
import { useLiveWindow } from '@/hooks/useLiveWindow'
import { useWindowAgents } from '@/hooks/useWindowAgents'
import { useAgentStore } from '@/stores/agentStore'
import { useExchange } from '@/hooks/useExchange'
import { useVoices } from '@/hooks/useVoices'
import { seriesFromSearch, useMarketStore } from '@/stores/marketStore'
import { useChorusStore } from '@/stores/chorusStore'
import { usePositionStore } from '@/stores/positionStore'
import { getPersonality } from '@/lib/personality-presets'
import { formatCountdown, formatInterval, impliedUp, secondsLeft } from '@/lib/markets/format'
import { cn } from '@/lib/utils'
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

  // ?chime=NN — integer 0–100 encoding the finalUp % from a shared tweet.
  // Non-numeric values are treated as absent (no banner, no misleading 50¢).
  const chimeParam = params.get('chime')
  const parsedChime = chimeParam !== null && chimeParam !== '1' ? Number(chimeParam) : null
  const arrivedViaChime = parsedChime !== null && Number.isFinite(parsedChime)
    ? parsedChime
    : chimeParam === '1'
      ? -1                 // legacy ?chime=1 (no pct encoded)
      : null               // not a chime deep-link

  // ?ride=Label — pre-select allegiance from a Roster share link
  const rideParam = params.get('ride')

  const { window } = useLiveWindow(series)
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

  // Tick for countdown displays (1s)
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('chime:allegiance')
    const size = Number(localStorage.getItem('chime:size'))
    // ?ride= deep-link takes priority over saved allegiance
    if (rideParam) {
      setAllegiance(getPersonality(rideParam).label)
    } else if (saved) {
      setAllegiance(getPersonality(saved).label)
    }
    if (Number.isFinite(size) && size > 0) setDefaultSize(size)
  }, [rideParam, setAllegiance, setDefaultSize])

  const handleChime = useCallback(
    (finalUp: number) => {
      if (!window) return
      if (chimedfRef.current === window.marketId) return
      chimedfRef.current = window.marketId
      setChimeState({ finalUp, marketId: window.marketId })
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
    const upWon = chimeState.finalUp >= 0.5
    const userWon = stake.side === 'up' ? upWon : !upWon
    return { userSide: stake.side, userWon }
  }, [chimeState, events])

  const up = impliedUp(window?.bestBid ?? null, window?.bestAsk ?? null)
  const upPct = Math.round(up * 100)
  const net = getMarketNetwork()
  const cadence = window ? `${window.asset} ${formatInterval(window.intervalSec)}` : '…'
  const status =
    !window ? '…' : window.demo ? 'DEMO' : window.status === 1 ? 'LIVE' : 'LOCKED'

  // Time remaining for TensionShare gating
  const left = window ? secondsLeft(window.expiry) : 0
  const hasBook = window?.bestBid != null || window?.bestAsk != null
  const showTension =
    window?.status === 1 && !window.demo && hasBook && left > 15 && left <= 60

  // Halt-zone styling for the price/time line (live book, final 30s)
  const haltLive = window?.status === 1 && !window.demo && hasBook && left < 30

  // Ritual progress, scoped to the current window (own events carry marketId).
  // `observe` is always done — you are looking at the floor.
  const chimedThisWindow = useChorusStore((s) => s.chimes)
  const hasChimed = window
    ? chimedThisWindow.some((c) => c.marketId === window.marketId)
    : false
  const windowStake = window
    ? events.find(
        (e) =>
          (e.type === 'follow' || e.type === 'fade') &&
          (!e.marketId || e.marketId === window.marketId)
      )
    : undefined
  const hasStaked = Boolean(windowStake?.side)
  const hasClaimed = events.some((e) => e.type === 'claim')

  // Voices CTA: scroll to the VISIBLE Follow/Fade (mobile + desktop both render)
  // innerWidth is read at tap time, not render time — no reactive dep needed.
  const scrollToFollowFade = useCallback(() => {
    const mobile = typeof globalThis.window !== 'undefined' && globalThis.window.innerWidth < 1024
    const el = document.getElementById(mobile ? 'follow-fade-mobile' : 'follow-fade-desktop')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [])

  // Show ChimeLanding only when window is locked/closed and ?chime param present
  const windowLocked = window ? window.status !== 1 : false
  const showLanding = arrivedViaChime !== null && windowLocked
  const landingFinalPct =
    arrivedViaChime !== null && arrivedViaChime >= 0
      ? arrivedViaChime
      : chimeState
        ? Math.round(chimeState.finalUp * 100)
        : 50

  return (
    <Page>
      <div className="mb-4">
        <SeriesSwitcher series={window ? { asset: window.asset, intervalSec: window.intervalSec } : series} />
      </div>

      {/* Deep-link landing banner */}
      {showLanding && (
        <ChimeLanding window={window} finalUpPct={landingFinalPct} />
      )}

      {/* First-time onboarding — dismissed after first chime or manual close */}
      {!showLanding && !arrivedViaChime && <OnboardHint />}

      {/* Post-close hook: every close (not just ?chime=) counts down to next open */}
      {!showLanding && cardVisible && chimeState && window && chimeState.marketId === window.marketId && (
        <ChimeLanding window={window} finalUpPct={Math.round(chimeState.finalUp * 100)} compact />
      )}

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

            {/* Price + time — one line, every tick, halt-red in the final 30s */}
            <p
              aria-live="off"
              className={cn(
                'mt-3 text-[13px]',
                haltLive ? 'text-[var(--halt)]' : 'text-[var(--ink)]'
              )}
            >
              {window && hasBook ? (
                <>
                  <span className="chime-numeral" key={upPct}>↑{upPct}¢</span>
                  {' · '}
                  {window.status === 1 ? (
                    <>{formatCountdown(left)} left</>
                  ) : (
                    <>locked — wait for the next chime</>
                  )}
                </>
              ) : window && !hasBook ? (
                <span className="text-[var(--mute)]">No book yet — check Watch for live windows</span>
              ) : (
                <span className="text-[var(--mute)]">Connecting…</span>
              )}
            </p>

            <p className="mt-3 text-[15px] text-[var(--ink)]">
              Two AI agents take opposite sides on a BTC or ETH window.
              Tap to chime free — then follow or fade with a stake.
            </p>
            <RitualDots chimed={hasChimed} staked={hasStaked} claimed={hasClaimed} />

            {/* Voices — zero-state recruits, count reports, 3+ is a CTA */}
            {voices === 0 ? (
              <button
                type="button"
                onClick={scrollToFollowFade}
                className="chime-rise mt-3 text-[11px] text-left text-[var(--mute)] hover:text-[var(--brass)] transition-colors"
              >
                Be the first voice — <span className="underline underline-offset-2">chime in free (no wallet)</span>
              </button>
            ) : voices >= 3 ? (
              <button
                type="button"
                onClick={scrollToFollowFade}
                className="mt-3 text-[11px] text-left hover:text-[var(--brass)] transition-colors"
              >
                <span className="text-[var(--brass)]">{voices}</span>
                {' traders chimed in — '}
                <span className="underline underline-offset-2">join them (free)</span>
              </button>
            ) : (
              <p className="mt-3 text-[11px] text-[var(--mute)]">
                <span className="text-[var(--brass)]">{voices}</span>
                {voices === 1 ? ' voice' : ' voices'} chimed in{' '}
                <span className="text-[var(--mute)]/70">(free, no wallet)</span>
              </p>
            )}

            <div className="mt-6 pt-5 border-t border-[var(--line)]">
              <DebateTicker seats={decision?.seats} />
              <WindowStory mids={mids} />
              <ImpliedSpark mids={mids} window={window} />
              <ProbabilityRail window={window} />
            </div>

            {/* TensionShare — after the book context, before the stake control */}
            {showTension && (
              <TensionShare window={window} upPct={upPct} secondsLeft={left} />
            )}

            {window?.demo && (
              <p className="mt-4 text-[12px] text-[var(--brass)]">Demo clock — stakes are simulated, nothing on-chain.</p>
            )}
            <div className="lg:hidden mt-6 pt-5 border-t border-[var(--line)] chime-sticky-bar">
              <FollowFadeBar barId="follow-fade-mobile" />
            </div>
          </Frame>

          {/* Chime card — rises in below WINDOW after the bell */}
          {cardVisible && chimeState && window && chimeState.marketId === window.marketId && (
            <div className="chime-rise" key={chimeState.marketId}>
              <ChimeCard
                window={window}
                finalUp={chimeState.finalUp}
                voices={voices}
                userSide={userSide}
                userWon={userWon}
                onDismiss={dismissCard}
              />
            </div>
          )}
        </div>

        <Frame label="PIT" meta="01 / 02">
          <AgentPit
            seats={decision?.seats}
            allegiance={allegiance}
            onPick={setAllegiance}
            action={<FollowFadeBar barId="follow-fade-desktop" />}
            upPct={upPct}
            secondsLeft={left}
          />
        </Frame>
      </div>
    </Page>
  )
}
