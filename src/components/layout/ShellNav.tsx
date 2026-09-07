'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { useWallet } from '@/hooks/useWallet'
import { useWalletStore } from '@/stores/walletStore'
import { cn } from '@/lib/utils'

const LINKS = [
  { href: '/', label: 'Floor' },
  { href: '/watch', label: 'Watch' },
  { href: '/setup', label: 'Setup' },
  { href: '/dashboard', label: 'Desk' },
  { href: '/roster', label: 'Roster' },
]

export function ShellNav() {
  const pathname = usePathname()
  const { address, isConnected, connect, disconnect } = useWallet()
  const { setWalletAddress, setWalletConnected } = useWalletStore()

  useEffect(() => {
    setWalletAddress(address)
    setWalletConnected(isConnected)
  }, [address, isConnected, setWalletAddress, setWalletConnected])

  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-[var(--line)] bg-[var(--paper)]/92 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="font-display text-[22px] text-[var(--ink)] leading-none">
          CHIME
        </Link>

        <nav className="hidden sm:flex items-center gap-5 text-[12px]" aria-label="Main">
          {LINKS.map((link) => {
            const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'hover:text-[var(--brass)]',
                  active ? 'text-[var(--brass)]' : 'text-[var(--mute)]'
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        {isConnected && address ? (
          <button
            type="button"
            onClick={disconnect}
            className="text-[11px] text-[var(--mute)] hover:text-[var(--ink)]"
          >
            {address.slice(0, 4)}…{address.slice(-4)}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void connect()}
            className="text-[12px] text-[var(--brass)] hover:underline"
          >
            Connect
          </button>
        )}
      </div>

      <nav className="sm:hidden flex justify-between px-4 pb-2 text-[11px] text-[var(--mute)]" aria-label="Mobile">
        {LINKS.map((link) => {
          const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href)
          return (
            <Link key={link.href} href={link.href} className={active ? 'text-[var(--brass)]' : ''}>
              {link.label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
