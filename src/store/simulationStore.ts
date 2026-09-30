import { create } from 'zustand'
import type { GhostTrail, CanvasBackground } from '@/lib/physics/types'

const MAX_GHOSTS = 8

interface SimulationStore {
  topicSlug: string
  setTopicSlug: (slug: string) => void

  params: Record<string, number>
  paramLimits: Record<string, [number, number]>
  setParam: (key: string, value: number) => void
  setParams: (params: Record<string, number>) => void
  initTopic: (defaults: Record<string, number>, limits: Record<string, [number, number]>) => void

  compareMode: boolean
  setCompareMode: (v: boolean) => void
  paramsB: Record<string, number>
  setParamB: (key: string, value: number) => void
  linkedParams: Record<string, boolean>
  toggleLinkedParam: (key: string) => void

  canvasBackground: CanvasBackground
  setCanvasBackground: (bg: CanvasBackground) => void

  ghostTrails: GhostTrail[]
  addGhostTrail: (trail: GhostTrail) => void
  clearGhostTrails: () => void
  removeOldestUnpinnedGhost: () => void
}

const DEFAULT_PARAMS: Record<string, number> = {
  v0: 20,
  theta: 45,
  g: 9.8,
  y0: 0,
  drag: 0,
}

const DEFAULT_LIMITS: Record<string, [number, number]> = {
  v0: [0, 50],
  theta: [0, 90],
  g: [0.5, 20],
  y0: [0, 50],
  drag: [0, 0.5],
}

function sanitize(key: string, value: number, limits: Record<string, [number, number]>, defaults: Record<string, number>): number {
  if (!Number.isFinite(value)) return defaults[key] ?? 0
  const lim = limits[key]
  if (lim) return Math.max(lim[0], Math.min(lim[1], value))
  return value
}

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  topicSlug: 'projectile-motion',
  setTopicSlug: (slug) => set({ topicSlug: slug }),

  params: { ...DEFAULT_PARAMS },
  paramLimits: { ...DEFAULT_LIMITS },
  setParam: (key, value) =>
    set((s) => ({ params: { ...s.params, [key]: sanitize(key, value, s.paramLimits, s.params) } })),
  setParams: (params) => {
    const s = get()
    const safe: Record<string, number> = {}
    for (const [k, v] of Object.entries(params)) safe[k] = sanitize(k, v, s.paramLimits, s.params)
    set({ params: safe })
  },
  initTopic: (defaults, limits) =>
    set({
      params: { ...defaults },
      paramLimits: limits,
      paramsB: { ...defaults },
      compareMode: false,
      ghostTrails: [],
      canvasBackground: 'default-sky' as CanvasBackground,
    }),

  compareMode: false,
  setCompareMode: (v) => set({ compareMode: v }),
  paramsB: { ...DEFAULT_PARAMS },
  setParamB: (key, value) =>
    set((s) => ({ paramsB: { ...s.paramsB, [key]: sanitize(key, value, s.paramLimits, s.params) } })),
  linkedParams: {},
  toggleLinkedParam: (key) =>
    set((s) => ({
      linkedParams: { ...s.linkedParams, [key]: !s.linkedParams[key] },
    })),

  canvasBackground: 'default-sky' as CanvasBackground,
  setCanvasBackground: (bg) => set({ canvasBackground: bg }),

  ghostTrails: [],
  addGhostTrail: (trail) =>
    set((s) => {
      const trails = [...s.ghostTrails]
      if (trails.length >= MAX_GHOSTS) {
        const unpinnedIdx = trails.findIndex((t) => !t.pinned)
        if (unpinnedIdx >= 0) {
          trails.splice(unpinnedIdx, 1)
        } else {
          trails.shift()
        }
      }
      return { ghostTrails: [...trails, trail] }
    }),
  clearGhostTrails: () => set({ ghostTrails: [] }),
  removeOldestUnpinnedGhost: () =>
    set((s) => {
      const idx = s.ghostTrails.findIndex((t) => !t.pinned)
      if (idx < 0) return s
      const trails = [...s.ghostTrails]
      trails.splice(idx, 1)
      return { ghostTrails: trails }
    }),
}))
