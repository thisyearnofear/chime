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

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const API_KEY = process.env.ELEVENLABS_API_KEY
if (!API_KEY) {
  console.error('ELEVENLABS_API_KEY not set')
  process.exit(1)
}

const VOICE_ID = 'pNInz6obpgDQGcFmaJgB' // Adam (default male)
const BGM_STYLE = 'cinematic ambient'

// Voiceover script timed to scenes
const VOICEOVER = [
  { start: 0, duration: 3, text: 'Chime. The only prediction market where the close is a social moment.' },
  { start: 3, duration: 4, text: 'Two AI agents take opposite sides on a BTC or ETH window. The clock ticks. The book fills.' },
  { start: 7, duration: 4, text: 'Tap to chime free — no wallet needed. Your voice joins the chorus.' },
  { start: 11, duration: 3, text: 'Follow or fade with a stake. One tap, instant fill. Your side is locked in.' },
  { start: 14, duration: 5, text: 'The bell tolls. The cascade sweeps. The result locks.' },
  { start: 19, duration: 5, text: 'The Chime Card appears with the final result and voice count. Share it instantly.' },
  { start: 24, duration: 4, text: 'Share your agent\'s performance. The ride link drops friends directly into their seat.' },
  { start: 28, duration: 5, text: 'Chime. Two seats. One window. Visit chime.trustfall.xyz to build with DreamDEX.' },
]

async function fetchWithRetry(url, options, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res
    } catch (err) {
      if (i === retries - 1) throw err
      await new Promise(r => setTimeout(r, 1000 * (i + 1)))
    }
  }
}

async function generateVoiceover() {
  console.log('Generating voiceover...')
  
  // Combine all text into single request for consistency
  const fullText = VOICEOVER.map(v => v.text).join(' ')
  
  const res = await fetchWithRetry(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: fullText,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.7,
          style: 0.2,
        },
      }),
    }
  )
  
  const buffer = await res.arrayBuffer()
  const outDir = join(process.cwd(), 'public', 'audio')
  mkdirSync(outDir, { recursive: true })
  writeFileSync(join(outDir, 'voiceover.mp3'), Buffer.from(buffer))
  console.log(`Voiceover saved: ${buffer.byteLength / 1024}KB`)
}

async function generateBGM() {
  console.log('Note: ElevenLabs music generation endpoint not available.')
  console.log('Creating placeholder BGM (silent 45s) - add your own BGM later.')
  
  // Create a minimal silent MP3 as placeholder
  const outDir = join(process.cwd(), 'public', 'audio')
  mkdirSync(outDir, { recursive: true })
  
  // Use a tiny silent audio buffer
  const silentBuffer = createSilentAudio(45)
  writeFileSync(join(outDir, 'bgm.mp3'), Buffer.from(silentBuffer))
  console.log('Placeholder BGM saved (replace with real music)')
}

function createSilentAudio(durationSeconds) {
  // Minimal MP3 header for silent audio
  // This is a placeholder - replace with real BGM when available
  const mp3Header = Buffer.from([
    0xFF, 0xFB, 0x90, 0x00, // MP3 frame header
    ...new Array(1152).fill(0) // Silent frames
  ])
  // Repeat to fill duration (approx 1152 samples/frame, 44100 Hz)
  const frames = Math.ceil(durationSeconds * 44100 / 1152)
  const parts = [mp3Header]
  for (let i = 1; i < frames; i++) {
    parts.push(Buffer.from([0xFF, 0xFB, 0x90, 0x00, ...new Array(1152).fill(0)]))
  }
  return Buffer.concat(parts)
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
