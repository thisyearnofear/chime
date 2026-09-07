'use client'

import { snapPrice } from './format'
import { getExchange } from './exchange'
import { getMarketNetwork } from './config'
import type { LiveWindow, Side } from '@/types/markets'

export class TradeError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
  }
}

export async function placeFollowOrder(input: {
  window: LiveWindow
  side: Side
  size: number
}): Promise<{ txHash?: string }> {
  if (input.window.demo) {
    throw new TradeError('DEMO', 'This window is a demo feed. Live order books are not listed on this network yet.')
  }
  if (!input.window.marketId.startsWith('0x')) {
    throw new TradeError('DEMO', 'Cannot trade a demo market.')
  }

  const ex = await getExchange()
  const onchain = await ex.client.getMarketOnchain(input.window.marketId as `0x${string}`)
  if (Number(onchain.status) !== 1) {
    throw new TradeError('WINDOW_LOCKED', 'Window is locked. Wait for the next chime.')
  }
  const expiry = Number(onchain.expiry ?? input.window.expiry)
  if (expiry - Date.now() / 1000 < 15) {
    throw new TradeError('WINDOW_CLOSING', 'Less than 15s left. New orders are closed.')
  }

  const touch =
    input.side === 'up'
      ? input.window.bestAsk ?? 0.55
      : input.window.bestBid != null
        ? 1 - input.window.bestBid
        : 0.55
  let price = snapPrice(touch + 0.02)
  let amount = input.size

  await ex.loadMarkets(true)
  const markets = await ex.loadMarkets()
  const match = Object.values(markets).find(
    (m) => m.id?.toLowerCase() === input.window.marketId.toLowerCase()
  )
  const outcome = input.side === 'up' ? 'YES' : 'NO'
  const candidates = [
    input.side === 'up' ? input.window.upSymbol : input.window.downSymbol,
    match?.outcomes?.find((o) => o.label === outcome)?.symbol,
    match ? `${match.symbol}#${outcome}` : null,
  ].filter((s): s is string => Boolean(s))
  const uniqueRefs = [...new Set(candidates)]
  const precisionRef = uniqueRefs[0]
  if (!precisionRef) {
    throw new TradeError('NO_SYMBOL', 'This window has no tradable symbol yet.')
  }

  if (typeof ex.priceToPrecision === 'function') {
    try {
      price = Number(ex.priceToPrecision(precisionRef, price))
    } catch {
      /* keep snapped price */
    }
  }
  if (typeof ex.amountToPrecision === 'function') {
    try {
      amount = Number(ex.amountToPrecision(precisionRef, amount))
    } catch {
      /* keep requested size */
    }
  }
  if (!amount) {
    throw new TradeError('SIZE_TOO_SMALL', 'Size is below the venue lot. Increase your default size.')
  }

  let lastError: unknown
  for (const ref of uniqueRefs) {
    try {
      const order = await ex.createOrder(ref, 'limit', 'buy', amount, price, { timeInForce: 'IOC' })
      const txHash =
        (order as { txHash?: string }).txHash ??
        order.info?.receipt?.transactionHash
      return { txHash }
    } catch (error) {
      lastError = error
    }
  }
  if (lastError instanceof Error) throw lastError
  throw new TradeError('ORDER_FAILED', 'Could not place IOC on this window.')
}

export async function faucetCollateral(): Promise<void> {
  const net = getMarketNetwork()
  if (!net.faucet) {
    throw new TradeError('NO_FAUCET', 'Faucet is testnet only.')
  }
  const ex = await getExchange()
  if (!ex.trader?.faucet) {
    throw new TradeError('NO_FAUCET', 'SDK faucet is unavailable. Bind a wallet first.')
  }
  await ex.trader.faucet()
}

export async function redeemWinnings(): Promise<{ claimed: number; hashes: string[] }> {
  const ex = await getExchange()
  const net = getMarketNetwork()
  if (!ex.client.listBinaryMarkets || !ex.trader?.redeem) {
    throw new TradeError('NO_REDEEM', 'Redeem is unavailable on this SDK build.')
  }
  const me = ex.walletAddress
  if (!me) throw new TradeError('NO_SIGNER', 'Connect a wallet to claim.')

  const settled = (await ex.client.listBinaryMarkets({
    venueId: net.venueId,
    status: 'Finalized',
    limit: 80,
  })) as Record<string, unknown>[]

  const hashes: string[] = []
  let claimed = 0

  for (const row of settled) {
    const marketId = String(row.marketId ?? '')
    if (!marketId.startsWith('0x')) continue
    const oc = await ex.client.getMarketOnchain(marketId as `0x${string}`)
    if (!oc.isResolved && !oc.isVoided) continue
    if (!ex.client.getOutcomeBalance) continue

    const held = {
      0: await ex.client.getOutcomeBalance({
        outcomeToken: oc.outcomeToken,
        account: me,
        id: oc.yesId,
      }),
      1: await ex.client.getOutcomeBalance({
        outcomeToken: oc.outcomeToken,
        account: me,
        id: oc.noId,
      }),
    }

    const toClaim: Array<0 | 1> = oc.isVoided ? [0, 1] : [Number(oc.winningOutcome) as 0 | 1]
    for (const outcomeIdx of toClaim) {
      if (!held[outcomeIdx] || held[outcomeIdx] === BigInt(0)) continue
      const result = await ex.trader.redeem({
        marketId,
        market: oc.marketAddress,
        outcomeToken: oc.outcomeToken,
        outcomeIdx,
        amount: held[outcomeIdx],
      })
      claimed += 1
      const hash = (result as { receipt?: { transactionHash?: string } })?.receipt?.transactionHash
      if (hash) hashes.push(hash)
    }
  }

  return { claimed, hashes }
}
