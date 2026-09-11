#!/usr/bin/env node
/**
 * Generate CHIME demo voiceover + BGM using ElevenLabs API.
 *
 * Usage:
 *   ELEVENLABS_API_KEY=sk_xxx node scripts/generate-audio.mjs
 *
 * Outputs:
 *   - public/audio/voiceover.mp3
 *   - public/audio/bgm.mp3
 */

import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const API_KEY = process.env.ELEVENLABS_API_KEY
if (!API_KEY) {
  console.error('ELEVENLABS_API_KEY not set')
  process.exit(1)
}

const VOICE_ID = 'pNInz6obpgDQGcFmaJgB' // Adam

// Voiceover script — ~280 chars, ~50 words, fits ~33s at natural pace
const VOICEOVER_FULL =
  'Chime — the only prediction market where the close is social. ' +
  'Two AI agents take opposite sides on a BTC window. Tap to chime free. ' +
  'Follow or fade with a stake. One tap, instant fill. ' +
  'The bell tolls, the cascade sweeps, the result locks. ' +
  'Share the card. Drop friends into their seat. ' +
  'Two seats, one window. Visit chime.trustfall.xyz.'

async function fetchWithRetry(url, options, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options)
      if (!res.ok) {
        const body = await res.text().catch(() => '')
        throw new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`)
      }
      return res
    } catch (err) {
      if (i === retries - 1) throw err
      await new Promise(r => setTimeout(r, 1000 * (i + 1)))
    }
  }
}

async function generateVoiceover() {
  console.log('Generating voiceover...')

  const res = await fetchWithRetry(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: VOICEOVER_FULL,
        model_id: 'eleven_multilingual_v2',
        speed: 1.4,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.7,
          style: 0.15,
        },
      }),
    }
  )

  const buffer = await res.arrayBuffer()
  const outDir = join(process.cwd(), 'public', 'audio')
  mkdirSync(outDir, { recursive: true })
  writeFileSync(join(outDir, 'voiceover.mp3'), Buffer.from(buffer))
  console.log(`Voiceover saved: ${(buffer.byteLength / 1024).toFixed(1)}KB`)
}

async function generateBGM() {
  console.log('Generating background music via ElevenLabs Music API...')

  const res = await fetchWithRetry(
    'https://api.elevenlabs.io/v1/music/generate',
    {
      method: 'POST',
      headers: {
        'xi-api-key': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt:
          'Cinematic ambient track with subtle tension building. ' +
          'Fintech demo atmosphere. No vocals. Instrumental only.',
        music_length_ms: 33000,
        force_instrumental: true,      }),
    }
  )

  const buffer = await res.arrayBuffer()
  const outDir = join(process.cwd(), 'public', 'audio')
  mkdirSync(outDir, { recursive: true })
  writeFileSync(join(outDir, 'bgm.mp3'), Buffer.from(buffer))
  console.log(`BGM saved: ${(buffer.byteLength / 1024).toFixed(1)}KB`)
}

async function main() {
  await generateVoiceover()
  await generateBGM()
  console.log('Audio generation complete!')
}

main().catch(err => {
  console.error('Failed:', err.message)
  process.exit(1)
})
