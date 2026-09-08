import { create } from 'zustand'
import type { TimelineEvent } from '@/types/markets'

const eventsKey = (address: string) => `chime:events:${address.toLowerCase()}`

function readEvents(address: string): TimelineEvent[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(eventsKey(address))
    if (!raw) return []
    const parsed = JSON.parse(raw) as TimelineEvent[]
    return Array.isArray(parsed) ? parsed.slice(0, 40) : []
  } catch {
    return []
  }
}

function writeEvents(address: string, events: TimelineEvent[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(eventsKey(address), JSON.stringify(events.slice(0, 40)))
  } catch {
    /* quota */
  }
}

interface PositionState {
  account: string | null
  events: TimelineEvent[]
  lastTxHash: string | null
  pending: boolean
  hydrate: (address: string | null) => void
  pushEvent: (event: TimelineEvent) => void
  setPending: (pending: boolean) => void
  setLastTxHash: (hash: string | null) => void
}

export const usePositionStore = create<PositionState>((set, get) => ({
  account: null,
  events: [],
  lastTxHash: null,
  pending: false,
  hydrate: (address) => {
    if (!address) {
      set({ account: null, events: [] })
      return
    }
    set({ account: address, events: readEvents(address) })
  },
  pushEvent: (event) => {
    const { account } = get()
    set((state) => {
      const events = [event, ...state.events].slice(0, 40)
      if (account) writeEvents(account, events)
      return { events }
    })
  },
  setPending: (pending) => set({ pending }),
  setLastTxHash: (hash) => set({ lastTxHash: hash }),
}))
