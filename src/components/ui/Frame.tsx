'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Frame({
  label,
  meta,
  children,
  className,
}: {
  label?: string
  meta?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('relative border border-[var(--line)] bg-[var(--paper)]', className)}>
      <span className="tick tick-tl" aria-hidden />
      <span className="tick tick-tr" aria-hidden />
      <span className="tick tick-bl" aria-hidden />
      <span className="tick tick-br" aria-hidden />
      {(label || meta) && (
        <div className="flex items-baseline justify-between gap-4 px-4 py-2 border-b border-[var(--line)] text-[11px] text-[var(--mute)]">
          {label ? <span className="text-[var(--ink)]">{label}</span> : <span />}
          {meta ? <span className="text-right">{meta}</span> : null}
        </div>
      )}
      <div className="p-[var(--pad)]">{children}</div>
    </section>
  )
}
