import { NextResponse } from 'next/server'
import { listResolvedFromIndexer } from '@/lib/markets/indexer'

export async function GET() {
  try {
    const markets = await listResolvedFromIndexer()
    return NextResponse.json(markets)
  } catch (error) {
    console.error('markets/resolved', error)
    return NextResponse.json([], { status: 200 })
  }
}
