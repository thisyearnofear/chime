import { NextResponse } from 'next/server'
import { decideWindow } from '@/lib/agents/decide'
import { getDecision, listDecisions, setDecision } from '@/lib/agents/cache'
import type { Asset, IntervalSec, WindowDecision } from '@/types/markets'

const INTERVALS = new Set<number>([900, 3600, 14400, 86400])

function isAsset(value: unknown): value is Asset {
  return value === 'BTC' || value === 'ETH'
}

function isInterval(value: unknown): value is IntervalSec {
  return typeof value === 'number' && INTERVALS.has(value)
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  if (searchParams.get('all') === '1') {
    return NextResponse.json(listDecisions())
  }
  const marketId = searchParams.get('marketId')
  if (!marketId) {
    return NextResponse.json({ error: 'marketId required' }, { status: 400 })
  }
  const cached = getDecision(marketId)
  if (!cached) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }
  return NextResponse.json(cached)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const marketId = String(body.marketId ?? '')
    if (!marketId) {
      return NextResponse.json({ error: 'marketId required' }, { status: 400 })
    }

    const existing = getDecision(marketId)
    if (existing) {
      return NextResponse.json(existing)
    }

    if (!isAsset(body.asset) || !isInterval(Number(body.intervalSec))) {
      return NextResponse.json({ error: 'asset and intervalSec required' }, { status: 400 })
    }

    const decision: WindowDecision = await decideWindow({
      marketId,
      asset: body.asset,
      intervalSec: Number(body.intervalSec) as IntervalSec,
      expiry: Number(body.expiry) || Math.floor(Date.now() / 1000) + 900,
      secondsLeft: Number(body.secondsLeft) || 0,
      bestBid: body.bestBid == null ? null : Number(body.bestBid),
      bestAsk: body.bestAsk == null ? null : Number(body.bestAsk),
    })
    decision.asset = body.asset
    decision.intervalSec = Number(body.intervalSec) as IntervalSec
    setDecision(decision)
    return NextResponse.json(decision)
  } catch (error) {
    console.error('agents/window', error)
    return NextResponse.json({ error: 'decision failed' }, { status: 500 })
  }
}
