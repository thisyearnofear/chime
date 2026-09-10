'use client'

import { useCallback, useEffect, useState } from 'react'
import { useWallet } from '@/hooks/useWallet'
import { useExchange } from '@/hooks/useExchange'
import { usePositionStore } from '@/stores/positionStore'
import { loadDesk } from '@/lib/markets/desk'
import { redeemWinnings, TradeError } from '@/lib/markets/trade'
import { useAddToast } from '@/components/unified/UnifiedToast'
import { useMarketStore } from '@/stores/marketStore'
import type { DeskFill, DeskPosition } from '@/types/markets'

export function useDesk() {
  const { address, isConnected, connect } = useWallet()
  const { rebind } = useExchange()
  const { events, hydrate, lastTxHash, setLastTxHash, pushEvent } = usePositionStore()
  const window = useMarketStore((s) => s.window)
  const addToast = useAddToast()
  const [positions, setPositions] = useState<DeskPosition[]>([])
  const [fills, setFills] = useState<DeskFill[]>([])
  const [loading, setLoading] = useState(false)
  const [claiming, setClaiming] = useState(false)

  const refresh = useCallback(async () => {
    if (!isConnected || !address) {
      setPositions([])
      setFills([])
      return
    }
    setLoading(true)
    try {
      await rebind()
      const desk = await loadDesk(address, window)
      setPositions(desk.positions)
      setFills(desk.fills)
    } catch (error) {
      console.warn('desk load', error)
    } finally {
      setLoading(false)
    }
  }, [address, isConnected, rebind, window])

  useEffect(() => {
    hydrate(address)
  }, [address, hydrate])

  useEffect(() => {
    // Load chain positions when the bound wallet changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (!isConnected || !lastTxHash) return
    const indexed = fills.some((fill) => fill.txHash?.toLowerCase() === lastTxHash.toLowerCase())
    if (indexed) return
    let n = 0
    const id = setInterval(() => {
      n += 1
      void refresh()
      if (n >= 12) clearInterval(id)
    }, 3000)
    return () => clearInterval(id)
  }, [isConnected, lastTxHash, fills, refresh])

  const claim = useCallback(async () => {
    setClaiming(true)
    try {
      await rebind()
      const { claimed, hashes } = await redeemWinnings(address ?? undefined)
      if (hashes[0]) setLastTxHash(hashes[0])
      if (claimed > 0) {
        pushEvent({
          id: hashes[0] ?? `claim-${Date.now()}`,
          type: 'claim',
          at: Date.now(),
          title: `Claimed ${claimed} position(s)`,
          detail: hashes[0] ? `${hashes[0].slice(0, 10)}…` : undefined,
          txHash: hashes[0],
          marketId: window?.marketId,
        })
      }
      addToast({
        type: claimed ? 'success' : 'info',
        message: claimed
          ? `Claimed ${claimed} position(s).`
          : 'Nothing payable yet. Claim unlocks after the window finalizes.',
      })
      await refresh()
    } catch (error) {
      addToast({
        type: 'error',
        message: error instanceof TradeError || error instanceof Error ? error.message : 'Claim failed',
      })
    } finally {
      setClaiming(false)
    }
  }, [address, rebind, addToast, setLastTxHash, pushEvent, window, refresh])

  const claimable = positions.some((p) => p.claimable)

  return {
    address,
    isConnected,
    connect,
    positions,
    fills,
    events,
    loading,
    claiming,
    claimable,
    claim,
    refresh,
  }
}
