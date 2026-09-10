# CHIME — Implementation Map

How the three loops land in code. Read alongside [`design.md`](../design.md) and [`.cursor/skills/chime-floor/SKILL.md`](../.cursor/skills/chime-floor/SKILL.md).

## Stack

Next.js 16 (App Router) · Tailwind 4 · viem 2 · `@somnia-chain/markets-sdk` 0.29 · Zustand 5. No CSS-in-JS, no framer-motion, no UI kit.

## Loop 1 — Spectate

Goal: a spectator with no wallet sees the live window, the two seats, and the implied-up spark.

| Surface | File |
| --- | --- |
| `/` page | `src/app/page.tsx` |
| Two-frame Floor | `src/components/floor/Floor.tsx` |
| Clock (instrument) | `src/components/floor/WindowClock.tsx` |
| Implied-up ring + cents | `src/components/floor/ProbabilityRail.tsx` |
| Sparkline (~40 mids) | `src/components/floor/ImpliedSpark.tsx` |
| Live-window switcher | `src/components/floor/SeriesSwitcher.tsx` |
| Seat rows (01 / 02) | `src/components/floor/AgentPit.tsx` |
| Pit tape (≤6) | `src/components/floor/PitTape.tsx` |
| One quote line | `src/components/floor/DebateTicker.tsx` |
| Frame + corner ticks | `src/components/ui/Frame.tsx` |
| Book + status fetch | `src/hooks/useLiveWindow.ts` → `src/lib/markets/windows.ts` |
| Seat copy (LLM or heuristic) | `src/hooks/useWindowAgents.ts` → `src/lib/agents/decide.ts` |

The live catalog comes from `/api/markets/live`, which queries the DreamDEX GraphQL indexer and writes a short-lived cache to `.data/chime-live.json`. If the indexer is down, the cached rows are served for up to 30 seconds.

## Loop 2 — Follow / Fade

Goal: with one tap, take the followed seat's side or fade it. The order is an IOC.

| Surface | File |
| --- | --- |
| Allegiance picker (one row tap) | `src/components/floor/AgentPit.tsx` |
| Follow/Fade control | `src/components/floor/FollowFadeBar.tsx` |
| Trade executor | `src/hooks/useFollowTrade.tsx` |
| IOC placement | `src/lib/markets/trade.ts` → `placeFollowOrder` |
| Wallet binding | `src/hooks/useExchange.ts` |
| Wallet connect / network switch | `src/hooks/useWallet.ts` |
| Per-personality size | `src/lib/agents/mapping.ts` |
| Local ticket ledger | `src/stores/positionStore.ts` |
| Fill toast (with Desk link) | `src/components/unified/UnifiedToast.tsx` |

The trade fetches the market, confirms `status === 1` (Trading), confirms ≥15s to expiry, then places a `limit` `buy` IOC at `bestAsk + 0.02` (Up) or `1 − bestBid + 0.02` (Down), snapped to venue precision. A fill pushes a `TimelineEvent` into `usePositionStore`, persists it under `chime:events:<address>`, and fires a success toast with an inline brass `See Desk →` link to `/dashboard` (link click dismisses the toast).

## Loop 3 — Claim

Goal: when a window finalizes, redeem held outcome shares on chain.

| Surface | File |
| --- | --- |
| Claim button + positions + ledger | `src/app/dashboard/page.tsx` |
| Loader | `src/hooks/useDesk.ts` |
| On-chain + indexer merge | `src/lib/markets/desk.ts` |
| Redeemer | `src/lib/markets/trade.ts` → `redeemWinnings` |

`loadDesk` first reads the active window's seat balances directly via `client.getOutcomeBalance` and then asks the indexer for the full portfolio; the union is the position set. `redeemWinnings` walks every claimable position in the portfolio, redeems each outcome token, and returns the tx hashes for the ledger.

Proved live on 2026-09-10 (see `CHANGELOG.md`): two `BUY_YES` IOC fills took
the live book with no seeding (ETH 5m 15:15Z and 15:25Z); both were
chain-visible before the indexer caught up. The 15:15Z window finalized Down
against a YES ticket, so `redeemHeld` correctly paid 0. A winning payout tx
is still unproven.

