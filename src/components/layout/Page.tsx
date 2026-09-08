import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mx-auto max-w-6xl px-4 py-6 md:py-10', className)}>{children}</div>
}

export function PageHead({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <header className="mb-6">
      <h1 className="text-[18px] font-medium text-[var(--ink)]">{title}</h1>
      {children ? <p className="mt-2 text-[12px] text-[var(--mute)] max-w-lg">{children}</p> : null}
    </header>
  )
}
