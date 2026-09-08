# CHIME — Closing Bell

Locked visual system. Subsequent UI work defers to this file.

## Job

Spectator sees the live window and two opposite seats. One tap follows or fades. The bell ends it.

## Audience

People watching a BTC or ETH Event Contract. Wallet is optional until Follow/Fade.

## Tone

Industrial pit. Warm ink paper. Brass accent. No purple wash, no glass theater, no sparkle buttons.

## Type

- Display (wordmark only): Newsreader, roman
- Everything else: JetBrains Mono
- No 0.35em uppercase eyebrows. Labels are 11px mono, tracking normal.

## Color

- `--paper` `#100e0b`
- `--ink` `#ece7dc`
- `--mute` `#8a8478`
- `--line` `#2a261f`
- `--brass` `#c4a15a` — Up, Follow, live, CHIME, corner ticks
- `--slate` `#7d847c` — Down, Fade (not a second brand)
- `--halt` `#c45c4a` — last 30s / error

One accent. Down is pewter, not violet.

## Layout

- Slim top rail: CHIME · Floor Watch More · wallet
- More holds Setup, Desk, Roster
- Floor is two framed panels: WINDOW left, PIT right
- Each frame has inset rules and brass corner ticks
- Window rail: LIVE · cadence · collateral
- Pit rail: 01 / 02
- Clock is the hero object. Seats are numbered spec rows
- One verbal hero under the clock: *Two seats. One window. Follow or fade.*
- Floor switcher shows **live windows only**; Watch owns the catalog
- Hide the book until a bid or ask exists
- Implied-up sparkline under the clock: last ~40 mids, no axes. Halt stroke in the last 30s
- Seat rows are tappable allegiance. Follow/Fade stays a separate control
- Pit tape: at most six prints and follows, under seat 02
- Follow/Fade sits under the followed seat on desktop; under the clock on mobile so the taps stay on screen
- Ticker is one quote line, only after seats exist

## Motion

Clock tick. One scale pulse on CHIME. No magnet, ping, shimmer, or float.

## Do not ship

Space Grotesk as the voice. Purple radial fields. Gradient pills. Emoji as the visual system (icons may stay on seats). Magnet buttons. Section kickers. Empty 50/50 rails. Five-item primary nav. Unframed two-column marketing layout.
