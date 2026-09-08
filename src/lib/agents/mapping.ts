import { PERSONALITY_PRESETS, getPersonality } from '@/lib/personality-presets'
import type { Asset, IntervalSec, Side } from '@/types/markets'
import { impliedUp } from '@/lib/markets/format'

export interface PersonalityBias {
  label: string
  sizeMultiplier: number
  prefers: 900 | 3600 | 14400 | 86400 | 'either'
  class: 'momentum' | 'fade' | 'mixed'
}

export const PERSONALITY_BIAS: Record<string, PersonalityBias> = {
  Disciplined: { label: 'Disciplined', sizeMultiplier: 0.5, prefers: 'either', class: 'fade' },
  Encouraging: { label: 'Encouraging', sizeMultiplier: 0.75, prefers: 3600, class: 'momentum' },
  Competitive: { label: 'Competitive', sizeMultiplier: 1.25, prefers: 900, class: 'momentum' },
  Philosophical: { label: 'Philosophical', sizeMultiplier: 0.6, prefers: 3600, class: 'fade' },
  Taker: { label: 'Taker', sizeMultiplier: 1.5, prefers: 900, class: 'momentum' },
  Patient: { label: 'Patient', sizeMultiplier: 0.35, prefers: 3600, class: 'fade' },
}

const SERIES_SEATS: Record<string, [string, string]> = {
  'BTC-900': ['Taker', 'Patient'],
  'ETH-900': ['Competitive', 'Disciplined'],
  'BTC-3600': ['Encouraging', 'Philosophical'],
  'ETH-3600': ['Competitive', 'Philosophical'],
  'BTC-14400': ['Disciplined', 'Encouraging'],
  'ETH-14400': ['Competitive', 'Patient'],
  'BTC-86400': ['Taker', 'Patient'],
  'ETH-86400': ['Competitive', 'Philosophical'],
}

function hashString(value: string): number {
  let h = 0
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) >>> 0
  return h
}

export function seatsForWindow(marketId: string, asset: Asset, intervalSec: IntervalSec): [string, string] {
  const keyed = SERIES_SEATS[`${asset}-${intervalSec}`]
  if (keyed) return keyed

  const momentum = PERSONALITY_PRESETS.filter((p) => PERSONALITY_BIAS[p.label]?.class === 'momentum')
  const fade = PERSONALITY_PRESETS.filter((p) => PERSONALITY_BIAS[p.label]?.class === 'fade')
  const h = hashString(marketId)
  return [momentum[h % momentum.length].label, fade[(h >> 3) % fade.length].label]
}

export function heuristicSide(label: string, bestBid: number | null, bestAsk: number | null): Side {
  const mid = impliedUp(bestBid, bestAsk)
  const favourite: Side = mid >= 0.5 ? 'up' : 'down'
  const fade: Side = favourite === 'up' ? 'down' : 'up'
  const crowded = (bestAsk != null && bestAsk > 0.65) || (bestBid != null && bestBid < 0.35)

  switch (getPersonality(label).label) {
    case 'Taker':
    case 'Competitive':
    case 'Encouraging':
      return favourite
    case 'Patient':
    case 'Philosophical':
      return fade
    case 'Disciplined':
      return crowded ? fade : favourite
    default:
      return favourite
  }
}

export function sizeForPersonality(label: string, defaultSize: number): number {
  const bias = PERSONALITY_BIAS[label]
  const raw = defaultSize * (bias?.sizeMultiplier ?? 1)
  return Math.max(0.001, Math.round(raw * 1000) / 1000)
}
