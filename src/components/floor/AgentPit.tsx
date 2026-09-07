'use client'

import { cn } from '@/lib/utils'
import type { AgentSeat } from '@/types/markets'

export function AgentPit({
  seats,
  allegiance,
}: {
  seats: [AgentSeat, AgentSeat] | undefined
  allegiance: string
}) {
  if (!seats) {
    return <p className="text-[13px] text-[var(--mute)]">Agents are taking a side…</p>
  }

  return (
    <div className="flex flex-col gap-6">
      {seats.map((seat) => {
        const followed = seat.label === allegiance
        return (
          <article key={seat.label} className="border-t border-[var(--line)] pt-4">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-[15px] text-[var(--ink)]">{seat.label}</h2>
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
          </article>
        )
      })}
    </div>
  )
}
