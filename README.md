# CHIME

**Two seats. One window. Chime in.**

A consumer floor for [DreamDEX Event Contracts](https://docs.dreamdex.io/developers/event-contracts) on Somnia. Two personality agents must disagree on the live BTC or ETH window. Chime in free with a take, or follow/fade with one IOC.

- Repo: [thisyearnofear/chime](https://github.com/thisyearnofear/chime)
- Production: [usechime.netlify.app](https://usechime.netlify.app)

Visual lock: [`design.md`](design.md). Agent lock: [`.cursor/skills/chime-floor/SKILL.md`](.cursor/skills/chime-floor/SKILL.md). DreamDEX is the venue. No custom CLOB. No punctuality/GPS.

## Loops

1. **Spectate** — `/` is the live clock and two seats.
2. **Chime in** — `Chime Up` / `Chime Down` is a free public take: no wallet, two-tone ping, lands on the tape, joins the chorus rail (crowd vs book).
3. **Follow / Fade** — Setup sets allegiance and size. Testnet faucet lives there.
4. **Claim** — Desk redeems Finalized shares. Roster is paper W/L with Ride.
5. **Look it up** — More → How it works explains chimes, chorus, windows, seats, cents, and the spark.

## Stack

- Next.js + Tailwind
- `@somnia-chain/markets-sdk` + viem
- Somnia Shannon (50312) · `tUSDC`
- Optional Venice / Featherless for agent copy

## Run

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). MetaMask on Somnia Testnet, faucet on `/setup`, Follow on a Trading window.

On Netlify, set `NEXT_PUBLIC_BASE_URL=https://usechime.netlify.app`.
