import { NextResponse } from 'next/server'
import { listDecisions } from '@/lib/agents/cache'
import { listResolvedFromIndexer } from '@/lib/markets/indexer'
import { PERSONALITY_PRESETS, getPersonality } from '@/lib/personality-presets'
import type { RosterRow } from '@/types/markets'

export async function GET() {
  const rows: RosterRow[] = PERSONALITY_PRESETS.map((p) => ({
    label: p.label,
    wins: 0,
    losses: 0,
    pushes: 0,
    pending: 0,
  }))
  const byLabel = new Map(rows.map((r) => [r.label, r]))

  try {
    const [decisions, resolved] = await Promise.all([listDecisions(), listResolvedFromIndexer()])
    const resolvedById = new Map(resolved.map((m) => [m.marketId.toLowerCase(), m]))

    for (const decision of decisions) {
      const market = resolvedById.get(decision.marketId.toLowerCase())
      for (const seat of decision.seats) {
        const row = byLabel.get(getPersonality(seat.label).label)
        if (!row) continue
        if (!market) {
          if (decision.expiry * 1000 <= Date.now()) row.pending += 1
          continue
        }
        if (market.voided || market.status === 'Voided') {
          row.pushes += 1
          continue
        }
        if (market.winningOutcome !== 0 && market.winningOutcome !== 1) {
          row.pending += 1
          continue
        }
        const won =
          (seat.side === 'up' && market.winningOutcome === 0) ||
          (seat.side === 'down' && market.winningOutcome === 1)
        if (won) row.wins += 1
        else row.losses += 1
      }
    }
  } catch (error) {
    console.error('agents/roster', error)
  }

  return NextResponse.json(rows)
}
