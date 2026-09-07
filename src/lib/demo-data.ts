import type { Asset, IntervalSec, LiveWindow, WindowDecision } from '@/types/markets'
import { seatsForWindow, heuristicSide } from '@/lib/agents/mapping'
import { getPersonality } from '@/lib/personality-presets'

export function demoWindow(asset: Asset, intervalSec: IntervalSec): LiveWindow {
  const now = Date.now() / 1000
  const expiry = Math.ceil((now + 5) / intervalSec) * intervalSec
  return {
    marketId: `demo-${asset}-${intervalSec}-${expiry}`,
    asset,
    intervalSec,
    expiry,
    status: 1,
    upSymbol: `${asset}-DEMO/USDso#YES`,
    downSymbol: `${asset}-DEMO/USDso#NO`,
    bestBid: 0.47,
    bestAsk: 0.53,
    demo: true,
  }
}

export function demoDecision(window: LiveWindow): WindowDecision {
  const [a, b] = seatsForWindow(window.marketId, window.asset, window.intervalSec)
  const sideA = heuristicSide(a, window.bestBid, window.bestAsk)
  const sideB: 'up' | 'down' = sideA === 'up' ? 'down' : 'up'
  const pa = getPersonality(a)
  const pb = getPersonality(b)
  return {
    marketId: window.marketId,
    expiry: window.expiry,
    generatedAt: Date.now(),
    seats: [
      {
        label: pa.label,
        icon: pa.icon,
        tagline: pa.tagline,
        side: sideA,
        line: `${sideA === 'up' ? 'Up' : 'Down'} — ${pa.tagline}`,
        confidence: 0.62,
        forced: false,
      },
      {
        label: pb.label,
        icon: pb.icon,
        tagline: pb.tagline,
        side: sideB,
        line: `${sideB === 'up' ? 'Up' : 'Down'} — ${pb.tagline}`,
        confidence: 0.58,
        forced: false,
      },
    ],
  }
}
