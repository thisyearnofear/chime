'use client'

import Link from 'next/link'
import { Tap } from '@/components/ui/Tap'
import { useAgentStore } from '@/stores/agentStore'
import { usePositionStore } from '@/stores/positionStore'
import { useWallet } from '@/hooks/useWallet'
import { useExchange } from '@/hooks/useExchange'
import { useMarketStore } from '@/stores/marketStore'
import { redeemWinnings, TradeError } from '@/lib/markets/trade'
import { getMarketNetwork } from '@/lib/markets/config'
import { useAddToast } from '@/components/unified/UnifiedToast'
import { useState } from 'react'
import { formatInterval } from '@/lib/markets/format'

export default function DashboardPage() {
  const { allegiance, decision } = useAgentStore()
  const { events, lastTxHash } = usePositionStore()
  const { window } = useMarketStore()
  const { isConnected, connect, balance, networkMetrics } = useWallet()
  useExchange()
  const addToast = useAddToast()
  const net = getMarketNetwork()
  const [claiming, setClaiming] = useState(false)

  const onClaim = async () => {
    setClaiming(true)
    try {
      const { claimed } = await redeemWinnings()
      addToast({
        type: claimed ? 'success' : 'info',
        message: claimed ? `Claimed ${claimed} position(s).` : 'Nothing to claim on recent Finalized windows.',
      })
    } catch (error) {
      addToast({
        type: 'error',
        message: error instanceof TradeError || error instanceof Error ? error.message : 'Claim failed',
      })
    } finally {
      setClaiming(false)
    }
  }

  const followed = decision?.seats.find((s) => s.label === allegiance)

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-4xl text-[var(--ink)]">Desk</h1>
      <p className="mt-2 text-[13px] text-[var(--mute)]">Fills, claim, allegiance.</p>

      {!isConnected && (
        <div className="mt-8 flex items-center justify-between gap-4 border-t border-[var(--line)] pt-6">
          <p className="text-[13px] text-[var(--mute)]">Connect to see fills and claim winnings.</p>
          <Tap tone="brass" onClick={() => void connect()}>
            Connect
          </Tap>
        </div>
      )}

      <dl className="mt-10 grid sm:grid-cols-2 gap-x-8 gap-y-4 text-[13px]">
        <div>
          <dt className="text-[var(--mute)]">Network</dt>
          <dd>{net.name}{networkMetrics.isOnSomnia ? '' : ' · switch'}</dd>
        </div>
        <div>
          <dt className="text-[var(--mute)]">Gas</dt>
          <dd>{balance || '0'} {net.nativeCurrency.symbol}</dd>
        </div>
        <div>
          <dt className="text-[var(--mute)]">Allegiance</dt>
          <dd>
            {allegiance}{' '}
            <Link href="/setup" className="text-[var(--brass)]">
              change
            </Link>
          </dd>
        </div>
        <div>
          <dt className="text-[var(--mute)]">Window</dt>
          <dd>{window ? `${window.asset} ${formatInterval(window.intervalSec)}` : '—'}</dd>
        </div>
        <div>
          <dt className="text-[var(--mute)]">Last tx</dt>
          <dd>{lastTxHash ? `${lastTxHash.slice(0, 10)}…` : '—'}</dd>
        </div>
        <div>
          <dt className="text-[var(--mute)]">Take</dt>
          <dd>{followed?.line ?? 'Waiting for a take.'}</dd>
        </div>
      </dl>

      <div className="mt-8">
        <Tap onClick={() => void onClaim()} disabled={claiming || !isConnected}>
          {claiming ? 'Claiming…' : 'Claim winnings'}
        </Tap>
      </div>

      <ol className="mt-12 border-t border-[var(--line)]">
        {events.length === 0 && (
          <li className="py-6 text-[13px] text-[var(--mute)]">Follow or fade a window. The chain starts here.</li>
        )}
        {events.map((event) => (
          <li key={event.id} className="py-4 border-b border-[var(--line)] text-[13px]">
            <p className="text-[var(--ink)]">{event.title}</p>
            {event.detail && <p className="text-[var(--mute)] mt-1">{event.detail}</p>}
          </li>
        ))}
      </ol>
    </div>
  )
}
