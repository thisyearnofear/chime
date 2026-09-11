#!/usr/bin/env node
/**
 * CHIME house agent - one autonomous process trading the floor's own seat.
 * No Bot Kit, no new deps. Reuses markets-sdk + IOC pricing from trade.ts.
 * Each pass: live window -> seat[0] side -> IOC -> claimScan.
 * Key: HOUSE_PRIVATE_KEY else DEPLOYER_PRIVATE_KEY in .env.local.
 * Usage: node scripts/house-agent.mjs --once [--base URL]
 *        node scripts/house-agent.mjs --loop [--base URL]
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SOMNIA_TESTNET_ADDRESSES, SOMNIA_TESTNET_PRICE_FEED, SomniaMarkets } from '@somnia-chain/markets-sdk'
import { somniaShannon } from '@somnia-chain/markets-sdk/chains'
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const VENUE = '0x679795a0195a1b76' + 'cdebb7c51d74e058' + 'aee92919b8c3389a' + 'f86ef24535e8a28c'
const INDEXER = 'https://dev.smk.somnia.host/v1/graphql'
const WS = 'wss://api.infra.testnet.somnia.network/ws'
const EXPLORER = 'https://shannon-explorer.somnia.network'
const SIZE = 2
const MIN_LEFT_SEC = 60
function loadKey(name) {
  const raw = readFileSync(join(ROOT, '.env.local'), 'utf8')
  for (const line of raw.split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#') || !t.includes('=')) continue
    const i = t.indexOf('=')
    if (t.slice(0, i).trim() !== name) continue
    let v = t.slice(i + 1).trim().replace(/^[\"']|[\"']$/g, '')
    if (!v) return null
    if (!v.startsWith('0x')) v = '0x' + v
    if (!/^0x[0-9a-fA-F]{64}$/.test(v)) throw new Error(name + ' is not 32-byte hex')
    return v
  }
  return null
}
function errText(e) { if (!e) return 'unknown'; if (typeof e === 'string') return e; return e.errorName || e.shortMessage || e.message || String(e) }
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)) }
function txUrl(h) { return h ? EXPLORER + '/tx/' + h : '' }
async function api(base, path, init) {
  const res = await fetch(base + path, { cache: 'no-store', ...init })
  if (!res.ok) throw new Error('API ' + path + ' -> HTTP ' + res.status)
  return res.json()
}
async function pickWindow(base) {
  const rows = await api(base, '/api/markets/live')
  const now = Date.now() / 1000
  return (Array.isArray(rows) ? rows : [])
    .filter((w) => !w.demo && String(w.marketId || '').startsWith('0x'))
    .map((w) => ({ ...w, left: Number(w.expiry) - now }))
    .filter((w) => w.left > MIN_LEFT_SEC)
    .sort((a, b) => a.left - b.left)[0] ?? null
}
async function seatSide(base, w) {
  let d = null
  try { d = await api(base, '/api/agents/window?marketId=' + encodeURIComponent(w.marketId)) } catch { d = null }
  if (!d || !d.seats?.[0]) {
    d = await api(base, '/api/agents/window', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ marketId: w.marketId, asset: w.asset, intervalSec: w.intervalSec, expiry: w.expiry, secondsLeft: Math.max(0, w.expiry - Date.now() / 1000), bestBid: w.bestBid ?? null, bestAsk: w.bestAsk ?? null }) })
  }
  return { side: d.seats[0].side, label: d.seats[0].label }
}
async function alreadyHeld(ex, marketId, account) {
  const oc = await ex.client.getMarketOnchain(marketId)
  for (const id of [oc.yesId, oc.noId]) {
    const bal = await ex.client.getOutcomeBalance({ outcomeToken: oc.outcomeToken, account, id })
    if (bal && bal !== BigInt(0)) return true
  }
  return false
}
async function followSeat(ex, w, side) {
  const oc = await ex.client.getMarketOnchain(w.marketId)
  if (Number(oc.status) !== 1) throw new Error('window status=' + oc.status + ' not Trading')
  const left = Number(oc.expiry) - Date.now() / 1000
  if (left < 15) throw new Error('only ' + Math.floor(left) + 's left')
  const touch = side === 'up' ? (w.bestAsk ?? 0.55) : (w.bestBid != null ? 1 - w.bestBid : 0.55)
  let price = Math.min(0.999, Math.max(0.001, Math.round((touch + 0.02) * 1000) / 1000))
  let amount = SIZE
  await ex.loadMarkets(true)
  const markets = await ex.loadMarkets()
  const match = Object.values(markets).find((m) => String(m.id || '').toLowerCase() === String(w.marketId).toLowerCase())
  const outcome = side === 'up' ? 'YES' : 'NO'
  const refs = [...new Set([side === 'up' ? w.upSymbol : w.downSymbol, match?.outcomes?.find((o) => o.label === outcome)?.symbol, match ? match.symbol + '#' + outcome : null].filter(Boolean))]
  if (!refs.length) throw new Error('no tradable symbol')
  try { price = Number(ex.priceToPrecision(refs[0], price)) } catch {}
  try { amount = Number(ex.amountToPrecision(refs[0], amount)) } catch {}
  let lastErr = null
  for (const ref of refs) {
    try {
      const order = await ex.createOrder(ref, 'limit', 'buy', amount, price, { timeInForce: 'IOC' })
      const filled = Number(order?.filled ?? NaN)
      const hash = order?.txHash ?? order?.info?.receipt?.transactionHash
      if (Number.isFinite(filled) && filled <= 0) throw new Error('NO_FILL')
      return { filled: Number.isFinite(filled) ? filled : amount, hash, symbol: ref, price }
    } catch (e) { lastErr = e }
  }
  throw lastErr ?? new Error('order failed')
}
async function claimScan(ex, account) {
  let claimed = 0; const hashes = []; const seen = new Set()
  const take = async (marketId) => {
    const key = String(marketId).toLowerCase()
    if (!marketId?.startsWith('0x') || seen.has(key)) return
    seen.add(key)
    const oc = await ex.client.getMarketOnchain(marketId)
    if (!oc.isResolved && !oc.isVoided) return
    const held = { 0: await ex.client.getOutcomeBalance({ outcomeToken: oc.outcomeToken, account, id: oc.yesId }), 1: await ex.client.getOutcomeBalance({ outcomeToken: oc.outcomeToken, account, id: oc.noId }) }
    for (const idx of (oc.isVoided ? [0, 1] : [Number(oc.winningOutcome)])) {
      if (!held[idx] || held[idx] === BigInt(0)) continue
      const r = await ex.trader.redeem({ marketId, market: oc.marketAddress, outcomeToken: oc.outcomeToken, outcomeIdx: idx, amount: held[idx] })
      claimed += 1
      if (r?.receipt?.transactionHash) hashes.push(r.receipt.transactionHash)
    }
  }
  const pf = await ex.client.getPortfolio(account, { tradesLimit: 0, ordersLimit: 0 })
  for (const row of pf.positions ?? []) { const m = row.market; if (m?.voided || m?.winningOutcome === 0 || m?.winningOutcome === 1) await take(m.id) }
  if (claimed === 0) {
    const settled = await ex.client.listBinaryMarkets({ venueId: VENUE, status: 'Finalized', limit: 20 })
    for (const row of settled ?? []) { await take(String(row.marketId ?? row.id ?? '')); if (claimed > 0) break }
  }
  return { claimed, hashes }
}
async function pass(ex, account, base) {
  const w = await pickWindow(base)
  if (!w) { console.log('house: no open window >60s left - idle'); return }
  console.log('house: ' + w.asset + ' ' + w.intervalSec + 's ' + String(w.marketId).slice(0, 18) + '.. left ' + Math.floor(w.left) + 's')
  if (await alreadyHeld(ex, w.marketId, account)) {
    console.log('house: already holding - skip trade, scan claims')
  } else {
    const s = await seatSide(base, w)
    console.log('house: seat[0] ' + s.label + ' -> ' + s.side)
    try {
      const f = await followSeat(ex, w, s.side)
      console.log('house: filled ' + f.filled + ' ' + f.symbol + ' @ ' + f.price + ' ' + txUrl(f.hash))
    } catch (e) { console.log('house: trade skipped:', errText(e)) }
  }
  try {
    const c = await claimScan(ex, account)
    console.log('house: claim', c.claimed ? 'redeemed ' + c.claimed : 'nothing payable', c.hashes.map(txUrl).join(' '))
  } catch (e) { console.log('house: claim scan:', errText(e)) }
}
async function main() {
  const args = new Set(process.argv.slice(2))
  const bi = process.argv.indexOf('--base')
  const base = bi >= 0 ? process.argv[bi + 1] : 'https://usechime.netlify.app'
  const key = loadKey('HOUSE_PRIVATE_KEY') ?? loadKey('DEPLOYER_PRIVATE_KEY')
  if (!key) throw new Error('Set HOUSE_PRIVATE_KEY (or DEPLOYER_PRIVATE_KEY) in .env.local')
  const ex = new SomniaMarkets({ indexerUrl: INDEXER, chain: somniaShannon, wsRpcUrl: WS, addresses: SOMNIA_TESTNET_ADDRESSES, priceFeed: SOMNIA_TESTNET_PRICE_FEED, privateKey: key })
  try { await ex.trader?.faucet?.() } catch {}
  const account = ex.walletAddress ?? ex.trader?.address ?? 'house'
  console.log('house account', account)
  await pass(ex, account, base)
  if (args.has('--loop')) { for (;;) { await sleep(60000); try { await pass(ex, account, base) } catch (e) { console.log('house pass failed:', errText(e)) } } }
  process.exit(0)
}
main().catch((e) => { console.error('HOUSE FAILED', errText(e)); process.exit(1) })
