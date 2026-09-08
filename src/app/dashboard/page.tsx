'use client'

import Link from 'next/link'
import { Tap } from '@/components/ui/Tap'
import { Frame } from '@/components/ui/Frame'
import { Page, PageHead } from '@/components/layout/Page'
import { useAgentStore } from '@/stores/agentStore'
import { useWallet } from '@/hooks/useWallet'
import { useDesk } from '@/hooks/useDesk'
import { getMarketNetwork } from '@/lib/markets/config'
import { explorerTx, formatInterval } from '@/lib/markets/format'
import { useMarketStore } from '@/stores/marketStore'
import { usePositionStore } from '@/stores/positionStore'
import type { DeskFill, TimelineEvent } from '@/types/markets'

function fillKey(row: { id?: string; txHash?: string; at?: number; title?: string }): string {
  return row.txHash || row.id || `${row.at}-${row.title}`
}

export default function DashboardPage() {
  const { allegiance, decision } = useAgentStore()
  const { window } = useMarketStore()
  const { lastTxHash } = usePositionStore()
  const { balance, networkMetrics } = useWallet()
  const { isConnected, connect, positions, fills, events, loading, claiming, claimable, claim } = useDesk()
  const waitingOnIndexer = Boolean(
    lastTxHash && !fills.some((fill) => fill.txHash?.toLowerCase() === lastTxHash.toLowerCase())
  )
  const openTicket = positions.some((p) => p.status === 'Trading' || p.status === 'Locked' || p.status === 'Settling')
  const claimLabel = claiming
    ? 'Claiming…'
    : claimable
      ? 'Claim winnings'
      : openTicket
        ? 'Claim after the bell'
        : 'Scan & claim'
  const net = getMarketNetwork()
  const followed = decision?.seats.find((s) => s.label === allegiance)

  const chainFills: Array<DeskFill | TimelineEvent> = fills
  const sessionOnly = events.filter(
    (event) => !event.txHash || !fills.some((fill) => fill.txHash?.toLowerCase() === event.txHash?.toLowerCase())
  )
  const ledger = [...sessionOnly, ...chainFills].sort((a, b) => (b.at ?? 0) - (a.at ?? 0))

  return (
    <Page>
      <PageHead title="Desk">Positions from chain. Claim when a window finalizes.</PageHead>

      <div className="max-w-3xl flex flex-col gap-[var(--gap)]">
      <Frame label="DESK" meta={isConnected ? net.name : 'offline'}>
        {!isConnected && (
          <div className="flex items-center justify-between gap-4">
            <p className="text-[13px] text-[var(--mute)]">Connect to load fills and claim winnings.</p>
            <Tap tone="brass" onClick={() => void connect()}>
              Connect
            </Tap>
          </div>
        )}

        <dl className="mt-6 grid sm:grid-cols-2 gap-x-8 gap-y-4 text-[13px]">
          <div>
            <dt className="text-[var(--mute)]">Network</dt>
            <dd>
              {net.name}
              {networkMetrics.isOnSomnia ? '' : ' · switch'}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--mute)]">Gas</dt>
            <dd>
              {balance || '0'} {net.nativeCurrency.symbol}
            </dd>
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
            <dd>
              {lastTxHash ? (
                <a
                  href={explorerTx(net.blockExplorer, lastTxHash)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[var(--brass)]"
                >
                  {lastTxHash.slice(0, 10)}…
                </a>
              ) : (
                '—'
              )}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--mute)]">Take</dt>
            <dd>{followed?.line ?? 'Waiting for a take.'}</dd>
          </div>
        </dl>

        <div className="mt-8">
          <Tap onClick={() => void claim()} disabled={claiming || !isConnected}>
            {claimLabel}
          </Tap>
          <p className="mt-3 text-[12px] text-[var(--mute)]">
            {claimable
              ? 'Resolved windows pay here.'
              : 'Claim unlocks when the window finalizes. Scan still checks settled books.'}
          </p>
        </div>
      </Frame>

      <Frame label="POSITIONS" meta={loading ? 'reading' : `${positions.length}`}>
        {positions.length === 0 && (
          <p className="py-4 text-[13px] text-[var(--mute)]">
            {!isConnected
              ? 'Connect to see open windows.'
              : waitingOnIndexer
                ? 'Fill sent — indexer catching up. Last tx is above.'
                : 'No outcome shares on this wallet yet.'}
          </p>
        )}
        <ul>
          {positions.map((pos) => (
            <li key={`${pos.marketId}-${pos.outcomeIdx}`} className="py-4 border-t border-[var(--line)] first:border-t-0 text-[13px]">
              <div className="flex items-baseline justify-between gap-4">
                <p className="text-[var(--ink)]">
                  {pos.asset} {pos.interval} · {pos.side === 'up' ? 'Up' : 'Down'}
                </p>
                <p className="text-[var(--mute)]">
                  {pos.amountLabel} {pos.claimable ? ' · claimable' : ` · ${pos.status.toLowerCase()}`}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Frame>

      <Frame label="LEDGER" meta={ledger.length ? `${ledger.length}` : 'empty'}>
        <ol>
          {ledger.length === 0 && (
            <li className="py-4 text-[13px] text-[var(--mute)]">
              {waitingOnIndexer
                ? 'Waiting on the fill tape. Your tx is already on Shannon.'
                : 'Follow or fade a window. Fills land here.'}
            </li>
          )}
          {ledger.map((row) => (
            <li key={fillKey(row)} className="py-4 border-t border-[var(--line)] first:border-t-0 text-[13px]">
              <p className="text-[var(--ink)]">{row.title}</p>
              {row.detail && <p className="text-[var(--mute)] mt-1">{row.detail}</p>}
              {row.txHash && (
                <a
                  href={explorerTx(net.blockExplorer, row.txHash)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[var(--brass)] mt-1 inline-block"
                >
                  {row.txHash.slice(0, 10)}…
                </a>
              )}
            </li>
          ))}
        </ol>
      </Frame>
      </div>
    </Page>
  )
}
