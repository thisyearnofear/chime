'use client'

import { useCallback, useEffect } from 'react'
import { useAgentStore } from '@/stores/agentStore'
import { useMarketStore } from '@/stores/marketStore'
import { usePositionStore } from '@/stores/positionStore'
import { useWallet } from '@/hooks/useWallet'
import { useExchange } from '@/hooks/useExchange'
import { useAddToast } from '@/components/unified/UnifiedToast'
import { placeFollowOrder, TradeError } from '@/lib/markets/trade'
import { sizeForPersonality } from '@/lib/agents/mapping'
import { getMarketNetwork } from '@/lib/markets/config'
import { explorerTx } from '@/lib/markets/format'
import type { Side } from '@/types/markets'

export function useFollowTrade() {
  const { window } = useMarketStore()
  const { decision, allegiance, defaultSize } = useAgentStore()
  const { pending, setPending, pushEvent, setLastTxHash, hydrate } = usePositionStore()
  const { address, isConnected, connect, networkMetrics, switchToSomnia, trackTransactionSpeed } = useWallet()

  useEffect(() => {
    hydrate(address)
  }, [address, hydrate])
  const { rebind } = useExchange()
  const addToast = useAddToast()
  const net = getMarketNetwork()

  const followed = decision?.seats.find((s) => s.label === allegiance) ?? decision?.seats[0]

  const trade = useCallback(async (intent: 'follow' | 'fade') => {
    if (!window || !followed) return
    if (!isConnected) {
      await connect()
      return
    }
    if (!networkMetrics.isOnSomnia) {
      await switchToSomnia()
      return
    }

    const side: Side = intent === 'follow' ? followed.side : followed.side === 'up' ? 'down' : 'up'
    const size = sizeForPersonality(followed.label, defaultSize)
    setPending(true)
    try {
      await rebind()
      const { txHash } = await placeFollowOrder({ window, side, size })
      setLastTxHash(txHash ?? null)
      pushEvent({
        id: `${Date.now()}`,
        type: intent,
        at: Date.now(),
        title: `${intent === 'follow' ? 'Followed' : 'Faded'} ${followed.label}`,
        detail: `${size} ${net.collateralSymbol}`,
        side,
        txHash,
      })
      addToast({
        type: 'success',
        message: txHash
          ? `${intent === 'follow' ? 'Follow' : 'Fade'} sent · ${txHash.slice(0, 10)}…`
          : `${intent === 'follow' ? 'Follow' : 'Fade'} submitted.`,
      })
      if (txHash) {
        void trackTransactionSpeed(txHash)
        console.info('trade', explorerTx(net.blockExplorer, txHash))
      }
    } catch (error) {
      const code = error instanceof TradeError ? error.code : 'TRADE'
      const message = error instanceof Error ? error.message : 'Trade failed'
      addToast({ type: code === 'DEMO' ? 'warning' : 'error', message })
    } finally {
      setPending(false)
    }
  }, [
    window,
    followed,
    isConnected,
    connect,
    networkMetrics.isOnSomnia,
    switchToSomnia,
    defaultSize,
    setPending,
    rebind,
    setLastTxHash,
    pushEvent,
    addToast,
    net.collateralSymbol,
    net.blockExplorer,
    trackTransactionSpeed,
  ])

  return { trade, pending, followed }
}
