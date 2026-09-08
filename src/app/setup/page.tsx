'use client'

import { useEffect, useState } from 'react'
import { PERSONALITY_PRESETS, getPersonality } from '@/lib/personality-presets'
import { useAgentStore } from '@/stores/agentStore'
import { useWallet } from '@/hooks/useWallet'
import { useExchange } from '@/hooks/useExchange'
import { Tap } from '@/components/ui/Tap'
import { Frame } from '@/components/ui/Frame'
import { Page, PageHead } from '@/components/layout/Page'
import { getMarketNetwork } from '@/lib/markets/config'
import { faucetCollateral, TradeError } from '@/lib/markets/trade'
import { useAddToast } from '@/components/unified/UnifiedToast'
import { cn } from '@/lib/utils'

export default function SetupPage() {
  const { allegiance, defaultSize, setAllegiance, setDefaultSize } = useAgentStore()
  const { isConnected, connect, address, networkMetrics, switchToSomnia } = useWallet()
  const { rebind } = useExchange()
  const addToast = useAddToast()
  const net = getMarketNetwork()
  const [size, setSize] = useState(() => {
    if (typeof window === 'undefined') return String(defaultSize)
    const stored = Number(localStorage.getItem('chime:size'))
    return Number.isFinite(stored) && stored > 0 ? String(stored) : String(defaultSize)
  })
  const [fauceting, setFauceting] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('chime:allegiance')
    const storedSize = Number(localStorage.getItem('chime:size'))
    if (saved) setAllegiance(getPersonality(saved).label)
    if (Number.isFinite(storedSize) && storedSize > 0) setDefaultSize(storedSize)
  }, [setAllegiance, setDefaultSize])

  const save = () => {
    const n = Number(size)
    if (!Number.isFinite(n) || n <= 0) {
      addToast({ type: 'error', message: 'Size must be a positive number.' })
      return
    }
    setDefaultSize(n)
    addToast({ type: 'success', message: `Allegiance ${allegiance}, size ${n} ${net.collateralSymbol}.` })
  }

  const onFaucet = async () => {
    if (!isConnected) {
      await connect()
      return
    }
    if (!networkMetrics.isOnSomnia) {
      await switchToSomnia()
      return
    }
    setFauceting(true)
    try {
      await rebind()
      await faucetCollateral()
      addToast({ type: 'success', message: `${net.collateralSymbol} faucet sent.` })
    } catch (error) {
      const message = error instanceof TradeError || error instanceof Error ? error.message : 'Faucet failed'
      addToast({ type: 'error', message })
    } finally {
      setFauceting(false)
    }
  }

  return (
    <Page>
      <PageHead title="Setup">Pick who you ride with. Size is set here so the floor stays two taps.</PageHead>

      <div className="max-w-3xl">
      <Frame label="ALLEGIANCE" meta={`${net.collateralSymbol} · ${net.name}`}>
      <div className="flex flex-col">
        {PERSONALITY_PRESETS.map((p) => {
          const selected = allegiance === p.label
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => setAllegiance(p.label)}
              aria-pressed={selected}
              className={cn(
                'text-left py-4 border-t border-[var(--line)] first:border-t-0 flex items-baseline justify-between gap-4',
                selected ? 'text-[var(--brass)]' : 'text-[var(--ink)]'
              )}
            >
              <span>
                <span className="text-[15px]">{p.label}</span>
                <span className="block text-[12px] text-[var(--mute)] mt-1">{p.tagline}</span>
              </span>
              {selected && <span className="text-[11px] text-[var(--brass)] shrink-0">on</span>}
            </button>
          )
        })}
      </div>

      <label className="block mt-10 text-[12px] text-[var(--mute)]">
        Default size ({net.collateralSymbol})
        <input
          value={size}
          onChange={(e) => setSize(e.target.value)}
          className="mt-2 w-full h-11 bg-transparent border border-[var(--line)] px-3 text-[var(--ink)]"
          inputMode="decimal"
        />
      </label>
      <p className="mt-4 text-[12px] text-[var(--mute)]">
        {address ? `${address.slice(0, 6)}…${address.slice(-4)}` : 'Wallet not connected'} · {net.name}
      </p>
      <div className="flex flex-wrap gap-3 mt-6">
        <Tap tone="brass" onClick={save}>
          Save
        </Tap>
        {net.faucet && (
          <Tap onClick={() => void onFaucet()} disabled={fauceting}>
            {fauceting ? 'Faucet…' : `Faucet ${net.collateralSymbol}`}
          </Tap>
        )}
        {!isConnected && (
          <Tap onClick={() => void connect()}>
            Connect wallet
          </Tap>
        )}
      </div>
      </Frame>
      </div>
    </Page>
  )
}
