#!/usr/bin/env node
// DEMO CLIP — the 30-second judge sequence, fully scripted, no wallet.
// Chime Up (ping) → tape → chorus vs book → bell → ChimeCard → Post on X.
// Run: node scripts/demo-clip.mjs [--live <port>]
const PORT = Number(process.argv[process.argv.indexOf('--live') + 1]) || 3101
const BASE = `http://localhost:${PORT}`

console.log('=== CHIME 30-SECOND DEMO CLIP ===')
console.log('No wallet. No faucet. This is the judge sequence.\n')

const step = (n, title, detail) => {
  console.log(`[${n}/7] ${title}`)
  if (detail) console.log(`      ${detail}`)
}

step(1, 'CHIME UP — free voice', 'tap Chime Up → two-tone ping (523→784) → tape prints "Chimed Up"')
const c1 = await fetch(`${BASE}/api/chorus`, {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ marketId: 'demo-clip-window', side: 'up' }),
}).then((r) => r.json())
console.log(`      chorus now: ${c1.up} Up · ${c1.down} Down`)

step(2, 'CHORUS vs BOOK — the tension', `crowd says ${c1.up} Up vs book 52¢ — who is right?`)
const c2 = await fetch(`${BASE}/api/chorus`, {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ marketId: 'demo-clip-window', side: 'up' }),
}).then((r) => r.json())
console.log(`      second voice: ${c2.up} Up · ${c2.down} Down — crowd leans Up`)

step(3, 'CHIME DOWN — the fade', 'tap Chime Down → ping → chorus splits')
const c3 = await fetch(`${BASE}/api/chorus`, {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ marketId: 'demo-clip-window', side: 'down' }),
}).then((r) => r.json())
console.log(`      chorus now: ${c3.up} Up · ${c3.down} Down — crowd split`)

step(4, 'COUNTDOWN — the clock', 'WindowClock ticks 0:42 → halt-red last 30s → CHIME flash')
step(5, 'BELL — the ceremony', 'deep three-partial toll (784→523→392) — never the chime sound')
step(6, 'CARD — the artifact', `BTC 15m closed at ↑67¢ · ${c3.up + c3.down} voices chimed in · #ChimeIn`)
step(7, 'POST ON X — the loop', 'tweet intent opens pre-filled → ?chime=67 deep-link → next window')

const final = await fetch(`${BASE}/api/chorus?marketId=demo-clip-window`).then((r) => r.json())
console.log(`\nFINAL chorus for demo-clip-window: ${final.up} Up · ${final.down} Down`)
console.log('\nCLIP COMPLETE — film this on the Floor with sound on.')
process.exit(0)
