# Changelog

Working log of shipped changes. Dates in YYYY-MM-DD.

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
