'use client'

import Link from 'next/link'
import { Tap } from '@/components/ui/Tap'
import { useFollowTrade } from '@/hooks/useFollowTrade'
import { useMarketStore } from '@/stores/marketStore'
import { useAgentStore } from '@/stores/agentStore'
import { usePositionStore } from '@/stores/positionStore'
import { getMarketNetwork } from '@/lib/markets/config'
import { sizeForPersonality } from '@/lib/agents/mapping'
import { formatSide, secondsLeft } from '@/lib/markets/format'

export function FollowFadeBar() {
  const { window } = useMarketStore()
  const { defaultSize } = useAgentStore()
  const { trade, pending, followed } = useFollowTrade()
  const stake = usePositionStore((s) => s.events.find((e) => e.type === 'follow' || e.type === 'fade'))
  const net = getMarketNetwork()

  const locked =
    !window || window.demo || window.status !== 1 || secondsLeft(window.expiry) < 15
  const size = followed ? sizeForPersonality(followed.label, defaultSize) : defaultSize

  return (
    <div>
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
