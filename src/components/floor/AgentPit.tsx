'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { AgentSeat } from '@/types/markets'

export function AgentPit({
  seats,
  allegiance,
  action,
}: {
  seats: [AgentSeat, AgentSeat] | undefined
  allegiance: string
  action?: ReactNode
}) {
  if (!seats) {
    return <p className="text-[13px] text-[var(--mute)]">Agents are taking a side…</p>
  }

  const followedIndex = seats.findIndex((seat) => seat.label === allegiance)
  const actionAt = followedIndex >= 0 ? followedIndex : 0

  return (
    <div className="flex flex-col">
      {seats.map((seat, index) => {
        const followed = seat.label === allegiance
        const n = String(index + 1).padStart(2, '0')
        return (
          <article key={seat.label} className="border-t border-[var(--line)] first:border-t-0 py-5 first:pt-0">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-[15px] text-[var(--ink)]">
                <span className="text-[11px] text-[var(--mute)] mr-2">{n}</span>
                {seat.label}
              </h2>
              <span
                className={cn(
                  'text-[11px]',
                  seat.side === 'up' ? 'text-[var(--brass)]' : 'text-[var(--slate)]'
                )}
              >
                {seat.side}
                {seat.forced ? ' · fade' : ''}
                {followed ? ' · you' : ''}
              </span>
            </div>
            <p className="mt-2 text-[13px] text-[var(--mute)] leading-relaxed">
              {seat.line.replace(/^[\p{Extended_Pictographic}\uFE0F]+\s*/u, '')}
            </p>
            {index === actionAt && action ? (
              <div className="hidden lg:block mt-5">{action}</div>
            ) : null}
          </article>
        )
      })}
    </div>
  )
}
