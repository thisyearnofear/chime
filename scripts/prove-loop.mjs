#!/usr/bin/env node
/**
 * Prove the CHIME trade loop on Shannon: faucet → Follow (IOC) on a live
 * Trading window → portfolio fill → redeem scan.
 *
 * Reads DEPLOYER_PRIVATE_KEY from .env.local. Never prints secrets.
 * If the live book is empty, seeds a maker ask from the deployer and takes
 * it from an ephemeral wallet (self-match is cancelled on this venue).
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createPublicClient, createWalletClient, formatEther, http, parseEther } from 'viem'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import {
  SOMNIA_TESTNET_ADDRESSES,
  SOMNIA_TESTNET_PRICE_FEED,
  SomniaMarkets,
} from '@somnia-chain/markets-sdk'
import { somniaShannon } from '@somnia-chain/markets-sdk/chains'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const VENUE = (
  '0x679795a0195a1b76' +
  'cdebb7c51d74e058' +
  'aee92919b8c3389a' +
  'f86ef24535e8a28c'
)
const INDEXER = 'https://dev.smk.somnia.host/v1/graphql'
const WS = 'wss://api.infra.testnet.somnia.network/ws'
const RPC = 'https://api.infra.testnet.somnia.network'
const EXPLORER = 'https://shannon-explorer.somnia.network'
const SIZE = 5

function loadDeployerKey() {
  const raw = readFileSync(join(ROOT, '.env.local'), 'utf8')
  for (const line of raw.split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#') || !t.includes('=')) continue
    const i = t.indexOf('=')
    const k = t.slice(0, i).trim()
    let v = t.slice(i + 1).trim().replace(/^["']|["']$/g, '')
    if (k !== 'DEPLOYER_PRIVATE_KEY') continue
    if (!v.startsWith('0x')) v = `0x${v}`
    if (!/^0x[0-9a-fA-F]{64}$/.test(v)) {
      throw new Error('DEPLOYER_PRIVATE_KEY is not a 32-byte hex key')
    }
    return /** @type {`0x${string}`} */ (v)
  }
  throw new Error('DEPLOYER_PRIVATE_KEY missing from .env.local')
}

