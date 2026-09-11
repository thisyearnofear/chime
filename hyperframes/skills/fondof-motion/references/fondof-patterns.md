# fondof Pattern Library

Reusable GSAP animation patterns for high-energy kinetic typography.

---

## Pattern 1: Stamp-In

Single word or number slams into place with bounce.

```javascript
// Usage: ts.to('#stamp-target', {
//   scale: [0, 1.15, 1], opacity: [0, 1], duration: 0.4, ease: 'back.out(1.7)'
// }, 0)

gsap.fromTo(element, 
  { scale: 0, opacity: 0, y: 20 },
  { 
    scale: 1.15, 
    opacity: 1, 
    y: 0,
    duration: 0.35, 
    ease: 'back.out(1.7)',
    onComplete: () => gsap.to(element, { scale: 1, duration: 0.1 })
  }
);
```

**Timing:** 0.35–0.5s total  
**Best for:** Hero numbers, single-word emphasis, CTA buttons

---

## Pattern 2: Cascade Reveal

Words appear one-by-one with stagger, like a ticker unrolling.

```javascript
// Usage: ts.from('.cascade-word', {
//   opacity: 0, y: 30, scale: 0.8, 
//   stagger: 0.08, duration: 0.3, ease: 'back.out(2)'
// }, 0)

gsap.utils.toArray('.cascade-word').forEach((word, i) => {
  gsap.from(word, {
    opacity: 0,
    y: 30,
    scale: 0.7,
    rotationX: -45,
    duration: 0.35,
    delay: i * 0.08,
    ease: 'back.out(2)'
  });
});
```

**Timing:** 0.08s stagger per word  
**Best for:** Headlines, taglines, multi-word statements

---

## Pattern 3: Scale-Pulse Count-Up

Number counts up with overshoot, then pulses once on final value.

```javascript
// Usage: ts.to('#counter', {
//   innerText: 67, duration: 1.5, 
//   snap: { innerText: 1 }, ease: 'power2.out'
// }, 0)
// ts.to('#counter', {
//   scale: 1.08, duration: 0.15, ease: 'power1.inOut',
//   yoyo: true, repeat: 1
// }, 1.4)

const counter = document.getElementById('counter');
const target = 67;
const duration = 1.5;

gsap.to(counter, {
  innerText: target,
  duration: duration,
  snap: { innerText: 1 },
  ease: 'power2.out',
  onStart: () => {
    counter.textContent = '0';
  }
});

// Pulse on landing
gsap.to(counter, {
  scale: 1.08,
  duration: 0.15,
  ease: 'power1.inOut',
  yoyo: true,
  repeat: 1,
  delay: duration
});
```

**Timing:** 1.0–2.0s count + 0.15s pulse  
**Best for:** Statistics, probabilities, vote counts

---

## Pattern 4: Flip-Enter

Element flips in from 90° rotation, lands with bounce.

```javascript
// Usage: ts.from('#flip-target', {
//   rotationX: -90, scale: 0.5, opacity: 0,
//   duration: 0.6, ease: 'back.out(1.7)'
// }, 0)

gsap.from(element, {
  rotationX: -90,
  scale: 0.5,
  opacity: 0,
  duration: 0.5,
  ease: 'back.out(1.7)'
});
```

**Timing:** 0.5–0.7s  
**Best for:** Section headers, labels, badge reveals

---

## Pattern 5: Snap-Grid Move

Mechanical, precise movement — no easing, instant position changes.

```javascript
// Usage: ts.to('#grid-element', {
//   x: 200, duration: 0.15, ease: 'none'
// }, 0)

gsap.to(element, {
  x: targetX,
  duration: 0.12,
  ease: 'none' // Linear, machine-like
});
```

**Timing:** 0.1–0.2s (snappy, no float)  
**Best for:** UI mockups, data reveals, technical elements

---

## Pattern 6: Text Scramble

Characters cycle through random values before resolving to final text.

```javascript
// Usage: ts.to('#scramble', {
//   text: { value: 'CHIME', duration: 1.2, charThreshold: 3 }
// }, 0)

// GSAP TextPlugin required
gsap.to(element, {
  text: {
    value: 'FINAL TEXT',
    duration: 1.0,
    charThreshold: 3,
    delimiter: ''
  },
  ease: 'none'
});
```

**Timing:** 0.8–1.5s  
**Best for:** Tech vibes, decryption reveals, "loading" moments

---

## Pattern 7: Horizontal Roll

Text scrolls horizontally like a stock ticker or slot machine.

```javascript
// Usage: ts.fromTo('.roll-strip', {
//   x: '-100%',
// }, {
//   x: '0%',
//   duration: 0.8,
//   ease: 'power2.inOut'
// }, 0)

gsap.fromTo(element, 
  { x: '-100%' },
  { 
    x: '0%', 
    duration: 0.6, 
    ease: 'power2.inOut'
  }
);
```

**Timing:** 0.6–1.0s  
**Best for:** Tickers, rolling stats, side-scrolling content

---

## Complete Timeline Example

```javascript
const tl = gsap.timeline({ paused: true });

// 0.0s — Stamp hero number
tl.fromTo('#hero-number', 
  { scale: 0, opacity: 0 },
  { scale: 1.15, opacity: 1, duration: 0.35, ease: 'back.out(1.7)' },
  0
)
.to('#hero-number', { scale: 1, duration: 0.1 }, 0.35)

// 0.5s — Cascade subtitle words
tl.from('.subtitle-word', 
  { opacity: 0, y: 20, stagger: 0.06, duration: 0.25, ease: 'back.out(1.5)' },
  0.5
)

// 1.2s — Scale pulse on counter
tl.to('#counter', 
  { innerText: 47, duration: 0.8, snap: { innerText: 1 }, ease: 'power2.out' },
  1.2
)
.to('#counter', { scale: 1.08, duration: 0.12, yoyo: true, repeat: 1 }, 2.0)

// 2.5s — Hard cut to next scene
// (no transition — instant swap)

window.__timelines['fondof-demo'] = tl;
```

---

## Motion Rules (fondof-specific)

1. **Never crossfade** — use hard cuts or instant swaps
2. **Always overshoot** — `back.out()` on every entrance
3. **Stagger everything** — no simultaneous starts
4. **Ambient idle on holds** — 1% scale breathe even when "still"
5. **Speed up** — 1.5–3s per beat, not 5–8s
6. **Drop shadows on text** — creates depth for flat kinetic type
7. **Mono + Serif pairing** — JetBrains Mono (UI) + Newsreader (voice)

---

## Integration with CHIME

Apply these patterns to the existing CHIME demo video:

| Current Scene | fondof Pattern | New Duration |
|--------------|----------------|--------------|
| Hook (10s) | Stamp-In + Cascade | 3s |
| Window (15s) | Scale-Pulse + Flip-Enter | 4s |
| Chime Free (15s) | Counter pulse + Snap-Grid | 4s |
| Follow/Fade (15s) | Stamp-In buttons | 3s |
| The Bell (20s) | Timer roll + Scale-pulse | 5s |
| ChimeCard (25s) | Stamp result + Counter | 5s |
| Roster Share (20s) | Cascade names | 4s |
| CTA (30s) | Stamp logo + Cascade tagline | 5s |

**Total: ~33s** (can stretch to 45–60s with ambient idle)
