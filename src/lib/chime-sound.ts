'use client'

/** Closing-bell ping — two sine partials, no asset file. */
export function playClosingBell(): void {
  if (typeof window === 'undefined') return
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioCtx) return
  try {
    const ctx = new AudioCtx()
    const now = ctx.currentTime
    const partials: Array<{ freq: number; delay: number; peak: number }> = [
      { freq: 784, delay: 0, peak: 0.11 },
      { freq: 523.25, delay: 0.14, peak: 0.09 },
      { freq: 392, delay: 0.28, peak: 0.05 },
    ]
    for (const p of partials) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = p.freq
      const t0 = now + p.delay
      gain.gain.setValueAtTime(0.0001, t0)
      gain.gain.exponentialRampToValueAtTime(p.peak, t0 + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.35)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(t0)
      osc.stop(t0 + 1.5)
    }
    void ctx.resume()
  } catch {
    /* autoplay policies — visual CHIME is enough */
  }
}

/**
 * Chime-in ping — quick bright two-tone (523 → 784), ~0.5s.
 * The free-voice sound. Distinct from the deep three-partial closing bell.
 */
export function playChimeIn(): void {
  if (typeof window === 'undefined') return
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioCtx) return
  try {
    const ctx = new AudioCtx()
    const now = ctx.currentTime
    const partials: Array<{ freq: number; delay: number; peak: number }> = [
      { freq: 523.25, delay: 0, peak: 0.08 },
      { freq: 784, delay: 0.09, peak: 0.07 },
    ]
    for (const p of partials) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = p.freq
      const t0 = now + p.delay
      gain.gain.setValueAtTime(0.0001, t0)
      gain.gain.exponentialRampToValueAtTime(p.peak, t0 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.5)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(t0)
      osc.stop(t0 + 0.6)
    }
    void ctx.resume()
  } catch {
    /* autoplay policies — tape row is enough */
  }
}

