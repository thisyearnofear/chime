---
name: chime-floor
description: Locks CHIME UI to the industrial pit system—frames, clock-as-instrument, brass/pewter, compact two-seat floor. Use when changing Floor, Watch, Setup, Desk, Roster, layout, motion, or copy; when the user mentions design.md, the pit, Follow/Fade, or visual polish.
---

# CHIME floor

Read `design.md` at the repo root first. Change **one or two variables** per pass.

## Defaults

- Shell: `Page` (`max-w-6xl px-4 py-6 md:py-10`). Frames share `gap-4`, `1px` `--line`, brass L-ticks.
- Type: Newsreader **wordmark only**. Everything else JetBrains Mono. Labels 11px, tracking normal. No 0.35em eyebrows.
- Color: `--paper` `#100e0b`, `--ink` `#ece7dc`, `--mute` `#8a8478`, `--line` `#2a261f`, `--brass` `#c4a15a` (Up, Follow, live), `--slate` `#7d847c` (Down, Fade), `--halt` `#c45c4a` (last 30s). One accent.
- Clock is the instrument: outer ticks, remaining arc, implied-Up ring, numeral well. Sparkline under the clock, no axes. Hide book until bid/ask exists.
- Pit: two numbered spec rows (`01`/`02` stay mute). Tap seat = allegiance. Follow/Fade is a separate control under the followed seat (mobile: under the clock).
- Tape: ≤6 prints/follows under seat 02.
- Motion: clock tick, one CHIME scale pulse. Respect `prefers-reduced-motion`.

## Do not ship

Purple wash, glass/frost/blur theater, magnets, ping, shimmer, float, sparkle buttons, gradient pills, Space Grotesk, empty 50/50 rails, candlesticks, chat, Three.js, GSAP scroll stories, shader cursor trails, section kickers, emoji as the visual system.

## Pass rule

1. Name the one job (spectate / follow / claim).
2. Touch layout **or** type **or** one interaction—not all three.
3. Verify Floor plus every page that shares the frame (`/watch`, `/setup`, `/dashboard`, `/roster`).
4. If it needs a new color or a third column, stop.

Interactions: [interactions.md](interactions.md).
