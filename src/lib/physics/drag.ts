import { type SimulationState, type Degrees, toRadians, ZERO_STATE } from './types'

type Vec4 = [number, number, number, number]

function derivatives(s: Vec4, g: number, drag: number): Vec4 {
  const [, , vx, vy] = s
  const speed = Math.sqrt(vx * vx + vy * vy)
  const dragFactor = speed > 0 ? drag * speed : 0
  return [vx, vy, -dragFactor * vx, -g - dragFactor * vy]
}

function rk4Step(s: Vec4, g: number, drag: number, dt: number): Vec4 {
  const k1 = derivatives(s, g, drag)
  const s2: Vec4 = [s[0] + k1[0] * dt / 2, s[1] + k1[1] * dt / 2, s[2] + k1[2] * dt / 2, s[3] + k1[3] * dt / 2]
  const k2 = derivatives(s2, g, drag)
  const s3: Vec4 = [s[0] + k2[0] * dt / 2, s[1] + k2[1] * dt / 2, s[2] + k2[2] * dt / 2, s[3] + k2[3] * dt / 2]
  const k3 = derivatives(s3, g, drag)
  const s4: Vec4 = [s[0] + k3[0] * dt, s[1] + k3[1] * dt, s[2] + k3[2] * dt, s[3] + k3[3] * dt]
  const k4 = derivatives(s4, g, drag)

  return [
    s[0] + (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]) * dt / 6,
    s[1] + (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]) * dt / 6,
    s[2] + (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]) * dt / 6,
    s[3] + (k1[3] + 2 * k2[3] + 2 * k3[3] + k4[3]) * dt / 6,
  ]
}

const CACHE_DT = 0.001

interface TrajectoryCache {
  key: string
  data: Float64Array
  count: number
  tof: number
}

let cacheA: TrajectoryCache | null = null
let cacheB: TrajectoryCache | null = null

function paramsKey(params: Record<string, number>): string {
  return `${params.v0 ?? 0}|${params.theta ?? 0}|${params.g ?? 9.8}|${params.y0 ?? 0}|${params.drag ?? 0}`
}

function buildCache(params: Record<string, number>): TrajectoryCache {
  const v0 = params.v0 ?? 0
  const theta = params.theta ?? 0
  const g = params.g ?? 9.8
  const y0 = params.y0 ?? 0
  const drag = params.drag ?? 0

  const thetaRad = toRadians(theta as Degrees)
  const vx0 = v0 * Math.cos(thetaRad)
  const vy0 = v0 * Math.sin(thetaRad)

  const maxSteps = 100001
  const data = new Float64Array(maxSteps * 4)

  let state: Vec4 = [0, y0, vx0, vy0]
  data[0] = state[0]; data[1] = state[1]; data[2] = state[2]; data[3] = state[3]

  let count = 1
  for (let i = 1; i < maxSteps; i++) {
    state = rk4Step(state, g, drag, CACHE_DT)
    const idx = i * 4
    data[idx] = state[0]; data[idx + 1] = state[1]; data[idx + 2] = state[2]; data[idx + 3] = state[3]
    count++
    if (state[1] <= 0) break
  }

  return { key: paramsKey(params), data, count, tof: (count - 1) * CACHE_DT }
}

function getCache(params: Record<string, number>): TrajectoryCache {
  const key = paramsKey(params)
  if (cacheA?.key === key) return cacheA
  if (cacheB?.key === key) return cacheB
  const entry = buildCache(params)
  cacheB = cacheA
  cacheA = entry
  return entry
}

export function invalidateDragCache(): void {
  cacheA = null
  cacheB = null
}

export function stateAtTimeWithDrag(
  params: Record<string, number>,
  targetT: number
): SimulationState {
  const v0 = params.v0 ?? 0
  const theta = params.theta ?? 0
  const g = params.g ?? 9.8
  const y0 = params.y0 ?? 0

  if (!Number.isFinite(v0) || !Number.isFinite(theta) || !Number.isFinite(g) || !Number.isFinite(y0) || !Number.isFinite(targetT)) {
    return ZERO_STATE
  }

  if (targetT <= 0) {
    const thetaRad = toRadians(theta as Degrees)
    return { t: 0, x: 0, y: y0, vx: v0 * Math.cos(thetaRad), vy: v0 * Math.sin(thetaRad), phase: 'ready' }
  }

  const cache = getCache(params)

  if (targetT >= cache.tof) {
    const idx = (cache.count - 1) * 4
    return { t: cache.tof, x: cache.data[idx], y: 0, vx: cache.data[idx + 2], vy: cache.data[idx + 3], phase: 'landed' }
  }

  const fi = targetT / CACHE_DT
  const lo = Math.floor(fi)
  const hi = Math.min(lo + 1, cache.count - 1)
  const frac = fi - lo

  const li = lo * 4
  const hi4 = hi * 4
  const x = cache.data[li] + frac * (cache.data[hi4] - cache.data[li])
  const y = cache.data[li + 1] + frac * (cache.data[hi4 + 1] - cache.data[li + 1])
  const vx = cache.data[li + 2] + frac * (cache.data[hi4 + 2] - cache.data[li + 2])
  const vy = cache.data[li + 3] + frac * (cache.data[hi4 + 3] - cache.data[li + 3])

  return { t: targetT, x, y, vx, vy, phase: 'flying' }
}

export function timeOfFlightWithDrag(params: Record<string, number>): number {
  const v0 = params.v0 ?? 0
  const g = params.g ?? 9.8
  const y0 = params.y0 ?? 0

  if (g <= 0) return 0
  if (v0 === 0 && y0 === 0) return 0

  return getCache(params).tof
}
