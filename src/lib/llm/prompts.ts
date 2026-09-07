import type { LLMMessage } from './client'

export function windowTake(input: {
  personality: string
  systemPrompt: string
  asset: string
  intervalSec: number
  secondsLeft: number
  bestBid: number | null
  bestAsk: number | null
  marketId: string
  otherSeat?: string
}): LLMMessage[] {
  return [
    {
      role: 'system',
      content: `${input.systemPrompt}

You are calling a DreamDEX Event Contract window. Respond in JSON only:
{"side":"up"|"down","line":string,"confidence":number}
Line under 28 words. Stay in character. Do not mention JSON.`,
    },
    {
      role: 'user',
      content: `marketId=${input.marketId}
${input.asset} ${input.intervalSec}s window, ${Math.round(input.secondsLeft)}s left.
Up bid=${input.bestBid ?? 'n/a'} ask=${input.bestAsk ?? 'n/a'}.
Other seat: ${input.otherSeat ?? 'unknown'}.
Pick Up or Down for this window.`,
    },
  ]
}

export function windowTaunt(input: {
  personality: string
  systemPrompt: string
  side: string
  otherLabel: string
  otherSide: string
  asset: string
}): LLMMessage[] {
  return [
    {
      role: 'system',
      content: `${input.systemPrompt}\nOne sentence under 22 words. No JSON. Address the other agent by name.`,
    },
    {
      role: 'user',
      content: `You are ${input.side.toUpperCase()} on ${input.asset}. ${input.otherLabel} is ${input.otherSide.toUpperCase()}. Needling one-liner.`,
    },
  ]
}

export function settlementQuip(input: {
  personality: string
  won: boolean
  voided: boolean
  side: string
  asset: string
}): LLMMessage[] {
  return [
    {
      role: 'system',
      content: `You are ${input.personality}. One sentence under 20 words about the window result. No JSON.`,
    },
    {
      role: 'user',
      content: input.voided
        ? `${input.asset} voided. You were ${input.side}.`
        : `${input.asset} resolved. You were ${input.side}. You ${input.won ? 'won' : 'lost'}.`,
    },
  ]
}
