# Floor interactions

Four verbs. No magnets. No extra chrome.

## 1. Seat press

Tap a pit row to set allegiance. The row gets `· you`. Follow/Fade moves under that seat. Do not nest Follow/Fade inside the seat button.

## 2. Sparkline halt

Implied-Up polyline under the clock, last ~40 mids. Brass if last mid ≥ 0.5, pewter if below, `--halt` in the last 30s or when locked. Hidden until a bid or ask exists.

## 3. Closing bell

When remaining hits zero or the window locks after having been open, the clock reads CHIME and `playClosingBell` fires once. No extra overlay.

## 4. Follow / fade

IOC on the followed seat’s side (fade flips it). After a fill, the followed seat reads `you're on Up · 5 tUSDC`. The pit tape logs Follow/Fade and mid prints.

Success: spectator understands the window without a wallet; one tap still follows or fades.
