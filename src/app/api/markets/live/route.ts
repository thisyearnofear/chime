import { NextResponse } from 'next/server'
import { listLiveFromIndexer } from '@/lib/markets/indexer'

export async function GET() {
  try {
    const windows = await listLiveFromIndexer()
    return NextResponse.json(windows)
  } catch (error) {
    console.error('markets/live', error)
    return NextResponse.json([], { status: 200 })
  }
}
