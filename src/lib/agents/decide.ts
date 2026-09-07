import { getPersonality } from '@/lib/personality-presets'
import { heuristicSide, seatsForWindow } from '@/lib/agents/mapping'
import { windowTake } from '@/lib/llm/prompts'
import type { AgentSeat, Asset, IntervalSec, Side, WindowDecision } from '@/types/markets'

export interface DecideInput {
  marketId: string
  asset: Asset
  intervalSec: IntervalSec
  expiry: number
  secondsLeft: number
  bestBid: number | null
  bestAsk: number | null
}

function parseTake(raw: string): { side: Side; line: string; confidence: number } | null {
  const trimmed = raw.trim()
  const jsonStart = trimmed.indexOf('{')
  const jsonEnd = trimmed.lastIndexOf('}')
  if (jsonStart >= 0 && jsonEnd > jsonStart) {
    try {
      const parsed = JSON.parse(trimmed.slice(jsonStart, jsonEnd + 1)) as {
        side?: string
        line?: string
        confidence?: number
      }
      const side = parsed.side?.toLowerCase() === 'down' ? 'down' : parsed.side?.toLowerCase() === 'up' ? 'up' : null
      if (!side) return null
      return {
        side,
        line: String(parsed.line ?? '').slice(0, 180),
        confidence: Number(parsed.confidence) || 0.5,
      }
    } catch {
      /* fall through */
    }
  }
  const lower = trimmed.toLowerCase()
  if (lower.includes('"down"') || /\bdown\b/.test(lower)) {
    return { side: 'down', line: trimmed.slice(0, 180), confidence: 0.5 }
  }
  if (lower.includes('"up"') || /\bup\b/.test(lower)) {
    return { side: 'up', line: trimmed.slice(0, 180), confidence: 0.5 }
  }
  return null
}

async function llmTake(
  label: string,
  input: DecideInput,
  otherSeat: string
): Promise<{ side: Side; line: string; confidence: number } | null> {
  const preset = getPersonality(label)
  const apiKeys: Record<string, string> = {}
  if (process.env.VENICE_API_KEY) apiKeys.venice = process.env.VENICE_API_KEY
  if (process.env.FEATHERLESS_API_KEY) apiKeys.featherless = process.env.FEATHERLESS_API_KEY
  if (Object.keys(apiKeys).length === 0) return null

  try {
    const { chatWithFallback } = await import('@/lib/llm/client')
    const messages = windowTake({
      personality: label,
      systemPrompt: preset.value,
      asset: input.asset,
      intervalSec: input.intervalSec,
      secondsLeft: input.secondsLeft,
      bestBid: input.bestBid,
      bestAsk: input.bestAsk,
      marketId: input.marketId,
      otherSeat,
    })
    const response = await chatWithFallback(messages, apiKeys)
    return parseTake(response.content)
  } catch (error) {
    console.warn('window take LLM failed', error)
    return null
  }
}

function heuristicLine(label: string, side: Side): string {
  const preset = getPersonality(label)
  return `${side === 'up' ? 'Up' : 'Down'}. ${preset.tagline}`
}

export async function decideWindow(input: DecideInput): Promise<WindowDecision> {
  const [labelA, labelB] = seatsForWindow(input.marketId, input.asset, input.intervalSec)

  const [llmA, llmB] = await Promise.all([
    llmTake(labelA, input, labelB),
    llmTake(labelB, input, labelA),
  ])

  let sideA = llmA?.side ?? heuristicSide(labelA, input.bestBid, input.bestAsk)
  let sideB = llmB?.side ?? heuristicSide(labelB, input.bestBid, input.bestAsk)
  let forcedB = false

  if (sideA === sideB) {
    sideB = sideA === 'up' ? 'down' : 'up'
    forcedB = true
  }

  const seat = (label: string, side: Side, line: string, confidence: number, forced: boolean): AgentSeat => {
    const preset = getPersonality(label)
    return {
      label: preset.label,
      icon: preset.icon,
      tagline: preset.tagline,
      side,
      line,
      confidence,
      forced,
    }
  }

  return {
    marketId: input.marketId,
    expiry: input.expiry,
    generatedAt: Date.now(),
    seats: [
      seat(labelA, sideA, llmA?.line || heuristicLine(labelA, sideA), llmA?.confidence ?? 0.55, false),
      seat(
        labelB,
        sideB,
        forcedB
          ? `Forced fade — both wanted ${sideA}. I take ${sideB}.`
          : llmB?.line || heuristicLine(labelB, sideB),
        llmB?.confidence ?? 0.55,
        forcedB
      ),
    ],
  }
}
