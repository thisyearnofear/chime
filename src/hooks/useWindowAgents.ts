'use client'

import { useEffect } from 'react'
import { demoDecision } from '@/lib/demo-data'
import { useAgentStore } from '@/stores/agentStore'
import type { LiveWindow, WindowDecision } from '@/types/markets'

export function useWindowAgents(window: LiveWindow | null) {
  const { decision, loading, setDecision, setLoading } = useAgentStore()

  useEffect(() => {
    if (!window) return
    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const query = `/api/agents/window?marketId=${encodeURIComponent(window.marketId)}`
        const existing = await fetch(query)
        if (existing.ok) {
          const data = (await existing.json()) as WindowDecision
          if (!cancelled) setDecision(data)
          return
        }
        const created = await fetch('/api/agents/window', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            marketId: window.marketId,
            asset: window.asset,
            intervalSec: window.intervalSec,
            expiry: window.expiry,
            secondsLeft: Math.max(0, window.expiry - Date.now() / 1000),
            bestBid: window.bestBid,
            bestAsk: window.bestAsk,
          }),
        })
        if (created.ok) {
          const data = (await created.json()) as WindowDecision
          if (!cancelled) setDecision(data)
          return
        }
        if (!cancelled) setDecision(demoDecision(window))
      } catch {
        if (!cancelled) setDecision(demoDecision(window))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
    // Intentionally keyed on marketId so book polls do not regenerate the take.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [window?.marketId, setDecision, setLoading])

  return { decision, loading }
}
