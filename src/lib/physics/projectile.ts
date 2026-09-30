import {
  type SimulationState,
  type ProjectileParams,
  type PhysicsValue,
  type CanvasBounds,
  type Degrees,
  toRadians,
  ZERO_STATE,
} from './types'
import { stateAtTimeWithDrag, timeOfFlightWithDrag } from './drag'

export function timeOfFlight(params: ProjectileParams): number {
  const { v0, theta, g, y0 } = params
  if (g <= 0) return 0

  const thetaRad = toRadians(theta as Degrees)
  const vy0 = v0 * Math.sin(thetaRad)

  if (v0 === 0 && y0 === 0) return 0
  if (v0 === 0 && theta === 0 && y0 > 0) {
    return Math.sqrt(2 * y0 / g)
  }

  const discriminant = vy0 * vy0 + 2 * g * y0
  if (discriminant < 0) return 0

  return (vy0 + Math.sqrt(discriminant)) / g
}

export function maxHeight(params: ProjectileParams): number {
  const { v0, theta, g, y0 } = params
  if (g <= 0) return y0

  const thetaRad = toRadians(theta as Degrees)
  const vy0 = v0 * Math.sin(thetaRad)
  const tPeak = vy0 / g
  const tof = timeOfFlight(params)

  if (tPeak <= 0 || tPeak > tof) return y0

  return y0 + (vy0 * vy0) / (2 * g)
}

export function range(params: ProjectileParams): number {
  const { v0, theta } = params
  const thetaRad = toRadians(theta as Degrees)
  const vx = v0 * Math.cos(thetaRad)
  const tof = timeOfFlight(params)
  return vx * tof
}

export function getTimeOfFlight(params: Record<string, number>): number {
  if ((params.drag ?? 0) > 0) {
    return timeOfFlightWithDrag(params)
  }
  return timeOfFlight({
    v0: params.v0 ?? 0,
    theta: params.theta ?? 0,
    g: params.g ?? 9.8,
    y0: params.y0 ?? 0,
  })
}

function maxHeightWithDrag(params: Record<string, number>, tof: number, y0: number): number {
  let maxY = y0
  const steps = 50
  const dt = tof / steps
  for (let i = 0; i <= steps; i++) {
    const s = stateAtTimeWithDrag(params, i * dt)
    if (s.y > maxY) maxY = s.y
  }
  return maxY
}

export function stateAtTime(
  params: Record<string, number>,
  t: number
): SimulationState {
  if ((params.drag ?? 0) > 0) {
    return stateAtTimeWithDrag(params, t)
  }

  const v0 = params.v0 ?? 0
  const theta = params.theta ?? 0
  const g = params.g ?? 9.8
  const y0 = params.y0 ?? 0

  if (
    !Number.isFinite(v0) ||
    !Number.isFinite(theta) ||
    !Number.isFinite(g) ||
    !Number.isFinite(y0) ||
    !Number.isFinite(t)
  ) {
    return ZERO_STATE
  }

  const p: ProjectileParams = { v0, theta, g, y0 }
  const tof = timeOfFlight(p)

  if (t <= 0) {
    const thetaRad = toRadians(theta as Degrees)
    return {
      t: 0,
      x: 0,
      y: y0,
      vx: v0 * Math.cos(thetaRad),
      vy: v0 * Math.sin(thetaRad),
      phase: 'ready',
    }
  }

  const thetaRad = toRadians(theta as Degrees)
  const vx = v0 * Math.cos(thetaRad)
  const vy0 = v0 * Math.sin(thetaRad)

  if (t >= tof) {
    const x = vx * tof
    const vyLand = vy0 - g * tof
    return {
      t: tof,
      x,
      y: 0,
      vx,
      vy: vyLand,
      phase: 'landed',
    }
  }

  return {
    t,
    x: vx * t,
    y: y0 + vy0 * t - 0.5 * g * t * t,
    vx,
    vy: vy0 - g * t,
    phase: 'flying',
  }
}

export function derivedValues(
  params: Record<string, number>,
  state: SimulationState
): Record<string, PhysicsValue> {
  const hasDrag = (params.drag ?? 0) > 0
  const p: ProjectileParams = {
    v0: params.v0 ?? 0,
    theta: params.theta ?? 0,
    g: params.g ?? 9.8,
    y0: params.y0 ?? 0,
  }

  const thetaRad = toRadians(p.theta as Degrees)
  const tof = hasDrag ? timeOfFlightWithDrag(params) : timeOfFlight(p)

  let r: number
  let mh: number
  let hv: number
  let impactSpd: number

  if (hasDrag) {
    const landState = stateAtTimeWithDrag(params, tof)
    r = landState.x
    impactSpd = Math.sqrt(landState.vx * landState.vx + landState.vy * landState.vy)
    hv = state.vx
    mh = maxHeightWithDrag(params, tof, p.y0)
  } else {
    r = range(p)
    mh = maxHeight(p)
    hv = p.v0 * Math.cos(thetaRad)
    const vyLand = p.v0 * Math.sin(thetaRad) - p.g * tof
    impactSpd = Math.sqrt(hv * hv + vyLand * vyLand)
  }

  const currentSpd = Math.sqrt(state.vx * state.vx + state.vy * state.vy)

  return {
    range: { value: r, unit: 'm', symbol: 'R', label: 'Range' },
    maxHeight: { value: mh, unit: 'm', symbol: 'H_{max}', label: 'Max Height' },
    timeOfFlight: { value: tof, unit: 's', symbol: 'T', label: 'Time of Flight' },
    horizontalV: { value: hv, unit: 'm/s', symbol: 'v_x', label: 'Horizontal Velocity' },
    impactSpeed: { value: impactSpd, unit: 'm/s', symbol: 'v_f', label: 'Impact Speed' },
    launchSpeed: { value: p.v0, unit: 'm/s', symbol: 'v_0', label: 'Launch Speed' },
    currentHeight: { value: state.y, unit: 'm', symbol: 'h', label: 'Height' },
    currentSpeed: { value: currentSpd, unit: 'm/s', symbol: 'v', label: 'Speed' },
  }
}

export function trajectoryBounds(params: Record<string, number>): CanvasBounds {
  const p: ProjectileParams = {
    v0: params.v0 ?? 0,
    theta: params.theta ?? 0,
    g: params.g ?? 9.8,
    y0: params.y0 ?? 0,
  }

  const hasDrag = (params.drag ?? 0) > 0
  const tof = hasDrag ? timeOfFlightWithDrag(params) : timeOfFlight(p)
  const r = hasDrag ? stateAtTimeWithDrag(params, tof).x : range(p)
  const mh = hasDrag ? maxHeightWithDrag(params, tof, p.y0) : maxHeight(p)

  const minArea = 5
  const xMax = Math.max(r, minArea)
  const yMax = Math.max(mh, minArea)

  const padding = 0.15
  const xPad = xMax * padding
  const yPad = yMax * padding

  return {
    xMin: -xPad,
    xMax: xMax + xPad,
    yMin: -yPad,
    yMax: yMax + yPad,
    scale: 1,
  }
}
