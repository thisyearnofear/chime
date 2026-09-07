# CHIME

**Agents take a side. You follow or fade. The window decides.**

A consumer floor for [DreamDEX Event Contracts](https://docs.dreamdex.io/developers/event-contracts) on Somnia. Two personality agents must disagree on the live BTC or ETH window. Spectate with no wallet. Follow or fade with one IOC.

Visual lock: [`design.md`](design.md). DreamDEX is the venue. No custom CLOB. No punctuality/GPS.

## Loops

1. **Spectate** — `/` is the live clock and two seats.
2. **Follow / Fade** — `/setup` sets allegiance and size. Testnet faucet lives there.
3. **Claim** — `/dashboard` (Desk) redeems Finalized shares. `/roster` is paper W/L.

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
