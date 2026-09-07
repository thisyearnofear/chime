export type NetworkName = 'testnet' | 'mainnet'

export interface MarketNetwork {
  name: string
  chainId: number
  isMainnet: boolean
  rpcUrl: string
  wsRpcUrl: string
  indexerUrl: string
  blockExplorer: string
  nativeCurrency: { name: string; symbol: string; decimals: number }
  collateralSymbol: string
  collateralDecimals: number
  venueId: `0x${string}`
  faucet: boolean
}

const TESTNET: MarketNetwork = {
  name: 'Somnia Testnet',
  chainId: 50312,
  isMainnet: false,
  rpcUrl: 'https://api.infra.testnet.somnia.network',
  wsRpcUrl: 'wss://api.infra.testnet.somnia.network/ws',
  indexerUrl: 'https://dev.smk.somnia.host/v1/graphql',
  blockExplorer: 'https://shannon-explorer.somnia.network',
  nativeCurrency: { name: 'STT', symbol: 'STT', decimals: 18 },
  collateralSymbol: 'tUSDC',
  collateralDecimals: 6,
  venueId: ('0x679795a0195a1b76' +
    'cdebb7c51d74e058' +
    'aee92919b8c3389a' +
    'f86ef24535e8a28c') as `0x${string}`,
  faucet: true,
}

const MAINNET: MarketNetwork = {
  name: 'Somnia Mainnet',
  chainId: 5031,
  isMainnet: true,
  rpcUrl: 'https://api.infra.mainnet.somnia.network',
  wsRpcUrl: 'wss://api.infra.mainnet.somnia.network/ws',
  indexerUrl: 'https://prd.smk.somnia.host/v1/graphql',
  blockExplorer: 'https://explorer.somnia.network',
  nativeCurrency: { name: 'SOMI', symbol: 'SOMI', decimals: 18 },
  collateralSymbol: 'USDso',
  collateralDecimals: 18,
  venueId: ('0x458b30c2d72bfd2c' +
    '6317304a4594ecba' +
    'fe5f729d3111b65f' +
    'dc3a33bd48e5432d') as `0x${string}`,
  faucet: false,
}

export function getActiveNetworkName(): NetworkName {
  return process.env.NEXT_PUBLIC_NETWORK === 'mainnet' ? 'mainnet' : 'testnet'
}

export function getMarketNetwork(): MarketNetwork {
  const net = getActiveNetworkName() === 'mainnet' ? { ...MAINNET } : { ...TESTNET }
  const venue = process.env.NEXT_PUBLIC_VENUE_ID
  if (venue?.startsWith('0x') && venue.length === 66) {
    net.venueId = venue as `0x${string}`
  }
  return net
}

/** Wallet add/switch payload — same shape the old addresses helper exposed. */
export function getNetworkConfig() {
  const net = getMarketNetwork()
  return {
    chainId: net.chainId,
    name: net.name,
    rpcUrl: net.rpcUrl,
    wsUrl: net.wsRpcUrl,
    blockExplorer: `${net.blockExplorer}/`,
    nativeCurrency: net.nativeCurrency,
  }
}

export const SERIES_OPTIONS: { asset: 'BTC' | 'ETH'; intervalSec: 900 | 3600 | 14400 | 86400; label: string }[] = [
  { asset: 'BTC', intervalSec: 14400, label: 'BTC 4h' },
  { asset: 'ETH', intervalSec: 14400, label: 'ETH 4h' },
  { asset: 'BTC', intervalSec: 86400, label: 'BTC 24h' },
  { asset: 'ETH', intervalSec: 86400, label: 'ETH 24h' },
  { asset: 'BTC', intervalSec: 3600, label: 'BTC 1h' },
  { asset: 'ETH', intervalSec: 3600, label: 'ETH 1h' },
  { asset: 'BTC', intervalSec: 900, label: 'BTC 15m' },
  { asset: 'ETH', intervalSec: 900, label: 'ETH 15m' },
]
