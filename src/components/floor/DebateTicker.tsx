'use client'

import type { AgentSeat } from '@/types/markets'

export function DebateTicker({ seats }: { seats?: [AgentSeat, AgentSeat] }) {
  if (!seats) return null
  return (
    <p className="text-[12px] text-[var(--mute)] leading-relaxed">
      {seats[0].label} {seats[0].side} · {seats[1].label} {seats[1].side}
    </p>
  )
}
