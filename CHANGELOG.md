# Changelog

Working log of shipped changes. Dates in YYYY-MM-DD.

## 2026-09-10 — Shared chorus: the crowd is real + opposed-sides money shot

- **`/api/chorus`** (`route.ts` + `lib/chorus/server.ts`) — shared tally per
  market in `.data/chime-chorus.json` (200 markets, 24h TTL). Every free
  chime POSTs server-side; rail + voices read `mergedChorus` (shared wins,
  local fallback, 8s poll). Verified live: up 2 / down 1 round-trips.
- **Opposed-sides prover** — YES leg 2 @ 0.503 (`e2c27906…`), NO leg 2 @
  0.566 (`efff5c35…`) on the ETH 24h window exp 2026-09-11T00:00Z
  (`0x…188ec`). Chain holds `YES=2000000 NO=2000000` — one side MUST win.
  Watcher polling to settlement, redeems the winner on the bell. The money
  shot for the demo video.
- **Demo clip script** (`scripts/demo-clip.mjs`, 7 steps) — the 30-second
  judge sequence with no wallet: chime → chorus vs book → countdown → bell
  → card → Post on X. Verified against the live chorus API.

## 2026-09-10 — Chime In: free voice before money (the signature)

The memorable mechanic: spectators register a public take with no wallet.
Voice before money — the verb the brand owns.

- **Chime Up / Down** (`FollowFadeBar.tsx`, ghost taps) — free, no wallet,
  disabled unless the window is Trading. One chime per side per window per
  browser (`chorusStore.ts`, `localStorage: chime:chimes`, 200 cap, 24h TTL).
- **Two-tone ping** (`chime-sound.ts` → `playChimeIn`, 523→784, ~0.5s) —
  distinct from the deep three-partial closing bell. Audio brand, zero pixels.
- **Chorus rail** (`ProbabilityRail.tsx`) — pewter 1px line under the book:
  `chorus N Up · M Down` + lean (`crowd leans Up / Down / split` at 60/40).
  Crowd-vs-book divergence is the tension.
- **Tape + voices** (`PitTape.tsx`, `useVoices.ts`) — `Chimed Up/Down` rows,
  window-scoped; voices count includes chimes.
- **Words** — hero is *Two seats. One window. Chime in.* Glossary gains
  Chime, Chorus, Unison · Octave · Carillon (streak ranks, words not points).
  `design.md` + chime-floor skill locked to the ritual.
- **Demo clip** — Chime Up → ping → tape → chorus vs book → bell → card →
  Post on X. Filmable with no wallet.

Validation: `npm run lint` clean, `npx tsc --noEmit` exit 0, `next build`
12/12.

## 2026-09-10 — Live loop proof on Shannon testnet

Proved all three loops against the live DreamDEX venue (`0x679795a0…`) with
`scripts/prove-loop.mjs` (key from `.env.local`, never logged).

- **Follow (live book, no seed)** — two IOC fills, both taken straight off the
  book (`seeded counterparty: false`):
  - `BUY_YES 5 @ 0.477` on the ETH 5m window exp 15:15Z. Fill receipt:
    `shannon-explorer.somnia.network` tx `e53aa249…871bca04`.
  - `BUY_YES 5 @ 0.429` on the ETH 5m window exp 15:25Z. Fill receipt:
    `shannon-explorer.somnia.network` tx `63d2dfab…11f68407`.
  - Both fills visible via `getOutcomeBalance` (`chain YES 5000000`) before the
    indexer caught up — the Desk's on-chain-first read (`loadChainSeat`) works
    as designed. Both fills later appeared in `getPortfolio` trades.
- **Claim (correct zero on losers)** — the 15:15Z window finalized Down
  (`winningOutcome 1`) while the ticket held YES; `redeemHeld` read both
  balances and skipped the zero winning-side balance. Same verdict on the
  15:25Z window: finalized Down (`win=1`), held `YES=5000000 NO=0`, winner's
  side empty — nothing to redeem. The older `…16d3a` NO ticket likewise lost
  (winner 0/Up). `claimScan` swept 21 markets, paid 0 — the right answer for
  three losing tickets. A winning redemption (payout tx) is still unproven;
  it needs a ticket on the winning side.
- **Stale-cache note** — `.data/chime-live.json` still held Sept-8 rows until a
  fresh `/api/markets/live` hit. `stillOpen()` filters expired rows on read
  and the file rewrites on refresh, so the Floor self-heals. Reload `/` after
  a cold start if the switcher looks dated.

Validation: `npm run lint` clean, `npx tsc --noEmit` exit 0.

## 2026-09-08 — Design compliance sweep

After a vision-vs-code review against `design.md` and the chime-floor skill, brought the floor back into compliance and tightened the runtime.

- **Toast rewritten** (`src/components/unified/UnifiedToast.tsx`). Removed `framer-motion`, gradient pills, `backdrop-blur-xl`, emoji-as-system, share/achievement variants. New toast is solid `--paper` with a 2px color-keyed left edge (brass/halt/slate/line), mono 12px, no animation. `message` now accepts `ReactNode` so callers can compose inline links.
- **`framer-motion` removed** from `package.json`. Three transitive packages dropped from the lockfile.
- **`PageHead` uses mono** instead of Newsreader for page titles on Watch, Setup, Desk, Roster. Newsreader is now wordmark-only, per the lock.
- **`Tap` tracking dropped** — buttons now use normal tracking, not `tracking-wide`.
- **Seat emoji rendered** on `AgentPit` and Roster rows. The `icon` field in `personality-presets.ts` was dormant data; now visible per the design's "icons may stay on seats" allowance.
- **Cache bounded** — `listDecisions` and `getDecision` now drop rows older than 24h on read (in addition to the 200-entry cap). Stale seat decisions no longer pile up across deploys.
- **"See Desk →" link** added to the fill toast. Inline brass 12px mono link to `/dashboard`; click dismisses the toast immediately. Renamed `useFollowTrade.ts` → `.tsx` to host the JSX.
- **`docs/implementation.md` created** — maps the three loops to actual files, lists API routes, stores, personalities, runtime cache, toast system.
- **`deployment/README.md`** updated to document `.data/chime-live.json` and `.data/chime-decisions.json`.
- **Orphan `--version/` directory removed** at the repo root (was a duplicate husky hook install).

Validation: `npx tsc --noEmit`, `npm run lint`, and `npm run build` all pass.

## Earlier — captured from git history

- `c894109` Close the Follow loop: fill on chain, show the seat on Desk, claim after the bell.
- `a2a60d0` Lock the pit as a skill and snap every page to the floor grid.
- `4577ab6` Give the floor a tape: implied-up spark, tappable seats, short prints.
- `ad96de5` Point production docs at usechime.netlify.app.
- `a3055a5` Strip leftover punctuality stack and load Desk from the chain.
- `b0a2162` Frame the CHIME floor and point the project at the new name.
- `9facc2e` Relaunch as CHIME on DreamDEX Event Contracts.
