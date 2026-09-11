# CHIME Demo Video — Storyboard

## Composition: `hyperframes/demo-video.html`
**Duration:** 150 seconds (2:30)
**Format:** 1920×1080, static frames with GSAP animation
**Style:** Industrial pit aesthetic — paper-dark background, brass accents, JetBrains Mono + Newsreader

---

## Scene Breakdown

### Scene 1: Hook (0:00-0:10)
**Visual:** Title card on paper-dark background
**Copy:**
- "SOMNIA × DREAMDEX HACKATHON" (mono, small)
- "Chime is the only prediction market" (Newsreader, large)
- "where the close is a social moment." (brass accent)
**Audio:** Subtle clock tick, two-tone ping at end

### Scene 2: The Window (0:10-0:25)
**Visual:** Split layout — clock face left, agent seats right
**Elements:**
- Live clock with brass hands
- Price: "↑52¢" → animates to "↑67¢"
- Two agent seats: Sage (brass, Up) vs Rogue (slate, Down)
**Copy:** "Two AI agents take opposite sides on a BTC or ETH window. The clock ticks. The book fills. The tension builds."

### Scene 3: Chime Free (0:25-0:40)
**Visual:** Split layout — buttons left, chorus rail right
**Elements:**
- "↑ CHIME UP" / "↓ CHIME DOWN" buttons
- Chorus counter: Up votes → 12, Down votes → 8
- Progress bar filling to 60%
**Copy:** "Tap to chime free — no wallet, no stake. Just a take. A two-tone ping rings out and your voice joins the chorus."
**Key message:** Free action requires no wallet

### Scene 4: Follow/Fade (0:40-0:55)
**Visual:** Split layout — stake buttons left, pit right
**Elements:**
- "FOLLOW sage ↑" / "FADE ↓" buttons
- Pit showing seated allegiance (Sage highlighted)
- Size indicator: "5 tUSDC"
**Copy:** "When you're ready, follow or fade with a stake. One tap, instant IOC fill. Your side is locked in."

### Scene 5: The Bell (0:55-1:15)
**Visual:** Centered clock, final 30s countdown
**Elements:**
- Clock ticking down from 0:30
- Price holding at "↑67¢"
- Halt-red styling in final 10s
- Bell toll visual (ring animates, sweeps)
**Copy:** "The bell tolls. The cascade sweeps. The result locks."
**Key moment:** The close ceremony — this is the signature feature

### Scene 6: ChimeCard (1:15-1:40)
**Visual:** Centered card with result
**Elements:**
- "RESULT" badge
- Large price: "↑67¢"
- Voice count: "47 voices chimed in"
- User result: "✓ you won"
- CTA buttons: "↗ POST ON X" / "VIEW ON DESK"
**Copy:** Deep-link explanation: "?chime=67 deep-link back to next window"
**Key message:** Shareable artifact that drives return traffic

### Scene 7: Roster Share (1:40-2:00)
**Visual:** Split layout — explanation left, leaderboard right
**Elements:**
- Agent row with win rate: "Sage · 72% · 14W/5L"
- Share button with ?ride= deep-link
- Roster tape showing top agents
**Copy:** "Share your agent's performance. The ?ride= deep-link drops friends directly into their seat."

### Scene 8: CTA (2:00-2:30)
**Visual:** Centered call to action
**Elements:**
- "CHIME" title
- Tagline: "Two seats. One window. Chime in."
- Two buttons: "↗ GITHUB REPO" / "TRY IT LIVE"
- Footer: Somnia Testnet · DreamDEX Event Contracts · SDK feedback link
**Copy:** Minimal — let the repo link and live URL do the work

---

## Animation Notes

- **Transitions:** Hard cuts between scenes (no crossfades — maintain pacing)
- **Text reveals:** Opacity + subtle y-offset (power2.out easing)
- **Counters:** Snap animation (no easing) for integer counts
- **Clock hands:** Linear rotation matching real time
- **Price updates:** Snap to new value (reflects live nature)
- **Bell moment:** Scale pulse on the card + color shift to halt-red

---

## Technical Specs

- **Resolution:** 1920×1080 (16:9)
- **Frame rate:** 30fps (render target)
- **Audio:** Optional — clock tick, two-tone ping, bell toll (not included in draft)
- **Export:** MP4 via `npx hyperframes render`

---

## Next Steps

1. Review storyboard with user
2. Add audio track (clock, ping, bell)
3. Render composition: `npx hyperframes render hyperframes/demo-video.html`
4. Export to MP4
5. Upload to hackathon submission

---

## Proof of Claim (Separate)

The `prove:loop` script demonstrates on-chain activity:
- Faucet → Follow (IOC) → Fill confirmed
- Desk shows position indexed
- Chain seat verified
- Claim path armed (ready to redeem on Finalized windows)

**Next action:** Run prove:loop again after a window finalizes to capture actual claim tx.
