import { create } from 'zustand'
import type { WindowDecision } from '@/types/markets'

export const ALLEGIANCE_KEY = 'chime:allegiance'
export const SIZE_KEY = 'chime:size'

interface AgentState {
  decision: WindowDecision | null
  allegiance: string
  defaultSize: number
  loading: boolean
  setDecision: (decision: WindowDecision | null) => void
  setAllegiance: (label: string) => void
  setDefaultSize: (size: number) => void
  setLoading: (loading: boolean) => void
}

export const useAgentStore = create<AgentState>((set) => ({
  decision: null,
  allegiance: 'Competitive',
  defaultSize: 5,
  loading: false,
  setDecision: (decision) => set({ decision }),
  setAllegiance: (label) => {
    if (typeof window !== 'undefined') localStorage.setItem(ALLEGIANCE_KEY, label)
    set({ allegiance: label })
  },
  setDefaultSize: (size) => {
    if (typeof window !== 'undefined') localStorage.setItem(SIZE_KEY, String(size))
    set({ defaultSize: size })
  },
  setLoading: (loading) => set({ loading }),
}))
