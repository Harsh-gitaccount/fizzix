import { type SimulationState, type PhysicsValue, type CanvasBounds, ZERO_STATE } from './types'

// ===== SNELL'S LAW =====
// n₁ sin θ₁ = n₂ sin θ₂  (NCERT Class 10 Ch.10, Class 12 Ch.9)
// θ₁, θ₂ in degrees

export function snellsLaw(n1: number, n2: number, theta1Deg: number): number | null {
  if (!Number.isFinite(n1) || !Number.isFinite(n2) || !Number.isFinite(theta1Deg)) return null
  if (n1 <= 0 || n2 <= 0) return null
  const theta1Rad = theta1Deg * Math.PI / 180
  const sinTheta2 = (n1 / n2) * Math.sin(theta1Rad)
  if (Math.abs(sinTheta2) > 1) return null // TIR
  return Math.asin(sinTheta2) * 180 / Math.PI
}

// ===== CRITICAL ANGLE =====
// θ_c = sin⁻¹(n₂/n₁), only when n₁ > n₂  (NCERT Class 12 Ch.9)

export function criticalAngle(n1: number, n2: number): number | null {
  if (!Number.isFinite(n1) || !Number.isFinite(n2)) return null
  if (n1 <= 0 || n2 <= 0) return null
  if (n1 <= n2) return null // no TIR when going to denser medium
  const ratio = n2 / n1
  if (ratio > 1) return null
  return Math.asin(ratio) * 180 / Math.PI
}

// ===== THIN LENS FORMULA =====
// 1/v - 1/u = 1/f  (NCERT Class 10 Ch.10, Class 12 Ch.9)
// Sign convention (New Cartesian): distances measured from optical center
//   u: object distance (negative for real object on left)
//   v: image distance (positive = right of lens = real image for convex)
//   f: positive for convex, negative for concave

export function lensImageDistance(u: number, f: number): number | null {
  if (!Number.isFinite(u) || !Number.isFinite(f)) return null
  if (u === 0 || f === 0) return null
  // 1/v = 1/f + 1/u
  const oneOverV = 1 / f + 1 / u
  if (oneOverV === 0) return Infinity // image at infinity
  return 1 / oneOverV
}

// ===== MAGNIFICATION =====
// m = v/u  (NCERT Class 10 Ch.10)
// |m| > 1: magnified, |m| < 1: diminished
// m > 0: erect, m < 0: inverted

export function lensMagnification(v: number, u: number): number {
  if (!Number.isFinite(v) || !Number.isFinite(u)) return 0
  if (u === 0) return 0
  return v / u
}

// ===== LENS POWER =====
// P = 1/f (diopters, f in meters)  (NCERT Class 10 Ch.10)

export function lensPower(f_cm: number): number {
  if (!Number.isFinite(f_cm) || f_cm === 0) return 0
  return 100 / f_cm // convert cm to m: P = 1/(f/100) = 100/f
}

// ===== REFRACTION DEVIATION =====
// Deviation angle: δ = |θ₁ - θ₂|

export function refractionDeviation(theta1Deg: number, theta2Deg: number | null): number {
  if (theta2Deg === null || !Number.isFinite(theta1Deg) || !Number.isFinite(theta2Deg)) return 0
  return Math.abs(theta1Deg - theta2Deg)
}

// ===== COMMON REFRACTIVE INDICES =====
// Source: NCERT Class 12 Table 9.1

export const REFRACTIVE_INDICES: Record<string, number> = {
  vacuum: 1.0,
  air: 1.0003,
  water: 1.33,
  glass: 1.5,
  diamond: 2.42,
  ice: 1.31,
  oil: 1.47,
}

// ===== UNIFIED SimulationModule INTERFACE =====

const ANIM_CYCLE = 10

// opticsType maps to tabs:
//   0 = Refraction
//   1 = Lenses
//   2 = Total Internal Reflection
//   3 = Free Play (same as refraction with more params)

export function opticsStateAtTime(params: Record<string, number>, t: number): SimulationState {
  if (!Number.isFinite(t) || t < 0) return ZERO_STATE
  if (t === 0) return { ...ZERO_STATE, phase: 'ready' }
  const animPhase = (t % ANIM_CYCLE) / ANIM_CYCLE
  return { t, x: animPhase, y: 0, vx: 0, vy: 0, phase: 'flying' }
}

