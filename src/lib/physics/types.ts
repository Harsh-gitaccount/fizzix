export type Degrees = number & { readonly __brand: 'degrees' }
export type Radians = number & { readonly __brand: 'radians' }

export function toRadians(deg: Degrees): Radians {
  return (deg * Math.PI / 180) as Radians
}

export function toDegrees(rad: Radians): Degrees {
  return (rad * 180 / Math.PI) as Degrees
}

export interface SimulationState {
  t: number
  x: number
  y: number
  vx: number
  vy: number
  phase: 'ready' | 'flying' | 'landed'
}

export interface ProjectileParams {
  v0: number
  theta: number // degrees
  g: number
  y0: number
}

export interface PhysicsValue {
  value: number
  unit: string
  symbol: string
  label: string
}

export type ValidationStatus =
  | 'draft' | 'needs-review' | 'reviewed' | 'approved' | 'rejected'

export type LayerKey =
  | 'grid' | 'trajectory' | 'velocity' | 'components'
  | 'acceleration' | 'graph' | string

export interface LayerDefinition {
  key: LayerKey
  label: string
  labelHi?: string
  icon: string
  defaultOn: boolean
  color: string
}

export type CanvasBackground =
  | 'default-sky' | 'cricket-field' | 'space' | 'split-sky-space' | 'lab'

export interface CanvasBounds {
  xMin: number
  xMax: number
  yMin: number
  yMax: number
  scale: number
}

export interface ParameterDefinition {
  key: string
  symbol: string
  name: string
  unit: string
  min: number
  max: number
  step: number
  defaultValue: number
}

export interface KeyPoint {
  id: string
  label: string
  condition: (prevState: SimulationState, currentState: SimulationState) => boolean
  tooltip: (state: SimulationState) => string
}

export interface GhostTrail {
  id: string
  points: Array<{ x: number; y: number }>
  color: string
  label?: string
  pinned: boolean
}

export interface UndoEntry {
  params: Record<string, number>
  label: string
}

export const ZERO_STATE: SimulationState = {
  t: 0, x: 0, y: 0, vx: 0, vy: 0, phase: 'ready'
}
