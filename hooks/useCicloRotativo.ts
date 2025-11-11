import { create } from 'zustand'
import { usePlanejamento } from '../stores/usePlanejamento'

type State = {
  lastDiscipline: string | null
  next: () => string | null
  peek: () => string | null
  reset: () => void
}

// Weighted random selection excluding the last picked discipline when possible.
const pickByWeight = (weights: Record<string, number>, exclude?: string | null) => {
  const entries = Object.entries(weights)
    .filter(([name, weight]) => Number(weight) > 0 && name)
    .map(([name, weight]) => [name, Number(weight)] as const)

  if (!entries.length) return null

  // Try to avoid repeating the last discipline if there are 2+ candidates
  const pool = entries.length > 1 && exclude ? entries.filter(([name]) => name !== exclude) : entries
  const total = pool.reduce((acc, [, w]) => acc + w, 0)
  if (total <= 0) return null
  const threshold = Math.random() * total
  let acc = 0
  for (const [name, w] of pool) {
    acc += w
    if (threshold <= acc) return name
  }
  return pool[pool.length - 1][0]
}

export const useCicloRotativo = create<State>((set, get) => ({
  lastDiscipline: null,
  next: () => {
    const planning = usePlanejamento.getState().planningConfig
    const weights = planning?.planConfig?.weights ?? {}
    const next = pickByWeight(weights, get().lastDiscipline)
    set({ lastDiscipline: next })
    return next
  },
  peek: () => {
    const planning = usePlanejamento.getState().planningConfig
    const weights = planning?.planConfig?.weights ?? {}
    return pickByWeight(weights, get().lastDiscipline)
  },
  reset: () => set({ lastDiscipline: null }),
}))

export default useCicloRotativo