export function opticsTimeOfFlight(): number {
  return ANIM_CYCLE * 3
}

export function opticsDerivedValues(
  params: Record<string, number>,
  _state: SimulationState,
): Record<string, PhysicsValue> {
  const opticsType = params.opticsType ?? 0

  if (opticsType === 0 || opticsType === 3) {
    // Refraction / Free Play
    const n1 = params.n1 ?? 1.0
    const n2 = params.n2 ?? 1.5
    const theta1 = params.theta1 ?? 30
    const theta2 = snellsLaw(n1, n2, theta1)
    const crit = criticalAngle(n1, n2)
    const dev = refractionDeviation(theta1, theta2)

    const result: Record<string, PhysicsValue> = {
      theta2: {
        value: theta2 ?? NaN,
        unit: '°',
        symbol: 'θ₂',
        label: 'Refracted Angle',
      },
      deviation: {
        value: dev,
        unit: '°',
        symbol: 'δ',
        label: 'Deviation',
      },
    }
    if (crit !== null) {
      result.criticalAngle = {
        value: crit,
        unit: '°',
        symbol: 'θc',
        label: 'Critical Angle',
      }
    }
    if (theta2 === null) {
      result.tir = {
        value: 1,
        unit: '',
        symbol: 'TIR',
        label: 'Yes',
      }
    }
    return result
  }

  if (opticsType === 1) {
    // Lenses
    const u = params.objectDist ?? -30 // negative = real object on left
    const f = params.focalLength ?? 15 // positive = convex
    const v = lensImageDistance(u, f)
    const m = v !== null && v !== Infinity ? lensMagnification(v, u) : 0
    const p = lensPower(f)

    return {
      imageDistance: {
        value: v ?? NaN,
        unit: 'cm',
        symbol: 'v',
        label: 'Image Distance',
      },
      magnification: {
        value: m,
        unit: 'x',
        symbol: 'm',
        label: 'Magnification',
      },
      power: {
        value: p,
        unit: 'D',
        symbol: 'P',
        label: 'Power',
      },
      imageNature: {
        value: v !== null && v !== Infinity ? (v > 0 ? 1 : -1) : 0,
        unit: '',
        symbol: '',
        label: v !== null && v !== Infinity
          ? (v > 0 ? (m < 0 ? 'Real, Inverted' : 'Real, Erect') : (m > 0 ? 'Virtual, Erect' : 'Virtual, Inverted'))
          : 'At Infinity',
      },
    }
  }

  // TIR (opticsType === 2)
  const n1 = params.n1 ?? 1.5
  const n2 = params.n2 ?? 1.0
  const theta1 = params.theta1 ?? 30
  const crit = criticalAngle(n1, n2)
  const theta2 = snellsLaw(n1, n2, theta1)
  const isTIR = theta2 === null && crit !== null && theta1 >= crit

  const result: Record<string, PhysicsValue> = {}
  if (crit !== null) {
    result.criticalAngle = {
      value: crit,
      unit: '°',
      symbol: 'θc',
      label: 'Critical Angle',
    }
  }
  result.theta2 = {
    value: theta2 ?? NaN,
    unit: '°',
    symbol: 'θ₂',
    label: isTIR ? 'Total Internal Reflection' : 'Refracted Angle',
  }
  result.isTIR = {
    value: isTIR ? 1 : 0,
    unit: '',
    symbol: 'TIR',
    label: isTIR ? 'Yes' : 'No',
  }
  return result
}

export function opticsTrajectoryBounds(params: Record<string, number>): CanvasBounds {
  const opticsType = params.opticsType ?? 0
  if (opticsType === 1) {
    const f = Math.abs(params.focalLength ?? 15)
    const u = Math.abs(params.objectDist ?? -30)
    const span = Math.max(f * 3, u * 1.5, 30)
    return { xMin: -span, xMax: span, yMin: -span * 0.5, yMax: span * 0.5, scale: 1 }
  }
  return { xMin: -5, xMax: 5, yMin: -5, yMax: 5, scale: 1 }
}