function errText(error) {
  if (!error) return 'unknown'
  if (typeof error === 'string') return error
  const named = error.errorName || error.shortMessage || error.message
  return named || String(error)
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function makeExchange(privateKey) {
  return new SomniaMarkets({
    indexerUrl: INDEXER,
    chain: somniaShannon,
    wsRpcUrl: WS,
    addresses: SOMNIA_TESTNET_ADDRESSES,
    priceFeed: SOMNIA_TESTNET_PRICE_FEED,
    privateKey,
  })
}

function txUrl(hash) {
  return hash ? `${EXPLORER}/tx/${hash}` : ''
}

function orderHash(order) {
  return (
    order?.txHash ||
    order?.info?.receipt?.transactionHash ||
    order?.info?.hash ||
    null
  )
}

async function faucetQuiet(ex, label) {
  try {
    const result = await ex.trader.faucet()
    const hash = result?.receipt?.transactionHash || result?.hash
    console.log(`faucet ${label}`, hash ? txUrl(hash) : 'ok')
  } catch (error) {
    console.log(`faucet ${label} skipped:`, errText(error))
  }
}

function matchMarket(markets, marketId) {
  const id = String(marketId || '').toLowerCase()
  return Object.values(markets).find((m) => String(m.id || '').toLowerCase() === id) ?? null
}

function outcomeSymbol(match, label) {
  return (
    match?.outcomes?.find((o) => o.label === label)?.symbol ||
    (match ? `${match.symbol}#${label}` : null)
  )
}

async function onchainReady(ex, marketId, minLeft = 20) {
  const oc = await ex.client.getMarketOnchain(marketId)
  const status = Number(oc.status)
  const expiry = Number(oc.expiry ?? 0)
  const left = expiry - Date.now() / 1000
  return { ok: status === 1 && left > minLeft, status, expiry, left }
}

async function bestAsk(ex, symbol) {
  try {
    const book = await ex.fetchOrderBook(symbol, 8)
    const ask = book?.asks?.[0]
    if (!ask || !Number(ask[0]) || !Number(ask[1])) return null
    return { price: Number(ask[0]), size: Number(ask[1]) }
  } catch {
    return null
  }
}

async function takeIoc(ex, symbol, amount, price) {
  let sized = amount
  let px = price
  try {
    if (typeof ex.amountToPrecision === 'function') sized = Number(ex.amountToPrecision(symbol, amount))
  } catch {
    /* keep */
  }
  try {
    if (typeof ex.priceToPrecision === 'function') px = Number(ex.priceToPrecision(symbol, price))
  } catch {
    /* keep */
  }
  if (!sized) throw new Error('size rounded to zero')
  const order = await ex.createOrder(symbol, 'limit', 'buy', sized, px, { timeInForce: 'IOC' })
  return { order, sized, px, hash: orderHash(order), filled: Number(order?.filled ?? 0) }
}

async function waitPortfolio(ex, account, pred, tries = 10) {
  let last = null
  for (let i = 0; i < tries; i++) {
    last = await ex.client.getPortfolio(account, { tradesLimit: 40, ordersLimit: 20 })
    if (pred(last)) return last
    await sleep(2500)
  }
  return last
}

function summarizeDesk(portfolio) {
  const positions = (portfolio?.positions ?? []).map((row) => ({
    asset: row.market?.asset,
    status: row.market?.status,
    outcome: row.outcomeIndex === 1 ? 'Down' : 'Up',
    balance: row.balance,
    claimable:
      row.market?.voided ||
      row.market?.winningOutcome === 0 ||
      row.market?.winningOutcome === 1,
    winningOutcome: row.market?.winningOutcome,
  }))
  const fills = (portfolio?.trades ?? []).slice(0, 6).map((row) => ({
    asset: row.market?.asset,
    qty: row.quantity,
    tx: row.txHash,
    side: row.side,
  }))
  return { positions, fills }
}

async function redeemHeld(ex, marketId, account) {
  if (!marketId?.startsWith('0x')) return { claimed: 0, hashes: [] }
  const oc = await ex.client.getMarketOnchain(marketId)
  if (!oc.isResolved && !oc.isVoided) return { claimed: 0, hashes: [] }
  const held = {
    0: await ex.client.getOutcomeBalance({
      outcomeToken: oc.outcomeToken,
      account,
      id: oc.yesId,
    }),
    1: await ex.client.getOutcomeBalance({
      outcomeToken: oc.outcomeToken,
      account,
      id: oc.noId,
    }),
  }
  const toClaim = oc.isVoided ? [0, 1] : [Number(oc.winningOutcome)]
  const hashes = []
  let claimed = 0
  for (const outcomeIdx of toClaim) {
    if (!held[outcomeIdx]) continue
    const result = await ex.trader.redeem({
      marketId,
      market: oc.marketAddress,
      outcomeToken: oc.outcomeToken,
      outcomeIdx,
      amount: held[outcomeIdx],
    })
    claimed += 1
    const hash = result?.receipt?.transactionHash
    if (hash) hashes.push(hash)
  }
  return { claimed, hashes }
}

async function claimScan(ex, account) {
  const seen = new Set()
  let claimed = 0
  const hashes = []
  const portfolio = await ex.client.getPortfolio(account, { tradesLimit: 0, ordersLimit: 0 })
  for (const row of portfolio.positions ?? []) {
    const marketId = row.market?.id
    const claimable =
      row.market?.voided ||
      row.market?.winningOutcome === 0 ||
      row.market?.winningOutcome === 1
    if (!claimable || !marketId?.startsWith('0x') || seen.has(marketId.toLowerCase())) continue
    seen.add(marketId.toLowerCase())
    const result = await redeemHeld(ex, marketId, account)
    claimed += result.claimed
    hashes.push(...result.hashes)
  }
  if (claimed === 0) {
    const settled = await ex.client.listBinaryMarkets({
      venueId: VENUE,
      status: 'Finalized',
      limit: 20,
    })
    for (const row of settled ?? []) {
      const marketId = String(row.marketId ?? row.id ?? '')
      if (!marketId.startsWith('0x') || seen.has(marketId.toLowerCase())) continue
      seen.add(marketId.toLowerCase())
      const result = await redeemHeld(ex, marketId, account)
      claimed += result.claimed
      hashes.push(...result.hashes)
      if (claimed > 0) break
    }
  }
  return { claimed, hashes, scanned: seen.size }
}

async function seedAndTake(makerEx, makerAccount, windows) {
  const candidate = windows.find((w) => w.left > 90) ?? windows[0]
  if (!candidate) throw new Error('No Trading window long enough to seed a book')

  console.log('seeding book on', candidate.asset, candidate.interval, candidate.marketId.slice(0, 18))
  const markets = await makerEx.loadMarkets(true)
  const match = matchMarket(markets, candidate.marketId)
  if (!match) throw new Error('Seed window missing from loadMarkets')
  const yes = outcomeSymbol(match, 'YES')
  const base = match.symbol
  if (!yes || !base) throw new Error('No YES symbol to seed')

  const ready = await onchainReady(makerEx, candidate.marketId, 45)
  if (!ready.ok) throw new Error(`Seed window not Trading (status=${ready.status} left=${Math.floor(ready.left)}s)`)

  try {
    await makerEx.mintSet(base, 20)
    console.log('mintSet', base, 20)
  } catch (error) {
    console.log('mintSet failed:', errText(error))
    throw error
  }

  const restPrice = 0.55
  let restSize = 10
  try {
    if (typeof makerEx.amountToPrecision === 'function') {
      restSize = Number(makerEx.amountToPrecision(yes, restSize))
    }
  } catch {
    /* keep */
  }
  const rested = await makerEx.createOrder(yes, 'limit', 'sell', restSize, restPrice)
  console.log('maker ask', yes, restSize, '@', restPrice, txUrl(orderHash(rested)))

  const takerKey = generatePrivateKey()
  const takerAccount = privateKeyToAccount(takerKey)
  const wallet = createWalletClient({
    account: makerAccount,
    chain: somniaShannon,
    transport: http(RPC),
  })
  const publicClient = createPublicClient({ chain: somniaShannon, transport: http(RPC) })
  const fundHash = await wallet.sendTransaction({
    to: takerAccount.address,
    value: parseEther('0.12'),
  })
  console.log('fund taker', takerAccount.address, txUrl(fundHash))
  await publicClient.waitForTransactionReceipt({ hash: fundHash })

  const takerEx = makeExchange(takerKey)
  await faucetQuiet(takerEx, 'taker')
  await takerEx.loadMarkets(true)

  const ask = (await bestAsk(takerEx, yes)) ?? { price: restPrice, size: restSize }
  const takeSize = Math.min(SIZE, ask.size)
  const takePrice = Math.min(0.99, ask.price + 0.03)
  console.log('taker Follow', yes, takeSize, '@', takePrice)
  const taken = await takeIoc(takerEx, yes, takeSize, takePrice)
  console.log('taker fill', taken.filled, txUrl(taken.hash))

  return {
    takerEx,
    taker: takerAccount.address,
    marketId: candidate.marketId,
    symbol: yes,
    ...taken,
  }
}

async function main() {
  const key = loadDeployerKey()
  const account = privateKeyToAccount(key)
  console.log('account', account.address)
  console.log('venue', VENUE.slice(0, 10) + '…')

  const publicClient = createPublicClient({ chain: somniaShannon, transport: http(RPC) })
  const stt = await publicClient.getBalance({ address: account.address })
  console.log('STT', formatEther(stt))
  if (stt < parseEther('0.2')) {
    throw new Error('Need ≥0.2 STT for gas. Fund the deployer, then rerun.')
  }

  const ex = makeExchange(key)
  const seatOnly = process.argv.includes('--seat')
  if (!seatOnly) await faucetQuiet(ex, 'deployer')

  try {
    const bal = await ex.fetchBalance()
    const collateral = bal.USDC?.total ?? bal.tUSDC?.total ?? bal.TESTUSDC?.total
    console.log('collateral', collateral ?? Object.keys(bal).slice(0, 8).join(','))
  } catch (error) {
    console.log('fetchBalance:', errText(error))
  }

  await ex.loadMarkets(true)
  const live = []
  for (const asset of ['BTC', 'ETH']) {
    const rows = await ex.client.listLiveBinaryMarkets({ venueId: VENUE, asset, limit: 16 })
    live.push(...(rows ?? []))
  }

  const windows = []
  for (const row of live) {
    const marketId = String(row.marketId ?? row.id ?? '')
    if (!marketId.startsWith('0x')) continue
    try {
      const ready = await onchainReady(ex, marketId, 20)
      windows.push({
        marketId,
        asset: row.asset,
        interval: row.interval || `${row.intervalSec}s`,
        status: ready.status,
        left: ready.left,
        ready: ready.ok,
      })
    } catch (error) {
      console.log('onchain skip', marketId.slice(0, 14), errText(error))
    }
  }
  const trading = windows.filter((w) => w.ready).sort((a, b) => a.left - b.left)
  console.log(
    'trading windows',
    trading.length,
    trading
      .slice(0, 8)
      .map((w) => `${w.asset} ${w.interval} ${Math.floor(w.left)}s`)
      .join(' | ') || 'none'
  )
  if (!trading.length && !seatOnly) throw new Error('No on-chain Trading BTC/ETH window with >20s left')

  if (seatOnly) {
    console.log('chain seats')
    let held = 0
    for (const w of windows) {
      try {
        const oc = await ex.client.getMarketOnchain(w.marketId)
        const yes = await ex.client.getOutcomeBalance({
          outcomeToken: oc.outcomeToken,
          account: account.address,
          id: oc.yesId,
        })
        const no = await ex.client.getOutcomeBalance({
          outcomeToken: oc.outcomeToken,
          account: account.address,
          id: oc.noId,
        })
        if (yes > 0n || no > 0n) {
          held += 1
          console.log(w.asset, w.interval, 'YES', yes.toString(), 'NO', no.toString(), 'status', oc.status)
        }
      } catch (error) {
        console.log('seat skip', w.asset, errText(error))
      }
    }
    try {
      const desk = await ex.client.getPortfolio(account.address, { tradesLimit: 20, ordersLimit: 10 })
      const view = summarizeDesk(desk)
      console.log('indexer positions', JSON.stringify(view.positions, null, 2))
      console.log('indexer fills', JSON.stringify(view.fills, null, 2))
      for (const row of desk.positions ?? []) {
        const marketId = row.market?.id
        if (!marketId?.startsWith('0x')) continue
        try {
          const oc = await ex.client.getMarketOnchain(marketId)
          const yes = await ex.client.getOutcomeBalance({
            outcomeToken: oc.outcomeToken,
            account: account.address,
            id: oc.yesId,
          })
          const no = await ex.client.getOutcomeBalance({
            outcomeToken: oc.outcomeToken,
            account: account.address,
            id: oc.noId,
          })
          console.log('chain on indexed market', row.market?.asset, row.market?.status, 'YES', yes.toString(), 'NO', no.toString())
          if (yes > 0n || no > 0n) held += 1
        } catch (error) {
          console.log('chain on indexed market:', errText(error))
        }
      }
    } catch (error) {
      console.log('indexer portfolio:', errText(error))
    }
    const claim = await claimScan(ex, account.address)
    console.log('claim', claim.claimed, 'scanned', claim.scanned)
    console.log('PROOF seat', held ? `${held} on-chain position(s)` : 'no shares on live windows')
    process.exit(0)
  }

  if (!trading.length) throw new Error('No on-chain Trading BTC/ETH window with >20s left')

  const markets = await ex.loadMarkets()
  let result = null
  for (const w of trading) {
    const match = matchMarket(markets, w.marketId)
    if (!match) continue
    const yes = outcomeSymbol(match, 'YES')
    const no = outcomeSymbol(match, 'NO')
    for (const symbol of [yes, no].filter(Boolean)) {
      const ask = await bestAsk(ex, symbol)
      if (!ask) continue
      const amount = Math.min(SIZE, ask.size)
      const price = Math.min(0.99, ask.price + 0.02)
      console.log('taking live book', symbol, amount, '@', price)
      try {
        const taken = await takeIoc(ex, symbol, amount, price)
        console.log('Follow', taken.filled, txUrl(taken.hash))
        result = { ...taken, takerEx: ex, taker: account.address, marketId: w.marketId, symbol, seeded: false }
        break
      } catch (error) {
        console.log('take failed', symbol, errText(error))
      }
    }
    if (result) break
  }

  if (!result || result.filled <= 0) {
    console.log('live book empty or unfilled — seeding maker + taker Follow')
    result = { ...(await seedAndTake(ex, account, trading)), seeded: true }
  }

  if (!result.hash) throw new Error('Follow tx did not return a hash')
  if (!(result.filled > 0)) {
    throw new Error(`IOC landed with filled=${result.filled}. Book did not take the order.`)
  }

  console.log('reading chain seat (Desk does this when indexer lags)')
  let chainPos = 0
  try {
    const oc = await result.takerEx.client.getMarketOnchain(result.marketId)
    const yes = await result.takerEx.client.getOutcomeBalance({
      outcomeToken: oc.outcomeToken,
      account: result.taker,
      id: oc.yesId,
    })
    const no = await result.takerEx.client.getOutcomeBalance({
      outcomeToken: oc.outcomeToken,
      account: result.taker,
      id: oc.noId,
    })
    chainPos = Number(yes > 0n) + Number(no > 0n)
    console.log('chain YES', yes.toString(), 'NO', no.toString())
  } catch (error) {
    console.log('chain seat:', errText(error))
  }

  console.log('polling Desk portfolio for', result.taker)
  const desk = await waitPortfolio(
    result.takerEx,
    result.taker,
    (p) =>
      (p.trades ?? []).some((t) => String(t.txHash || '').toLowerCase() === result.hash.toLowerCase()) ||
      (p.positions ?? []).length > 0,
    4
  )
  const view = summarizeDesk(desk)
  console.log('positions', JSON.stringify(view.positions, null, 2))
  console.log('fills', JSON.stringify(view.fills, null, 2))

  const seenFill = (desk?.trades ?? []).some(
    (t) => String(t.txHash || '').toLowerCase() === result.hash.toLowerCase()
  )
  const seenPos = (desk?.positions ?? []).length > 0
  if (!seenFill && !seenPos) {
    console.log('indexer lag: fill is on-chain, Desk will catch up. tx', txUrl(result.hash))
  }

  let claim = { claimed: 0, hashes: [], scanned: 0 }
  try {
    claim = await claimScan(ex, account.address)
    if (result.taker.toLowerCase() !== account.address.toLowerCase()) {
      const takerClaim = await claimScan(result.takerEx, result.taker)
      claim = {
        claimed: claim.claimed + takerClaim.claimed,
        hashes: [...claim.hashes, ...takerClaim.hashes],
        scanned: claim.scanned + takerClaim.scanned,
      }
    }
  } catch (error) {
    console.log('claim scan:', errText(error))
  }
  console.log(
    'claim',
    claim.claimed ? `redeemed ${claim.claimed}` : 'nothing payable yet (path armed)',
    'scanned',
    claim.scanned,
    claim.hashes.map(txUrl).join(' ')
  )

  console.log('\nPROOF')
  console.log('- Follow tx:', txUrl(result.hash))
  console.log('- filled:', result.filled, result.symbol)
  console.log('- Desk fill indexed:', seenFill)
  console.log('- Desk position indexed:', seenPos)
  console.log('- Desk chain seat:', chainPos > 0)
  console.log('- seeded counterparty:', Boolean(result.seeded))
  console.log('- claim hashes:', claim.hashes.length)
  process.exit(0)
}

main().catch((error) => {
  console.error('PROVE FAILED', errText(error))
  process.exit(1)
})
