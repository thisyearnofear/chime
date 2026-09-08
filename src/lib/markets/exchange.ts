'use client'

import type { WalletClient } from 'viem'
import { getMarketNetwork } from './config'

export type MarketsExchange = {
  setSigner?: (opts: { walletClient?: WalletClient } | Record<string, never>) => void
  client: {
    listLiveBinaryMarkets?: (q: Record<string, unknown>) => Promise<unknown[]>
    listBinaryMarkets?: (q: Record<string, unknown>) => Promise<unknown[]>
    getMarketOnchain: (marketId: `0x${string}`) => Promise<{
      status: number
      expiry?: number | bigint
      pool?: string
      marketAddress?: string
      outcomeToken?: string
      yesId?: bigint
      noId?: bigint
      isResolved?: boolean
      isVoided?: boolean
      winningOutcome?: number
      quoteDecimals?: number
    }>
    getOutcomeBalance?: (q: Record<string, unknown>) => Promise<bigint>
    getPortfolio?: (
      account: string,
      opts?: { tradesLimit?: number; ordersLimit?: number }
    ) => Promise<{
      positions: Array<{
        outcomeIndex: number
        balance: string
        market: {
          id: string
          marketAddress: string
          asset: string
          status: string
          expiry: string
          intervalSec: string | null
          interval: string | null
          quoteDecimals: number
          winningOutcome?: number | null
          voided: boolean
        }
      }>
      trades: Array<{
        id: string
        fillPrice: string
        quantity: string
        timestamp: string
        txHash: string
        side: string | null
        market: {
          asset: string
          interval: string | null
          expiry: string | null
          quoteDecimals: number
        }
      }>
    }>
  }
  trader?: {
    faucet?: (opts?: { amount?: bigint }) => Promise<unknown>
    redeem?: (opts: Record<string, unknown>) => Promise<unknown>
    placeOrder?: (opts: Record<string, unknown>) => Promise<unknown>
  }
  loadMarkets: (reload?: boolean) => Promise<
    Record<
      string,
      {
        id: string
        symbol: string
        outcomes?: { symbol: string; label: string; index: number }[]
      }
    >
  >
  fetchOrderBook: (symbol: string, depth?: number) => Promise<{ bids: [number, number][]; asks: [number, number][] }>
  createOrder: (
    symbol: string,
    type: string,
    side: string,
    amount: number,
    price?: number,
    params?: Record<string, unknown>
  ) => Promise<{ info?: { receipt?: { transactionHash?: string } } }>
  amountToPrecision?: (symbol: string, amount: number) => string | number
  priceToPrecision?: (symbol: string, price: number) => string | number
  walletAddress?: string
}

let exchange: MarketsExchange | null = null

export async function getExchange(): Promise<MarketsExchange> {
  if (typeof window === 'undefined') {
    throw new Error('DreamDEX SDK is browser-only')
  }
  if (exchange) return exchange

  const net = getMarketNetwork()
  const sdk = await import('@somnia-chain/markets-sdk')
  let chain: unknown
  try {
    const chains = await import('@somnia-chain/markets-sdk/chains')
    chain = net.isMainnet ? chains.somniaMainnet : chains.somniaShannon
  } catch {
    chain = undefined
  }

  const addresses = net.isMainnet ? sdk.SOMNIA_MAINNET_ADDRESSES : sdk.SOMNIA_TESTNET_ADDRESSES
  const ctorArgs: Record<string, unknown> = {
    indexerUrl: net.indexerUrl,
    wsRpcUrl: net.wsRpcUrl,
    addresses,
  }
  if (chain) ctorArgs.chain = chain
  if (!net.isMainnet && 'SOMNIA_TESTNET_PRICE_FEED' in sdk) {
    ctorArgs.priceFeed = (sdk as { SOMNIA_TESTNET_PRICE_FEED?: unknown }).SOMNIA_TESTNET_PRICE_FEED
  }

  exchange = new sdk.SomniaMarkets(ctorArgs as never) as unknown as MarketsExchange
  return exchange
}

export async function bindWallet(walletClient: WalletClient): Promise<void> {
  const ex = await getExchange()
  if (typeof ex.setSigner === 'function') {
    ex.setSigner({ walletClient })
  }
}

export async function unbindWallet(): Promise<void> {
  if (!exchange) return
  if (typeof exchange.setSigner === 'function') {
    exchange.setSigner({})
  }
}
