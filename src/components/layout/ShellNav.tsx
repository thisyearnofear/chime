'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useWallet } from '@/hooks/useWallet'
import { cn } from '@/lib/utils'

const PRIMARY = [
  { href: '/', label: 'Floor' },
  { href: '/watch', label: 'Watch' },
]

const MORE = [
  { href: '/setup', label: 'Setup' },
  { href: '/dashboard', label: 'Desk' },
  { href: '/roster', label: 'Roster' },
]

function MoreMenu({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)
  const moreActive = MORE.some((link) => pathname.startsWith(link.href))

  useEffect(() => {
    if (!open) return
    const onPointer = (event: MouseEvent) => {
      if (!moreRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="relative" ref={moreRef}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'hover:text-[var(--brass)]',
          moreActive || open ? 'text-[var(--brass)]' : 'text-[var(--mute)]'
        )}
      >
        More
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 min-w-[9rem] border border-[var(--line)] bg-[var(--paper)] py-2 z-50"
        >
          {MORE.map((link) => {
            const active = pathname.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={cn(
                  'block px-3 py-2 text-[12px] hover:text-[var(--brass)]',
                  active ? 'text-[var(--brass)]' : 'text-[var(--mute)]'
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function ShellNav() {
  const pathname = usePathname()
  const { address, isConnected, connect, disconnect } = useWallet()

  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-[var(--line)] bg-[var(--paper)]/92 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between gap-3">
        <Link href="/" className="chime-mark font-display text-[22px] text-[var(--ink)] leading-none">
          CHIME
        </Link>

        <nav className="flex items-center gap-4 text-[12px]" aria-label="Main">
          {PRIMARY.map((link) => {
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

          <MoreMenu key={pathname} pathname={pathname} />
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
    </header>
  )
}
