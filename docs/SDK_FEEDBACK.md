# DreamDEX SDK feedback — CHIME on Shannon testnet

One page for the hackathon's optional feedback report. Venue
`679795a0…`, `@somnia-chain/markets-sdk ^0.29.0`, Sept 2026.

## What worked

- `SomniaMarkets` + `loadMarkets` + `createOrder` (IOC) filled twice off the
  live book with no seeding. `priceToPrecision` / `amountToPrecision` helpers
  snapped lots correctly.
- `client.getMarketOnchain` + `getOutcomeBalance` stayed truthful while the
  indexer lagged fills by minutes — Desk reads chain first because of this.
- `trader.faucet` funded tUSDC reliably; `mintSet` seeded a maker when needed.

## Friction

1. **Indexer lag on fills.** `getPortfolio` took minutes to show a fill that
   `getOutcomeBalance` already proved. Any consumer app must double-read or
   look broken. A `?fresh=chain` hint or fill-by-tx endpoint would help.
2. **No fill-by-tx lookup.** After `createOrder` returns a tx hash there is no
   direct way to poll that fill; we poll the whole portfolio and match hashes.
3. **Book emptiness is silent.** `fetchOrderBook` on an empty book returns no
   rows with no signal whether the window simply has no makers yet. A
   `makerCount` or `firstListedAt` field would let UIs say "no makers yet"
   instead of "no book".
4. **Faucet discoverability.** The SDK faucet works but nothing links it to a
   window's collateral; we hand-roll the Setup explainer. A
   `collateral.faucetUrl` or `needsFaucet(balance)` helper would shorten
   onboarding.
5. **Expiry/status clocks differ.** Indexer `clobStatus` vs on-chain `status`
   ints need a mapping table every consumer rewrites
   (`Listed/Trading/Locked/Settling/Resolved/Voided` ↔ `0–5`). Ship it in SDK.

## Docs

Event Contracts docs got us to a first fill in under a day. The venue-ID
rotation story is unclear — `NEXT_PUBLIC_VENUE_ID` override exists in CHIME
because we could not tell if the testnet venue is stable. A changelog line
per venue rotation would remove the guesswork.
