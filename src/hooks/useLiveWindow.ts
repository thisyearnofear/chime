'use client'

import { useEffect, useRef } from 'react'
import type { LiveWindow, Series } from '@/types/markets'
import {
  attachBook,
  fetchLiveCatalog,
  findLiveWindow,
  refreshOnchainStatus,
  resolveCanonicalSymbols,
} from '@/lib/markets/windows'
import { useMarketStore } from '@/stores/marketStore'

export function useLiveWindow(series: Series | null) {
  const { window, loading, error, usingDemo, setWindow, setLoading, setError, setSeries, setCatalog } =
    useMarketStore()
  const painted = useRef(false)

  useEffect(() => {
    setSeries(series)
    setWindow(null)
    setLoading(true)
    let cancelled = false
    painted.current = false

    const enrich = async (live: LiveWindow) => {
      if (live.demo) return live
      const withSymbols = await resolveCanonicalSymbols(live)
      const withStatus = await refreshOnchainStatus(withSymbols)
      return attachBook(withStatus)
    }

    const load = async (isPoll: boolean) => {
      try {
        if (!isPoll) setLoading(true)
        const catalog = await fetchLiveCatalog()
        if (cancelled) return
        setCatalog(catalog)
        const live = await findLiveWindow(series, true, catalog)
        if (cancelled) return
        if (!painted.current) {
          setWindow(live)
          setLoading(false)
          painted.current = true
        }
        const enriched = await enrich(live)
        if (!cancelled) {
          setWindow(enriched)
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Floor unavailable')
          setLoading(false)
        }
      }
    }

    void load(false)
    const timer = setInterval(() => void load(true), 8000)

    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [series, setCatalog, setError, setLoading, setSeries, setWindow])

  return { window, loading, error, usingDemo }
}
