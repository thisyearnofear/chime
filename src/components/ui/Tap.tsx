'use client'

import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

type Tone = 'brass' | 'ghost' | 'line'

export const Tap = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone }
>(function Tap({ className, tone = 'line', disabled, ...props }, ref) {
  return (
    <button
      ref={ref}
      disabled={disabled}
      className={cn(
        'h-11 px-5 text-[13px] font-medium transition-colors disabled:opacity-35 disabled:pointer-events-none',
        tone === 'brass' && 'bg-[var(--brass)] text-[var(--paper)] hover:brightness-110',
        tone === 'ghost' && 'text-[var(--ink)] hover:text-[var(--brass)]',
        tone === 'line' &&
          'border border-[var(--line)] text-[var(--ink)] hover:border-[var(--slate)] hover:text-[var(--ink)]',
        className
      )}
      {...props}
    />
  )
})
