# 48h win plan — Somnia × DreamDEX hackathon

Deadline extended ~48h. Goal: maximize
Innovation 20 / Technical 25 / UX 20 / Ecosystem 20 / Demo 15.

Tech is proven (live IOC fills + on-chain Desk, see CHANGELOG 2026-09-10).
This plan closes the UX / ecosystem / demo gaps without breaking `design.md`.

## P0 — before submitting (judge comprehension + trading activity)

- [ ] 1. Floor onboarding rail (`FollowFadeBar.tsx`, `Floor.tsx`)
      When `!isConnected` or no stake: `1 Faucet on Setup → 2 Tap a seat →
      3 Follow · winners claim on Desk` + brass `Start` → `/setup`.
- [ ] 2. Promote Desk (`ShellNav.tsx`, `design.md`, `SKILL.md`)
      Primary becomes Floor · Watch · Desk; More holds Setup · Roster ·
      How it works. No 5-item nav.
- [ ] 3. Watch as closer board (`watch/page.tsx`)
      Sort by seconds-left, show `left` countdown + `Up NN¢` from `impliedUp`,
      halt styling <30s. One tap picks the closing window.
- [ ] 4. Desk proof surface (`dashboard/page.tsx`, `useDesk.ts`)
      `Share fill` copy-button per ledger row (floor link + tx). Social
      spotlight + demo reproducibility.
- [ ] 5. Roster leaderboard (`roster/page.tsx`, `api/agents/roster`)
      Win-rate bars, pending counts, `Ride` button → sets allegiance +
      links Floor. Turns paper W/L into follow-the-best.
- [ ] 6. Demo-safe mode (`demo-data.ts`, `windows.ts`, `useFollowTrade`)
      `?demo=1` seeds a fake book so Follow clicks through to a simulated
      fill + Desk ledger entry. Always labelled DEMO.

## P1 — if time (delight + differentiation)

- [ ] 7. Bell moment (`WindowClock.tsx`, `dashboard/page.tsx`)
      Brass CHIME flash + auto Desk nudge on close. Sound already exists.
- [ ] 8. Tape persistence (`marketStore.ts`)
      Last fills per window in `localStorage` so tape survives reload.
- [ ] 9. Glossary → How it works (nav label only, route stays `/help`).
- [ ] 10. SDK feedback report (`docs/SDK_FEEDBACK.md`, 1 page: indexer lag,
      `getOutcomeBalance` gaps, faucet UX). Optional per brief, rare.

## Submission

- [ ] 11. Demo video script (2:30): clock → seat tap → Follow → fill toast →
      Desk chain seat → Watch closer → bell → Roster ride → faucet → roadmap.
- [ ] 12. Verify: `npm run lint`, `npx tsc --noEmit`, `npm run build`.
- [ ] 13. Submit: testnet prototype + repo + video (+ deck / SDK feedback).

## Log

- 2026-09-10: plan written. P0 1–6 then P1 7–10 in lock order.
- 2026-09-10: P0 shipped — onboarding rail (1), Desk promoted + How it
  works label (2), Watch closer board (3), Desk share-fill (4), Roster
  leaderboard + Ride (5), demo-safe simulated fills (6). P1 shipped — bell
  flash (7), tape persistence (8), nav label (9, inside 2), SDK feedback (10).
