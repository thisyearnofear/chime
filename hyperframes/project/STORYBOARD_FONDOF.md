# CHIME Demo — fondof Style (60s)

## Composition: `hyperframes/demo-video-fondof.html`
**Duration:** 60 seconds
**Format:** 1920×1080, 30fps
**Style:** Industrial pit + fondof kinetic typography

---

## Scene Breakdown (fondof-optimized)

### Scene 1: Hook Stamp (0:00–0:03)
**Pattern:** Stamp-In + Cascade
**Elements:**
- "SOMNIA × DREAMDEX" — tiny mono, fades in 0.2s
- "CHIME" — massive Newsreader, stamps in with `back.out(1.7)` at 0.3s
- "THE CLOSE IS SOCIAL" — cascade word-by-word, 0.6s stagger

**New copy:**
```
SOMNIA × DREAMDEX
CHIME
The close is a social moment.
```

### Scene 2: Window Snap (0:03–0:07)
**Pattern:** Flip-Enter + Scale-Pulse
**Elements:**
- Clock face flips in from -90° rotation
- Price snaps from "↑52¢" to "↑67¢" with counter pulse
- Two seats flip in sequentially (Sage first, then Rogue)

**Animation:**
```javascript
// Clock flip
tl.from('#clock', { rotationX: -90, scale: 0.5, duration: 0.5, ease: 'back.out(1.7)' }, 0)
// Price snap
tl.to('#price', { innerText: 67, duration: 0.8, snap: { innerText: 1 }, ease: 'power2.out' }, 0.3)
// Seats flip in
tl.from('.seat', { rotationY: 90, opacity: 0, stagger: 0.15, duration: 0.4, ease: 'back.out(1.5)' }, 0.6)
```

### Scene 3: Chime Pop (0:07–0:11)
**Pattern:** Stamp buttons + Counter pulse
**Elements:**
- "↑ CHIME UP" stamps in left
- "↓ CHIME DOWN" stamps in right (0.1s delay)
- Chorus counters pulse: Up → 12, Down → 8
- Progress bar snaps to 60%

**Animation:**
```javascript
tl.from('#chime-up', { scale: 0, opacity: 0, duration: 0.3, ease: 'back.out(2)' }, 0)
tl.from('#chime-down', { scale: 0, opacity: 0, duration: 0.3, ease: 'back.out(2)' }, 0.15)
tl.to('#up-count', { innerText: 12, duration: 0.6, snap: { innerText: 1 } }, 0.4)
tl.to('#down-count', { innerText: 8, duration: 0.6, snap: { innerText: 1 } }, 0.5)
```

### Scene 4: Stake Slam (0:11–0:14)
**Pattern:** Snap-Grid + Stamp
**Elements:**
- "FOLLOW sage ↑" button stamps
- Pit shows Sage highlighted with border slam
- Size indicator: "5 tUSDC" slides in

### Scene 5: Bell Countdown (0:14–0:19)
**Pattern:** Roll + Scale-Pulse
**Elements:**
- Clock ticks down from 0:30 (linear, no easing)
- Price holds at "↑67¢"
- Final 10s: color shifts to halt-red
- Bell toll: scale pulse on card

### Scene 6: Result Stamp (0:19–0:24)
**Pattern:** Stamp + Counter
**Elements:**
- "RESULT" badge stamps in
- "↑67¢" massive, scale-pulse on reveal
- "47 voices" counts up
- "✓ you won" stamps with bounce

### Scene 7: Share Roll (0:24–0:28)
**Pattern:** Horizontal Roll + Cascade
**Elements:**
- Agent row rolls in from left
- Win rate cascades: "Sage · 72% · 14W/5L"
- Share button stamps

### Scene 8: CTA Stamp (0:28–0:33)
**Pattern:** Stamp logo + Cascade tagline
**Elements:**
- "CHIME" stamps huge
- "Two seats. One window. Chime in." cascades
- Buttons stamp in sequence
- Footer fades last

---

## Key Differences from Original

| Aspect | Original | fondof Version |
|--------|----------|----------------|
| Duration | 150s | 33s (can extend to 60s) |
| Transitions | Hard cuts (same) | Hard cuts + stamp energy |
| Text Animation | Fade + y-offset | Stamp, flip, cascade, pulse |
| Pacing | 10–30s per scene | 3–5s per scene |
| Motion Feel | Calm, editorial | Energetic, spring-physics |
| Camera | Static | Subtle push-ins on hero moments |

---

## Technical Implementation

```javascript
// Timeline structure
const tl = gsap.timeline({ paused: true });

// Scene 1: Hook (0–3s)
tl.from('#eye-brow', { opacity: 0, duration: 0.2 }, 0.2)
  .from('#hero-title', { scale: 0, opacity: 0, duration: 0.4, ease: 'back.out(1.7)' }, 0.4)
  .from('.cascade-word', { opacity: 0, y: 20, stagger: 0.06, duration: 0.25, ease: 'back.out(1.5)' }, 0.9)

// Scene 2: Window (3–7s)
tl.from('#clock', { rotationX: -90, scale: 0.5, duration: 0.5, ease: 'back.out(1.7)' }, 3)
  .to('#price', { innerText: 67, duration: 0.8, snap: { innerText: 1 } }, 3.3)
  .from('.seat', { rotationY: 90, opacity: 0, stagger: 0.15, duration: 0.4, ease: 'back.out(1.5)' }, 3.6)

// ... continue for all scenes

window.__timelines['fondof-demo'] = tl;
```

---

## Next Steps

1. Create `hyperframes/demo-video-fondof.html` with the above structure
2. Run `npx hyperframes lint hyperframes/` to validate
3. Run `npx hyperframes check hyperframes/` to verify layout
4. Preview: `npx hyperframes preview hyperframes/`
5. Render: `npx hyperframes render hyperframes/ -q high -o renders/fondof-demo.mp4`
