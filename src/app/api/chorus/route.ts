import { NextResponse } from 'next/server'
import { addChime, getTally } from '@/lib/chorus/server'

/**
 * Shared chorus aggregate — every browser's free chime lands here,
 * so the rail shows a real crowd, not one browser's taps.
 *
 * GET  /api/chorus?marketId=…   → { marketId, up, down, updatedAt }
 * POST /api/chorus { marketId, side: 'up' | 'down' } → tally (200 cap, 24h TTL)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const marketId = searchParams.get('marketId')
  if (!marketId) {
    return NextResponse.json({ error: 'marketId required' }, { status: 400 })
  }
  return NextResponse.json(getTally(marketId))
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const marketId = String(body.marketId ?? '')
    const side = body.side === 'down' ? 'down' : body.side === 'up' ? 'up' : null
    if (!marketId || !side) {
      return NextResponse.json({ error: 'marketId and side (up|down) required' }, { status: 400 })
    }
    return NextResponse.json(addChime(marketId, side))
  } catch (error) {
    console.error('chorus', error)
    return NextResponse.json({ error: 'chime failed' }, { status: 500 })
  }
}
