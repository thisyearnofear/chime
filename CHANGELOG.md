# Changelog

Working log of shipped changes. Dates in YYYY-MM-DD.

## 2026-09-11 — Review fixes: sticky, dots, countdown, deep-links, ledger

Follow-up to the UX clarity pass — every P0 from the review:

- **Sticky bar actually sticks** (`Floor.tsx`, `globals.css`) —
  `.chime-sticky-bar` moved to the outer mobile wrapper whose parent is the
  tall WINDOW column. Inner-div sticky could never engage.
- **Claim dot can light** (`useDesk.ts`) — successful `redeemWinnings`
  pushes a `claim` TimelineEvent (tx hash + window marketId). Ritual stake
  scoped to the current window like `userSide` (no more forever-brass from
  an old follow).
- **Next-open countdown fixed** (`ChimeLanding.tsx`) — windows are contiguous
  buckets, so the hook counts to `expiry`, not `expiry + interval`. Was one
  full interval (e.g. 15:00) too late on every close.
- **TensionShare hidden on demo** (`Floor.tsx`) — demo tweets no longer share
  a live-window URL into the wrong funnel.
- **`?chime=abc` no longer shows a 50¢ banner** (`Floor.tsx`) — non-numeric
  values treated as absent via `Number.isFinite`.
- **Voices CTA scrolls to the visible bar** (`Floor.tsx`, `FollowFadeBar.tsx`)
  — mobile/desktop instances get distinct ids (`follow-fade-mobile` /
  `-desktop`); the tap handler picks by `innerWidth`. Desktop CTA worked on
  a hidden node before.
- **Ledger polish** (`dashboard/page.tsx`) — meta drops `· 0 claimable`;
  `N fill` singular; `no fills yet` / `N open` meta voice matches POSITIONS;
  rows get `aria-label` toggles, tx row is a `div`, `net` passed as prop;
  latest-tx row opens by default (uncontrolled after mount, re-mounts on
  re-sort via stable keys).
- **Glossary aligned** (`help/page.tsx`, `chorusStore.ts`) — Unison / Octave /
  Carillon defined as participation (windows voiced), matching the streak
  display. One definition everywhere.

Validation: `npm run lint` clean, `npx tsc --noEmit` exit 0, `next build` 13/13.

## 2026-09-11 — UX clarity pass: ladder, gate, sticky bar, ledger, ritual

P0 comprehension — Floor WINDOW reads observe → chime → stake:

- **Price + time one-liner** (`Floor.tsx`) — `↑NN¢ · M:SS left` under the
  clock, halt-red in the final 30s; locked state lives in the line, empty
  book points at Watch, loading says `Connecting…` in the same slot.
- **Ladder order** — hero → voices → book context behind a rule →
  TensionShare after the book → demo note. Floating explainer + duplicate
  locked/connecting lines removed.
- **One countdown language** — TensionShare tweet + aria use
  `CADENCE · M:SS left · ↑NN¢`, matching Floor + Watch.
- **Zero-state voices CTA** — `Be the first voice — chime in free` at 0
  voices instead of silence.

P1 action clarity:

- **Follow/Fade gated on a seat tap** (`FollowFadeBar.tsx`) — no allegiance
  shows `Tap a seat to ride — 01/02 above` + why; buttons stay disabled.
- **Sticky mobile action bar** (`globals.css` `.chime-sticky-bar`) — mobile
  Follow/Fade pins to the bottom with safe-area padding + top rule.
- **Desk summary-first ledger** (`dashboard/page.tsx`) — meta reads
  `N fills · M claimable`; rows collapse to title + detail with tx + `↗ share`
  behind a `+`/`–` tap (first row open).

P2 delight (CSS only, no new deps):

- **Numeral cross-fade** (`.chime-numeral`, 150ms) + **press feedback**
  (`Tap` `active:scale-[0.98]`) + **rise-in** (`.chime-rise`, 200ms) for
  TensionShare / ChimeCard / zero-state CTA. All `prefers-reduced-motion` safe.
- **Ritual dots** (`ChimeLanding.tsx` → `RitualDots`, wired in `Floor.tsx`) —
  `observe · chime · stake · claim`, brass = done, under the hero.
- **Streak rank at the chime control** (`FollowFadeBar.tsx` + `chorusRank`) —
  distinct windows chimed shown as Unison / Octave / Carillon. Words, not points.
- **Post-close hook for every close** (`ChimeLanding` compact) — next-open
  countdown or live redirect under the price, not just `?chime=` arrivals.

Validation: `npm run lint` clean, `npx tsc --noEmit` exit 0, `next build` 12/12.

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

