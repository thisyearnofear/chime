import type { Side } from '@/types/markets'

export interface PersonalityPreset {
  label: string
  icon: string
  tagline: string
  value: string
}

export const PERSONALITY_PRESETS: PersonalityPreset[] = [
  {
    label: 'Disciplined',
    icon: '⚡',
    tagline: 'Fade the crowd. Rules over gut.',
    value: 'Strict short-window trader. Fade crowded books when Up ask is above 0.65 or bid below 0.35. Otherwise slight last-print continuation. Short sentences, no hype, no emoji spam. Name the rule you followed.',
  },
  {
    label: 'Encouraging',
    icon: '🌟',
    tagline: 'Soft momentum. Celebrate the tap.',
    value: 'Supportive coach. Prefer mild momentum — do not max-fade. Celebrate the user for taking a side. Warm, brief, never cruel when the window goes against you.',
  },
  {
    label: 'Competitive',
    icon: '🔥',
    tagline: 'Hunt the other seat.',
    value: 'Highly competitive. Name the other agent and take the fight. Prefer the short-term favourite on 15m windows. Trash talk is allowed. Winning the window is the only metric.',
  },
  {
    label: 'Philosophical',
    icon: '🧠',
    tagline: 'Mean-revert. Time is the edge.',
    value: 'Stoic mean-reverter. Fade 0.70+ favourites and buy 0.30− dogs. One-liners, time metaphors, no urgency. The window is a clock, not a casino.',
  },
  {
    label: 'Taker',
    icon: '🏎️',
    tagline: 'Take the favourite. Cross the spread.',
    value: 'Aggressive taker. Always take the favourite and cross the spread. Never sit out. Urgent, clipped, speed-first. Short windows are home.',
  },
  {
    label: 'Patient',
    icon: '🧘',
    tagline: 'Fade the favourite. Tiny size.',
    value: 'Unhurried fade. Fade the favourite with conviction but never shout. The window is long enough. Slow voice, no FOMO, no chase.',
  },
]

const ALIASES: Record<string, string> = {
  'Aggressive Commuter': 'Taker',
  'Zen Walker': 'Patient',
}

export function getPersonality(label: string): PersonalityPreset {
  const resolved = ALIASES[label] ?? label
  return PERSONALITY_PRESETS.find((p) => p.label === resolved) ?? PERSONALITY_PRESETS[0]
}

/**
 * Returns a context-aware one-liner for a seat based on live market state.
 * Called each render tick so the pit feels alive as the window moves.
 *
 * Bands:
 *   upPct >= 70  — market heavily favours Up
 *   upPct >= 55  — mild Up lean
 *   upPct >= 45  — near-neutral / toss-up
 *   upPct < 45   — mild Down lean / Down favourite
 *   secondsLeft <= 30 — final seconds
 *   secondsLeft <= 60 — last minute
 */
export function dynamicLine(
  label: string,
  side: Side,
  upPct: number,
  secondsLeft: number
): string {
  const favoured = side === 'up' ? upPct >= 55 : upPct < 45
  const heavy = side === 'up' ? upPct >= 70 : upPct <= 30
  const neutral = upPct >= 45 && upPct <= 55
  const closing = secondsLeft <= 30
  const lastMinute = secondsLeft <= 60 && secondsLeft > 30

  const lines: Record<string, () => string> = {
    Disciplined: () => {
      if (closing) return `${upPct}¢ at the bell. Rule says hold.`
      if (heavy && !favoured) return `${upPct}¢ is crowded. Fading by the book.`
      if (heavy && favoured) return `Market agrees at ${upPct}¢. Book confirmation.`
      if (neutral) return `${upPct}¢ — coin-flip territory. Rules say wait.`
      if (lastMinute) return `One minute. Spread confirms the bias.`
      return `${upPct}¢. Following the rule, not the feeling.`
    },
    Encouraging: () => {
      if (closing) return `Last few seconds. You picked a side — that's what matters.`
      if (heavy && favoured) return `${upPct}¢ and moving your way. Good call.`
      if (heavy && !favoured) return `${upPct}¢ against you. Fades win sometimes — stay in it.`
      if (neutral) return `Too close to call at ${upPct}¢. Either seat is brave.`
      if (lastMinute) return `Final minute. Whatever happens, you chimed in.`
      return `${upPct}¢ implied. You're in the game.`
    },
    Competitive: () => {
      if (closing) return `Clock's out. Other seat had their chance.`
      if (heavy && favoured) return `${upPct}¢. Market's on my side. Other seat is cooked.`
      if (heavy && !favoured) return `${upPct}¢ against me. I've flipped worse.`
      if (neutral) return `${upPct}¢ — dead even. I'll take that fight all day.`
      if (lastMinute) return `Sixty seconds. Other seat blinked first.`
      return `${upPct}¢. I'll take it.`
    },
    Philosophical: () => {
      if (closing) return `The clock was always the point.`
      if (heavy && !favoured) return `${upPct}¢ favourite. History says revert. I'm patient.`
      if (heavy && favoured) return `${upPct}¢. The crowd and I agree — briefly.`
      if (neutral) return `${upPct}¢ — the market is honest at toss-up.`
      if (lastMinute) return `A minute is long enough for a mean.`
      return `${upPct}¢. Every window reverts eventually.`
    },
    Taker: () => {
      if (closing) return `${upPct}¢. I crossed the spread. Done.`
      if (heavy && favoured) return `${upPct}¢ favourite. Took it. Already in.`
      if (heavy && !favoured) return `${upPct}¢. Long shot. I still took it.`
      if (neutral) return `${upPct}¢ — no favourite. I'll cross anyway.`
      if (lastMinute) return `Sixty seconds. Spread is thin. Take it.`
      return `${upPct}¢. Cross the spread, collect the edge.`
    },
    Patient: () => {
      if (closing) return `Final seconds. Size was right, timing was right.`
      if (heavy && !favoured) return `${upPct}¢ favourite. My kind of fade — tiny size, full conviction.`
      if (heavy && favoured) return `${upPct}¢. Momentum, not panic. Holding.`
      if (neutral) return `${upPct}¢ — no edge worth chasing here.`
      if (lastMinute) return `Last minute. I've been waiting for this.`
      return `${upPct}¢. The window is long enough.`
    },
  }

  const fn = lines[label]
  if (!fn) return `${upPct}¢ implied.`
  return fn()
}
