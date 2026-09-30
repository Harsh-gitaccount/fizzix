import { create } from 'zustand'

export interface RulerState {
  x1: number; y1: number
  x2: number; y2: number
}

export interface ProtractorState {
  cx: number; cy: number
  armAngle: number // degrees, the measured angle
}

type DragTarget =
  | { tool: 'ruler'; handle: 'start' | 'end' | 'body' }
  | { tool: 'protractor'; handle: 'center' | 'arm' }
  | null

interface ToolStore {
  ruler: RulerState
  protractor: ProtractorState
  dragTarget: DragTarget
  dragOffset: { dx: number; dy: number }

  setRuler: (r: Partial<RulerState>) => void
  setProtractor: (p: Partial<ProtractorState>) => void
  startDrag: (target: NonNullable<DragTarget>, offset: { dx: number; dy: number }) => void
  stopDrag: () => void
}

export const useToolStore = create<ToolStore>((set) => ({
  ruler: { x1: 2, y1: 0, x2: 12, y2: 0 },
  protractor: { cx: 0, cy: 0, armAngle: 45 },
  dragTarget: null,
  dragOffset: { dx: 0, dy: 0 },

  setRuler: (r) => set((s) => ({ ruler: { ...s.ruler, ...r } })),
  setProtractor: (p) => set((s) => ({ protractor: { ...s.protractor, ...p } })),
  startDrag: (target, offset) => set({ dragTarget: target, dragOffset: offset }),
  stopDrag: () => set({ dragTarget: null, dragOffset: { dx: 0, dy: 0 } }),
}))
