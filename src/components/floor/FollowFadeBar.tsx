'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Tap } from '@/components/ui/Tap'
import { useFollowTrade } from '@/hooks/useFollowTrade'
import { useMarketStore } from '@/stores/marketStore'
import { useAgentStore } from '@/stores/agentStore'
import { usePositionStore } from '@/stores/positionStore'
import { useChorusStore } from '@/stores/chorusStore'
import { useWallet } from '@/hooks/useWallet'
import { playChimeIn } from '@/lib/chime-sound'
import { getMarketNetwork } from '@/lib/markets/config'
import { sizeForPersonality } from '@/lib/agents/mapping'
import { formatSide, secondsLeft } from '@/lib/markets/format'

export function FollowFadeBar() {
  const { window } = useMarketStore()
  const { defaultSize } = useAgentStore()
  const { trade, pending, followed } = useFollowTrade()
  const stake = usePositionStore((s) => s.events.find((e) => e.type === 'follow' || e.type === 'fade'))
  const chimeIn = useChorusStore((s) => s.chime)
  const myChimes = useChorusStore((s) => s.chimes)
  const { isConnected } = useWallet()
  const net = getMarketNetwork()
  const [chimed, setChimed] = useState(false)

  const locked =
    !window || window.demo || window.status !== 1 || secondsLeft(window.expiry) < 15
  const size = followed ? sizeForPersonality(followed.label, defaultSize) : defaultSize
  const fresh = !isConnected || !stake
  const myChime = window ? myChimes.find((c) => c.marketId === window.marketId) : undefined

  const onChime = (side: 'up' | 'down') => {
    if (!window || window.status !== 1) return
    const isNew = chimeIn(window.marketId, side)
    playChimeIn()
    setChimed(true)
    setTimeout(() => setChimed(false), 2000)
    void isNew
  }

  return (
    <div id="follow-fade">
      {fresh && (
        <div className="mb-4 border border-[var(--line)] px-3 py-3">
          <p className="text-[12px] text-[var(--ink)]">1 Chime in free → 2 Faucet on Setup → 3 Follow</p>
          <p className="mt-1 text-[11px] text-[var(--mute)]">Voice costs nothing. Stake rides the seat. Winners claim on Desk.</p>
          <Link
            href="/setup"
            className="mt-3 inline-block h-11 px-5 text-[13px] leading-[2.75rem] bg-[var(--brass)] text-[var(--paper)] hover:brightness-110"
          >
            Start
          </Link>
        </div>
      )}
      {window && window.status === 1 && (
        <div className="mb-4">
          <p className="text-[12px] text-[var(--mute)] mb-3">
            {myChime
              ? `You chimed ${formatSide(myChime.side)} — stake it or leave it`
              : chimed
                ? 'Chimed in — voice on the tape'
                : 'Chime in free — no wallet, just a take'}
          </p>
          <div className="flex gap-3">
            <Tap tone="ghost" disabled={!window || window.status !== 1} onClick={() => onChime('up')}>
              Chime Up
            </Tap>
            <Tap tone="ghost" disabled={!window || window.status !== 1} onClick={() => onChime('down')}>
              Chime Down
            </Tap>
          </div>
        </div>
      )}
      <p className="text-[12px] text-[var(--mute)] mb-3">
        {followed
          ? `${followed.label} · ${followed.side} · ${size} ${net.collateralSymbol}`
          : 'Seats opening…'}
      </p>
      <div className="flex gap-3">
        <Tap tone="brass" disabled={pending || locked || !followed} onClick={() => void trade('follow')}>
          Follow
        </Tap>
        <Tap disabled={pending || locked || !followed} onClick={() => void trade('fade')}>
          Fade
        </Tap>
      </div>
      {locked && window && !window.demo && (
        <p className="text-[12px] text-[var(--mute)] mt-3">
          {window.status !== 1 ? 'Locked — wait for the next chime' : 'Too close to expiry'}
        </p>
      )}
      {window?.demo && (
        <p className="text-[12px] text-[var(--brass)] mt-3">Demo clock. Live books are on Watch.</p>
      )}
      {stake?.side && (
        <p className="text-[12px] text-[var(--brass)] mt-3">
          you&apos;re on {formatSide(stake.side)}
          {stake.detail ? ` · ${stake.detail}` : ''} ·{' '}
          <Link href="/dashboard">Desk</Link>
        </p>
      )}
    </div>
  )
}
