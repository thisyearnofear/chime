# 48h win plan — Somnia × DreamDEX hackathon

Deadline extended ~48h. Goal: maximize
Innovation 20 / Technical 25 / UX 20 / Ecosystem 20 / Demo 15.

Tech is proven (live IOC fills + on-chain Desk, see CHANGELOG 2026-09-10).
This plan closes the UX / ecosystem / demo gaps without breaking `design.md`.

## P0 — before submitting (judge comprehension + trading activity)

- [x] 1. Floor onboarding rail (`FollowFadeBar.tsx`, `Floor.tsx`)
      When `!isConnected` or no stake: `1 Faucet on Setup → 2 Tap a seat →
      3 Follow · winners claim on Desk` + brass `Start` → `/setup`.
- [x] 2. Promote Desk (`ShellNav.tsx`, `design.md`, `SKILL.md`)
      Primary becomes Floor · Watch · Desk; More holds Setup · Roster ·
      How it works. No 5-item nav.
- [x] 3. Watch as closer board (`watch/page.tsx`)
      Sort by seconds-left, show `left` countdown + `Up NN¢` from `impliedUp`,
      halt styling <30s. One tap picks the closing window.
- [x] 4. Desk proof surface (`dashboard/page.tsx`, `useDesk.ts`)
      `Share fill` copy-button per ledger row (floor link + tx).
- [x] 5. Roster leaderboard (`roster/page.tsx`, `api/agents/roster`)
      Win-rate bars, pending counts, `Ride` button → sets allegiance +
      links Floor. Share button + `?ride=` deep-link added.
- [x] 6. Demo-safe mode (`demo-data.ts`, `windows.ts`, `useFollowTrade`)
      `?demo=1` seeds a fake book so Follow clicks through to a simulated
      fill + Desk ledger entry. Always labelled DEMO.

## P1 — delight + differentiation

- [x] 7. Bell moment (`WindowClock.tsx`)
      Close cascade: ring animates to final ↑NN¢, sweeps for 2s,
      settles to CHIME. `onChime` callback fires. Respects
      `prefers-reduced-motion`.
- [x] 8. Tape persistence (`marketStore.ts`)
      Last fills per window in `localStorage` so tape survives reload.
- [x] 9. How it works — nav label only, route stays `/help`.
- [x] 10. SDK feedback report (`docs/SDK_FEEDBACK.md`)
      1 page: indexer lag, fill-by-tx gaps, silent empty books, faucet
      discoverability, status-int mapping, venue-rotation docs.

## P2 — Chime-In Effect (signature feature)

- [x] 11. ChimeCard (`ChimeCard.tsx`, `useVoices.ts`)
      SVG snapshot after close: final probability arc, voices count,
      user outcome. "Post on X" opens twitter intent with deep-link.
      Appears 2.2s after bell to let cascade play first.
- [x] 12. Voices count (`useVoices.ts`, `Floor.tsx`)
      Distinct Follow/Fade participants in current window. Below 3:
      info text. 3+: tappable CTA "N traders chimed in — join them"
      scrolls to Follow/Fade.
- [x] 13. Tweet intent + `?chime=NN` deep-link (`ChimeCard.tsx`)
      URL encodes final probability so recipients see the result and
      land on the right window. Copies link to clipboard as fallback.

## P3 — Viral distribution loops

- [x] 14. ChimeLanding banner (`ChimeLanding.tsx`)
      Detects `?chime=NN` on Floor. Shows closed result + countdown to
      next open. Turns tweet clicks from a tombstone into a hook.
- [x] 15. TensionShare (`TensionShare.tsx`)
      In the last 60s of a live window (halt zone, >15s left): `↗ share
      the tension` opens pre-filled tweet with live probability +
      countdown. Drama > receipts.
- [x] 16. Roster share + `?ride=` deep-link (`roster/page.tsx`)
      `↗ share` per agent row tweets win rate + `?ride=Label` URL.
      Floor reads `?ride=` on mount to pre-select allegiance.

## P4 — Differentiation pass

- [x] 17. Dynamic seat lines (`personality-presets.ts`, `AgentPit.tsx`)
      `dynamicLine(label, side, upPct, secondsLeft)` — 6 personalities
      × 6 state bands. Pit commentary updates every tick.
- [x] 18. Window story line (`WindowStory.tsx`)
      `opened 45¢ · high 71¢ · now 63¢` above the sparkline.
      Gives tweet inbound visitors instant context.
- [x] 19. Submission sentence locked
      "Chime is the only prediction market where the close is a social
      moment." in WIN_PLAN item 13 with full copy-paste submission note.

## Submission

- [ ] 20. Demo video (2:30):
      **First 15s:** Open on a live window, clock ticking, pit seats
      showing live commentary ("71¢. Market agrees. Book confirmation.").
      Voice over: "Chime is the only prediction market where the close
      is a social moment." Let the bell ring on camera.
      **Full arc:** clock → voices CTA → seat tap → Follow → fill toast
      → Desk → Watch closer → bell → cascade → ChimeCard → Post on X →
      Roster ride → `?ride=` share → faucet → roadmap.
- [ ] 21. One winning claim on camera (`prove:loop`, Desk → Claim).
- [ ] 22. Autonomous agent via DreamDEX Bot Kit (credentials pending).
- [ ] 23. Final verify: `npm run lint` / `npx tsc --noEmit` / `npm run build`.
- [ ] 24. Submit: testnet prototype + repo + video + SDK_FEEDBACK.md.

      **Submission notes (copy-paste):**
      "Chime is the only prediction market where the close is a social
      moment. When the bell rings, the implied probability resolves into
      an animated cascade, a shareable Chime Card appears with the final
      result and voice count, and one tap posts a pre-filled tweet that
      deep-links back to the next live window. Seat commentary updates
      live as the market moves. Spectators can share the tension before
      the result is known. The Roster leaderboard is shareable with a
      `?ride=` deep-link that pre-selects your agent on arrival.
      We also filed a one-page SDK feedback report covering indexer lag,
      fill-by-tx gaps, silent empty books, faucet discoverability,
      status-int mapping, and venue-rotation docs — see
      `docs/SDK_FEEDBACK.md` in the repo."

## Log

- 2026-09-10: plan written. P0 1–6 then P1 7–10 in lock order.
- 2026-09-10: P0 + P1 shipped (items 1–10).
- 2026-09-10: P2 Chime-In Effect shipped — ChimeCard, useVoices,
  close cascade, tweet intent + `?chime=NN` deep-link (items 11–13).
- 2026-09-10: P3 viral loops shipped — ChimeLanding, TensionShare,
  Roster share + `?ride=` deep-link (items 14–16).
- 2026-09-10: P4 differentiation shipped — dynamic seat lines
  (dynamicLine()), WindowStory, submission sentence (items 17–19).
- Remaining: demo video, winning claim on camera, Bot Kit agent,
  final verify, submit.
