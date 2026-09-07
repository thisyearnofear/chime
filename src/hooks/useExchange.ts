'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useWallet } from '@/hooks/useWallet'
import { bindWallet, unbindWallet } from '@/lib/markets/exchange'

export function useExchange() {
  const { address, isConnected, getWalletClient, networkMetrics } = useWallet()
  const bound = useRef<string | null>(null)

  useEffect(() => {
    if (!isConnected || !address || !networkMetrics.isOnSomnia) {
      if (bound.current) {
        void unbindWallet()
        bound.current = null
      }
      return
    }
    const client = getWalletClient()
    if (!client) return
    void bindWallet(client).then(() => {
      bound.current = address
    })
  }, [address, isConnected, networkMetrics.isOnSomnia, getWalletClient])

  const rebind = useCallback(async () => {
    const client = getWalletClient()
    if (!client) return
    await bindWallet(client)
    bound.current = address
  }, [getWalletClient, address])

  return { rebind }
}
