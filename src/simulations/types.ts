import type { SimulationState, PhysicsValue, CanvasBounds, LayerDefinition, CanvasBackground, GhostTrail } from '@/lib/physics/types'
import type { RulerState, ProtractorState } from '@/store/toolStore'
import type { Lang } from '@/lib/i18n'
import type { QuizQuestion } from '@/lib/quiz/types'

export interface ParamDef {
  key: string
  symbol: string
  unit: string
  min: number
  max: number
  step: number
  help: string
  helpHi?: string
}

export interface TabDef {
  id: string
  labelKey: string
}

export interface TeachingPreset {
  id: string
  label: string
  hookQuestion: string
  params: Record<string, number>
  compareParams?: Record<string, number>
  specialMode?: 'split-view' | 'ghost-trails'
  defaultLayers: string[]
  defaultTab: string
  canvasBackground: CanvasBackground
}

export interface SimulationModule {
  id: string
  slug: string
  name: string
  description: string
  classRange: string
  icon: string
  color: string

  stateAtTime: (params: Record<string, number>, t: number) => SimulationState
  timeOfFlight: (params: Record<string, number>) => number
  derivedValues: (params: Record<string, number>, state: SimulationState) => Record<string, PhysicsValue>
  trajectoryBounds: (params: Record<string, number>) => CanvasBounds

  defaultParams: Record<string, number>
  paramLimits: Record<string, [number, number]>
  paramDefs: ParamDef[]

  tabs: TabDef[]
  defaultTab: string

  defaultLayers: Record<string, boolean>
  layerDefs: LayerDefinition[]

  presets: TeachingPreset[]

  renderCanvas: CanvasRenderFn
  computeBounds: (
    params: Record<string, number>,
    compareMode: boolean,
    paramsB?: Record<string, number>,
    ghosts?: GhostTrail[],
  ) => CanvasBounds

  derivedValueKeys: string[]

  quizPool: QuizQuestion[]
}

export type CanvasRenderFn = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  options: CanvasRenderOptions,
) => void

export interface CanvasRenderOptions {
  params: Record<string, number>
  currentTime: number
  bounds: CanvasBounds
  activeLayers: Record<string, boolean>
  isDark: boolean
  background: CanvasBackground
  ghostTrails: GhostTrail[]
  compareMode: boolean
  paramsB?: Record<string, number>
  dragHandles?: { angleArc: boolean; speedArrow: boolean }
  lang?: Lang
  tools?: {
    ruler?: RulerState | null
    protractor?: ProtractorState | null
  }
}
