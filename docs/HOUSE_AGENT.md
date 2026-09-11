# CHIME House Agent

The CHIME house agent autonomously trades the floor's own seat on DreamDEX
Event Contracts (Somnia testnet). Two implementations exist:

## 1. Standalone script (`scripts/house-agent.mjs`)

A lightweight single-file runner inside the chime repo. No Bot Kit dependency.
Reuses `@somnia-chain/markets-sdk` directly with the same IOC pricing as
`src/lib/markets/trade.ts` (`touch + 0.02`).

### Each pass

1. `GET /api/markets/live` → soonest-closing Trading window with >60 s left.
2. `GET /api/agents/window?marketId=…` (POST to generate if missing).
3. Takes `seats[0]` side on the live book via IOC limit buy (size 2 tUSDC).
4. `claimScan` — redeems every claimable house position.

### Run

```bash
node scripts/house-agent.mjs --once                        # single pass, prod API
node scripts/house-agent.mjs --once --base http://localhost:9127  # local API
npm run house          # --once against production
npm run house:loop     # daemon: one pass per 60 s
```

## 2. Bot-Kit strategy (`dreamdex-bot-kit / strategies/ec-chime`)

The production-grade implementation lives in the
[dreamdex-bot-kit](https://github.com/somnia-chain/dreamdex-bot-kit) repo,
cloned at `~/Dev/dreamdex-bot-kit`. It uses the kit's `placeLimit` (integer
tick/lot math), `maybeClaim`, and `activeMarkets` helpers.

### Run locally

```bash
cd ~/Dev/dreamdex-bot-kit
npm start -w ec-chime          # honours DRY_RUN in .env
```

### Deploy to VPS (PM2)

```bash
cd ~/Dev/dreamdex-bot-kit
./scripts/deploy-ec-chime.sh
```

This rsyncs to `/opt/ec-chime/releases/<ts>` on `snel-bot`, symlinks
`/opt/ec-chime/shared/.env`, and restarts via PM2 (`ecosystem.config.cjs`).

Full env-var reference and operational notes: see
`strategies/ec-chime/README.md` in the bot-kit repo.

## House wallet

| Field | Value |
|-------|-------|
| Address | `0x82BA4AAdF619eC82AcE7c7C77021Ec09F1f6AB5A` |
| Network | Somnia Shannon testnet |
| Funded  | 5.5 STT (gas) + 100 tUSDC (collateral) |
| Key stored in | `.env.local` → `HOUSE_PRIVATE_KEY` (chime repo) and `.env` → `PRIVATE_KEY` (bot-kit) |

The key was generated on 2026-09-11 and is **separate** from
`DEPLOYER_PRIVATE_KEY` (0x437D…bAc). Never commit either key.

## Production deployment (VPS)

The **ec-chime bot** runs 24/7 on the VPS (`snel-bot`) under PM2:

```
/opt/ec-chime/
├── current → releases/<timestamp>   # active release (symlink)
├── releases/
├── shared/
│   └── .env                         # PRIVATE_KEY, VENUE_ID, etc.
└── logs/
    ├── ec-chime-out-<pid>.log
    └── ec-chime-err-<pid>.log
```

Deploy from the bot-kit repo:

```bash
cd ~/Dev/dreamdex-bot-kit
./scripts/deploy-ec-chime.sh
```

Check status / logs:

```bash
ssh snel-bot 'pm2 describe ec-chime'
ssh snel-bot 'tail -50 /opt/ec-chime/logs/ec-chime-out-*.log'
```

### First successful production trade (2026-09-11)

```
up 2/2 BTC-0-11SEP26-1745/tUSDC (Taker) @ ~0.478
tx=0x3f8f3aec547e0c010d0f7bf3807ec584d7870aaf3cc408edff8aef75971d74ee
```

## Notes

- House size is 2 shares per trade — intentionally small for testnet.
- One position per window; already-held windows are skipped (claims still run).
- Empty books produce `ImmediateOrCancelNoFill` — logged and skipped, not an
  error.
- The SDK's fixed gas ceiling is ~0.6 STT per tx; keep ≥ 2 STT in the wallet.
- Faucet (`trader.faucet()`) may revert on new wallets; fund via deployer
  transfer instead.
- Never run two bot instances on the same key (nonce races).
- Daemonise with PM2: `pm2 start ecosystem.config.cjs` (bot-kit repo) or
  `pm2 start scripts/house-agent.mjs --name chime-house -- --loop` (chime repo).