## 2026-09-10 — WIN_PLAN P2–P4: close ceremony, viral loops, differentiation

P2 Chime-In Effect (`6d25dbf`, `02b033a`) — the close is a social moment:

- **Close cascade** (`WindowClock.tsx`, `onChime`) — ring sweeps to final
  `↑NN¢` for 2s, settles to CHIME. `prefers-reduced-motion` skips the sweep.
- **ChimeCard** (`ChimeCard.tsx`, `useVoices.ts`) — SVG snapshot 2.2s after
  the bell: final-probability arc, voices count, user outcome. `Post on X`
  opens a twitter intent + copies the link as fallback.
- **`?chime=NN` deep-link** (`ChimeCard.tsx` → `Floor.tsx` →
  `ChimeLanding.tsx`) — tweet URL encodes the final probability and lands on
  the exact closed window; the landing banner shows the result + countdown to
  the next open instead of a tombstone.

P3 viral loops (`cb72f2e`):

- **TensionShare** (`TensionShare.tsx`) — last 60s of a live window
  (`status === 1`, book present, 15s < left ≤ 60s): `↗ share the tension`
  opens a pre-filled tweet with live probability + countdown. Drama > receipts.
- **Voices CTA** (`Floor.tsx`, `useVoices.ts`) — 3+ voices renders a tappable
  `N traders chimed in — join them` that smooth-scrolls to `#follow-fade`.
- **Roster share + `?ride=`** (`roster/page.tsx` → `Floor.tsx`) — `↗ share`
  per agent row tweets win rate + `/?ride=Label` URL; Floor pre-selects that
  allegiance on arrival (priority over `localStorage`, aliases resolved via
  `getPersonality`).

P4 differentiation (`687f024`):

- **Dynamic seat lines** (`personality-presets.ts` → `dynamicLine()`,
  `AgentPit.tsx`) — 6 personalities × 6 state bands (closing ≤30s,
  last-minute ≤60s, heavy favoured/against, neutral, default). Pit copy
  updates every tick as the window moves.
- **WindowStory** (`WindowStory.tsx`) — `opened 45¢ · high 71¢ · now 63¢`
  above the sparkline; hidden until 2+ mids exist and spread ≥ 3¢. Tweet
  inbound visitors get context without reading the chart.
- **Submission sentence locked** (`docs/WIN_PLAN.md` item 13): "Chime is the
  only prediction market where the close is a social moment." + copy-paste
  submission note covering cascade, card, tension share, `?ride=`, and
  `docs/SDK_FEEDBACK.md`.

Validation: `npm run lint` clean, `npx tsc --noEmit` exit 0, `next build`
12/12 each commit.

## 2026-09-10 — WIN_PLAN P0 + P1: judge-ready floor, closer board, demo mode

`b0203a9` — UX / ecosystem / demo gaps without breaking `design.md`:

- **Floor onboarding rail** (`FollowFadeBar.tsx`, `Floor.tsx`) —
  `1 Faucet on Setup → 2 Tap a seat → 3 Follow · winners claim on Desk` +
  brass `Start` → `/setup` when `!isConnected` or no stake.
- **Desk promoted** (`ShellNav.tsx`, `design.md`, `SKILL.md`) — primary is
  Floor · Watch · Desk; More holds Setup · Roster · How it works.
- **Watch closer board** (`watch/page.tsx`) — sorted by expiry, `left`
  countdown + `Up NN¢` from `impliedUp`, halt styling <30s. One tap picks the
  closing window.
- **Desk proof surface** (`dashboard/page.tsx`, `useDesk.ts`) — `Share fill`
  copy-button per ledger row (floor link + tx).
- **Roster leaderboard** (`roster/page.tsx`, `api/agents/roster`) — win-rate
  bars, pending counts, `Ride` sets allegiance + links Floor.
- **Demo-safe mode** (`demo-data.ts`, `windows.ts`, `useFollowTrade`) —
  `?demo=1` seeds a fake book; Follow simulates a fill + Desk ledger entry,
  always labelled DEMO.
- **Bell flash + tape persistence** (`WindowClock.tsx` `chime-flash`,
  `marketStore.ts` `chime:tape`) — brass flash on close; last fills per window
  survive reload.
- **SDK feedback** (`docs/SDK_FEEDBACK.md`) — 1 page: indexer lag,
  fill-by-tx gaps, silent empty books, faucet discoverability, status-int
  mapping, venue-rotation docs. Attached as the optional bonus per the brief.

Validation: `npm run lint` clean, `npx tsc --noEmit` exit 0, `npm run build`
clean.

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
