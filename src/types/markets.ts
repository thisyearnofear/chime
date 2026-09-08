export type Asset = 'BTC' | 'ETH'
export type IntervalSec = 900 | 3600 | 14400 | 86400
export type Side = 'up' | 'down'
export type MarketStatus = 0 | 1 | 2 | 3 | 4 | 5

export interface Series {
  asset: Asset
  intervalSec: IntervalSec
}

export interface LiveWindow {
  marketId: string
  asset: Asset
  intervalSec: IntervalSec
  expiry: number
  status: number
  upSymbol: string
  downSymbol: string
  bestBid: number | null
  bestAsk: number | null
  demo: boolean
}

export interface AgentSeat {
  label: string
  icon: string
  tagline: string
  side: Side
  line: string
  confidence: number
  forced: boolean
}

export interface WindowDecision {
  marketId: string
  expiry: number
  seats: [AgentSeat, AgentSeat]
  generatedAt: number
  asset?: Asset
  intervalSec?: IntervalSec
}

export interface TimelineEvent {
  id: string
  type: 'take' | 'taunt' | 'follow' | 'fade' | 'fill' | 'resolve' | 'claim' | 'system' | 'print'
  at: number
  title: string
  detail?: string
  side?: Side
  txHash?: string
}

export interface MidSample {
  at: number
  mid: number
}

export interface TapeRow {
  id: string
  at: number
  kind: 'print' | 'follow' | 'fade'
  text: string
  side?: Side
}

export interface DeskPosition {
  marketId: string
  marketAddress: string
  asset: string
  interval: string
  expiry: number
  side: Side
  amountLabel: string
  status: string
  claimable: boolean
  outcomeIdx: 0 | 1
}

export interface DeskFill {
  id: string
  at: number
  title: string
  detail?: string
  txHash?: string
  side?: Side
}

export interface RosterRow {
  label: string
  wins: number
  losses: number
  pushes: number
  pending: number
}

export interface ResolvedMarket {
  marketId: string
  asset: string
  intervalSec: number
  expiry: number
  voided: boolean
  winningOutcome: 0 | 1 | null
  status: string
}
