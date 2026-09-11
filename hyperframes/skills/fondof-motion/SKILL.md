# fondof-motion Skill

> High-energy kinetic typography for fast-paced brand and demo videos.

## Install

```bash
npx hyperframes skills update fondof-motion
```

## Usage

```
Using /hyperframes, make a 30-second demo video with fondof-style kinetic typography.
High energy, spring physics, hard cuts, extreme scale contrast.
```

## Patterns

| Pattern | Easing | Duration | Use Case |
|---------|--------|----------|----------|
| Stamp-In | `back.out(1.7)` | 0.35s | Hero numbers, single words |
| Cascade | `back.out(1.5)` stagger 0.06s | per word | Headlines, taglines |
| Scale-Pulse | `power2.out` + pulse | 0.8–1.5s | Counters, statistics |
| Flip-Enter | `back.out(1.7)` | 0.5s | Cards, sections |
| Snap-Grid | `none` (linear) | 0.1–0.2s | UI elements, precise moves |
| Text-Scramble | `none` | 0.8–1.5s | Tech vibes, decryption |

## Rules

1. Hard cuts only — no crossfades
2. Always overshoot with `back.out()`
3. Stagger all simultaneous elements
4. Extreme scale: 18px labels → 140px+ hero
5. 1.5–3s per beat max
6. Ambient idle on holds (1% scale breathe)

## See Also

- `references/fondof-patterns.md` — Full pattern library with code
- `STORYBOARD_FONDOF.md` — CHIME demo application
