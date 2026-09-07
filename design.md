# CHIME — Closing Bell

Locked visual system. Subsequent UI work defers to this file.

## Job

Spectator sees the live window and two opposite seats. One tap follows or fades. The bell ends it.

## Audience

People watching a BTC/ETH Event Contract. Wallet is optional until Follow/Fade.

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
- `--brass` `#c4a15a` — Up, Follow, live, CHIME
- `--slate` `#7d847c` — Down, Fade (not a second brand)
- `--halt` `#c45c4a` — last 30s / error

One accent. Down is pewter, not violet.

## Layout

- Slim top rail: CHIME · Floor Watch Desk Roster · wallet
- Floor is a split: clock left, seats + taps right
- No second wordmark on the floor
- Floor switcher shows **live windows only**; Watch owns the catalog
- Hide the book until a bid or ask exists
- Follow/Fade live under the followed seat, not a sticky bar
- Ticker is one quote line, only after seats exist

## Motion

Clock tick. One scale pulse on CHIME. No magnet, ping, shimmer, or float.

## Do not ship

Space Grotesk as the voice. Purple radial fields. Gradient pills. Emoji as the visual system (icons may stay on seats). Magnet buttons. Section kickers. Empty 50/50 rails.
