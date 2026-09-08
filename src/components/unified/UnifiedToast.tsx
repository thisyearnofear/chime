'use client'

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

type ToastTone = 'success' | 'error' | 'warning' | 'info'

interface ToastData {
  id: string
  tone: ToastTone
  message: ReactNode
  duration: number
}

interface ToastInput {
  type: ToastTone
  message: ReactNode
  title?: string
  duration?: number
  action?: never
}

interface ToastContextType {
  toasts: ToastData[]
  addToast: (toast: ToastInput) => string
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast(): ToastContextType {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return Math.random().toString(36).slice(2, 11)
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback<ToastContextType['addToast']>(
    (toast) => {
      const id = newId()
      const duration = toast.duration ?? (toast.type === 'error' ? 6000 : 4000)
      setToasts((prev) => [...prev, { id, tone: toast.type, message: toast.message, duration }])
      return id
    },
    []
  )

  useEffect(() => {
    if (toasts.length === 0) return
    const timers = toasts.map((t) => setTimeout(() => removeToast(t.id), t.duration))
    return () => timers.forEach(clearTimeout)
  }, [toasts, removeToast])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, onRemove }: { toast: ToastData; onRemove: () => void }) {
  const accent =
    toast.tone === 'success'
      ? 'border-l-[var(--brass)]'
      : toast.tone === 'error'
        ? 'border-l-[var(--halt)]'
        : toast.tone === 'warning'
          ? 'border-l-[var(--slate)]'
          : 'border-l-[var(--line)]'
  return (
    <div
      role="status"
      className={cn(
        'border border-[var(--line)] border-l-2 bg-[var(--paper)] px-4 py-3 text-[12px] text-[var(--ink)] max-w-sm',
        accent
      )}
    >
      <p>{toast.message}</p>
      <button
        type="button"
        onClick={onRemove}
        className="mt-2 text-[11px] text-[var(--mute)] hover:text-[var(--ink)]"
        aria-label="Dismiss"
      >
        dismiss
      </button>
    </div>
  )
}

function ToastContainer() {
  const { toasts, removeToast } = useToast()
  return (
    <div className="fixed top-14 right-4 z-50 flex flex-col gap-2" aria-live="polite">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}

/** Stable callback for callers that only need to push toasts. */
export function useAddToast() {
  const { addToast } = useToast()
  return useCallback(
    (toast: ToastInput) => addToast(toast),
    [addToast]
  )
}
