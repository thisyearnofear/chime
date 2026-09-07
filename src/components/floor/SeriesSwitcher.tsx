'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatInterval } from '@/lib/markets/format'
import { cn } from '@/lib/utils'
import { useMarketStore } from '@/stores/marketStore'
import type { Series } from '@/types/markets'

export function SeriesSwitcher({ series }: { series: Series | null }) {
  const router = useRouter()
  const catalog = useMarketStore((s) => s.catalog)
  const options =
    catalog.length > 0
      ? catalog.map((w) => ({
          asset: w.asset,
          intervalSec: w.intervalSec,
          label: `${w.asset} ${formatInterval(w.intervalSec)}`,
        }))
      : series
        ? [{ asset: series.asset, intervalSec: series.intervalSec, label: `${series.asset} ${formatInterval(series.intervalSec)}` }]
        : []

  return (
    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2 text-[12px]">
      {options.map((option) => {
        const active = series?.asset === option.asset && series.intervalSec === option.intervalSec
        return (
          <button
            key={option.label}
            type="button"
            onClick={() =>
              router.replace(`/?asset=${option.asset}&window=${formatInterval(option.intervalSec)}`)
            }
            className={cn(active ? 'text-[var(--brass)]' : 'text-[var(--mute)] hover:text-[var(--ink)]')}
          >
            {option.label}
          </button>
        )
      })}
      <Link href="/watch" className="text-[var(--mute)] hover:text-[var(--ink)]">
        All
      </Link>
    </div>
  )
}
