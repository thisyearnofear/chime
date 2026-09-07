import { create } from 'zustand'
import type { TimelineEvent } from '@/types/markets'

interface PositionState {
  events: TimelineEvent[]
  lastTxHash: string | null
  pending: boolean
  pushEvent: (event: TimelineEvent) => void
  setPending: (pending: boolean) => void
  setLastTxHash: (hash: string | null) => void
}

export const usePositionStore = create<PositionState>((set) => ({
  events: [],
  lastTxHash: null,
  pending: false,
  pushEvent: (event) => set((state) => ({ events: [event, ...state.events].slice(0, 40) })),
  setPending: (pending) => set({ pending }),
  setLastTxHash: (hash) => set({ lastTxHash: hash }),
}))