## Loop 0 — Chime in (free voice, the signature)

Goal: a spectator with no wallet registers a public take in one tap. Voice
before money — the verb the brand owns.

| Surface | File |
| --- | --- |
| Chime Up / Down (ghost taps) | `src/components/floor/FollowFadeBar.tsx` |
| Two-tone ping (523→784, ~0.5s) | `src/lib/chime-sound.ts` → `playChimeIn` (bell stays the deep 3-partial `playClosingBell`) |
| Chorus state (one per side per window, 200 cap, 24h TTL) | `src/stores/chorusStore.ts` (`localStorage: chime:chimes`), `chorusFor()`, `chorusRank()` (Unison/Octave/Carillon) |
| Chorus rail (pewter N Up · M Down + lean) | `src/components/floor/ProbabilityRail.tsx` |
| Chimed rows on tape | `src/components/floor/PitTape.tsx` (`kind: 'chime'`) |
| Voices count includes chimes | `src/hooks/useVoices.ts` |
| Glossary (Chime, Chorus, ranks) | `src/app/help/page.tsx` |

Hero copy is *Two seats. One window. Chime in.* Crowd-vs-book divergence
(chorus 80% Up vs book 52¢) is the tension no order-book clone has.

## Stores

- `useMarketStore` — series, current `LiveWindow`, catalog, last 40 mids (`withBookSample`), tape prints.
- `useAgentStore` — current `WindowDecision`, allegiance (`localStorage: chime:allegiance`), default size (`localStorage: chime:size`).
- `usePositionStore` — `TimelineEvent[]` per wallet (`localStorage: chime:events:<address>`), last tx hash, pending flag.
- `useChorusStore` — free-voice `ChimeEntry[]` (`localStorage: chime:chimes`), one per side per window, 24h TTL.

## API routes

| Route | Job |
| --- | --- |
| `GET  /api/markets/live` | Catalog of live BTC/ETH windows for the active venue. |
| `GET  /api/agents/window?marketId=…` | Cached seat decision (LLaMA-free fast path). |
| `POST /api/agents/window` | Generate (or replay) a seat decision. |
| `GET  /api/agents/roster` | Wins/losses/pushes per personality from cached decisions × indexer resolutions. |

## Personality presets

Six voices in `src/lib/personality-presets.ts`: Disciplined, Encouraging, Competitive, Philosophical, Taker, Patient. Each carries a `value` system prompt and a seat emoji (⚡ 🌟 🔥 🧠 🏎️ 🧘) rendered in `AgentPit` and on Roster. `getPersonality` accepts legacy aliases (`Aggressive Commuter` → `Taker`, `Zen Walker` → `Patient`).

The seat pair is picked deterministically by `seatsForWindow`; the system forces a fade when both seats land on the same side.

## Runtime cache

Both caches live under `./.data/` and are git-ignored:

- `chime-live.json` — last successful indexer response (30s in-memory TTL).
- `chime-decisions.json` — seat decisions, max 200 entries, 24h TTL on read.

See [`deployment/README.md`](../deployment/README.md) for env vars and Netlify build settings.

## Toast system

`UnifiedToast` is a single mono chrome surface in the top-right of the shell. Solid `--paper` background, `--line` border with a 2px color-keyed left edge (brass for success, halt for error, slate for warning, line for info). The `message` field accepts `ReactNode` so callers can inline links — currently only `useFollowTrade` does, with a brass `See Desk →` link that dismisses the toast on click. Auto-dismiss is 4s for info/success, 6s for error, overridable per call.

## Adding a new floor surface

1. Read `design.md`. Touch **one or two** variables per pass (skill pass rule).
2. Build with `Frame` for the bordered panel and brass L-ticks.
3. Use `Page` so the left edge snaps to Floor.
4. Stay on `--paper` / `--ink` / `--mute` / `--line` / `--brass` / `--slate` / `--halt`. No new accent.
5. Run `npm run lint` and `npm run build` before opening a PR.
