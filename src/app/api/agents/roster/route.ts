import { NextResponse } from 'next/server'
import { listDecisions } from '@/lib/agents/cache'
import { listResolvedFromIndexer } from '@/lib/markets/indexer'
import { PERSONALITY_PRESETS, getPersonality } from '@/lib/personality-presets'
import { formatInterval } from '@/lib/markets/format'
import type { RosterRow } from '@/types/markets'

function blankRow(label: string): RosterRow {
  return {
    label,
    wins: 0,
    losses: 0,
    pushes: 0,
    pending: 0,
    favouredWins: 0,
    favouredLosses: 0,
    againstWins: 0,
    againstLosses: 0,
    cadences: [],
  }
}

export async function GET() {
  const rows: RosterRow[] = PERSONALITY_PRESETS.map((p) => blankRow(p.label))
  const byLabel = new Map(rows.map((r) => [r.label, r]))

  try {
    const [decisions, resolved] = await Promise.all([listDecisions(), listResolvedFromIndexer()])
    const resolvedById = new Map(resolved.map((m) => [m.marketId.toLowerCase(), m]))

    for (const decision of decisions) {
      const market = resolvedById.get(decision.marketId.toLowerCase())
      // Mid at take time: stored on new decisions, else neutral 0.5 (no split).
      const mid = typeof decision.mid === 'number' ? decision.mid : 0.5
      const favourite: 'up' | 'down' = mid >= 0.5 ? 'up' : 'down'
      const cadence = decision.intervalSec ? formatInterval(decision.intervalSec) : null
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
        // Favoured / against split — only when the take-time mid leaned either way.
        // Neutral 0.5 (legacy decisions without a stored mid) stays out of the split.
        if (mid !== 0.5 && cadence && !row.cadences.includes(cadence)) row.cadences.push(cadence)
        if (mid === 0.5) continue
        const favoured = seat.side === favourite
        if (favoured && won) row.favouredWins += 1
        else if (favoured) row.favouredLosses += 1
        else if (won) row.againstWins += 1
        else row.againstLosses += 1
      }
    }
  } catch (error) {
    console.error('agents/roster', error)
  }

  return NextResponse.json(rows)
}
