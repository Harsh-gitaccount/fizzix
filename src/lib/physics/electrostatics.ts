import { type SimulationState, type PhysicsValue, type CanvasBounds, ZERO_STATE } from './types'

// Coulomb's constant (N⋅m²/C²)
const K = 8.99e9

// ===== COULOMB'S LAW =====
// F = kq₁q₂/r²
// Positive F = repulsive (same-sign charges)
// Negative F = attractive (opposite-sign charges)

export function coulombForce(q1_uC: number, q2_uC: number, distance_m: number): number {
  if (!Number.isFinite(q1_uC) || !Number.isFinite(q2_uC) || !Number.isFinite(distance_m)) return 0
  if (distance_m <= 0) return 0
  const q1 = q1_uC * 1e-6
  const q2 = q2_uC * 1e-6
  return K * q1 * q2 / (distance_m * distance_m)
}

// ===== ELECTRIC FIELD =====
// E = kq/r² (magnitude from a single point charge)

export function electricFieldMagnitude(q_uC: number, distance_m: number): number {
  if (!Number.isFinite(q_uC) || !Number.isFinite(distance_m)) return 0
  if (distance_m <= 0) return 0
  const q = Math.abs(q_uC) * 1e-6
  return K * q / (distance_m * distance_m)
}

export interface PointCharge {
  q: number // μC
  x: number // m
  y: number // m
}

export function electricFieldAt(
  charges: PointCharge[],
  px: number,
  py: number,
): { ex: number; ey: number; magnitude: number } {
  let ex = 0
  let ey = 0
  for (const c of charges) {
    if (c.q === 0) continue
    const dx = px - c.x
    const dy = py - c.y
    const r2 = dx * dx + dy * dy
    if (r2 < 1e-10) continue
    const r = Math.sqrt(r2)
    const q = c.q * 1e-6
    const eMag = K * q / r2
    ex += eMag * dx / r
    ey += eMag * dy / r
  }
  return { ex, ey, magnitude: Math.sqrt(ex * ex + ey * ey) }
}

// ===== FIELD LINE TRACING =====

export interface FieldLinePoint {
  x: number
  y: number
}

export function traceFieldLine(
  charges: PointCharge[],
  startX: number,
  startY: number,
  direction: 1 | -1,
  stepSize: number,
  bounds: { xMin: number; xMax: number; yMin: number; yMax: number },
  chargeRadius: number,
  maxSteps: number = 500,
): FieldLinePoint[] {
  const points: FieldLinePoint[] = [{ x: startX, y: startY }]
  let x = startX
  let y = startY

  for (let i = 0; i < maxSteps; i++) {
    const field = electricFieldAt(charges, x, y)
    if (field.magnitude < 1) break

    const dx = direction * field.ex / field.magnitude * stepSize
    const dy = direction * field.ey / field.magnitude * stepSize
    x += dx
    y += dy

    let nearCharge = false
    for (const c of charges) {
      if (c.q === 0) continue
      const dist = Math.sqrt((x - c.x) ** 2 + (y - c.y) ** 2)
      if (dist < chargeRadius) {
        nearCharge = true
        points.push({ x, y })
        break
      }
    }
    if (nearCharge) break
    if (x < bounds.xMin || x > bounds.xMax || y < bounds.yMin || y > bounds.yMax) break

    points.push({ x, y })
  }

  return points
}

// ===== CIRCUIT ANALYSIS =====

export function seriesResistance(r1: number, r2: number): number {
  return Math.max(0, r1) + Math.max(0, r2)
}

export function parallelResistance(r1: number, r2: number): number {
  if (r1 <= 0 || r2 <= 0) return 0
  return (r1 * r2) / (r1 + r2)
}

export function ohmsCurrent(voltage: number, resistance: number): number {
  if (!Number.isFinite(voltage) || !Number.isFinite(resistance)) return 0
  if (resistance <= 0) return 0
  return voltage / resistance
}

export function electricPower(voltage: number, current: number): number {
  return Math.abs(voltage * current)
}

// ===== UNIFIED SimulationModule INTERFACE =====

const ANIM_CYCLE = 10

export function elecStateAtTime(params: Record<string, number>, t: number): SimulationState {
  if (!Number.isFinite(t) || t < 0) return ZERO_STATE
  if (t === 0) return { ...ZERO_STATE, phase: 'ready' }
  const animPhase = (t % ANIM_CYCLE) / ANIM_CYCLE
  return { t, x: animPhase, y: 0, vx: 0, vy: 0, phase: 'flying' }
}

export function elecTimeOfFlight(): number {
  return ANIM_CYCLE * 3
}

export function elecDerivedValues(
  params: Record<string, number>,
  _state: SimulationState,
): Record<string, PhysicsValue> {
  const elecType = params.elecType ?? 0

  if (elecType <= 1) {
    const q1 = params.q1 ?? 2
    const q2 = params.q2 ?? -2
    const distance = params.distance ?? 0.5
    const force = coulombForce(q1, q2, distance)
    const charges: PointCharge[] = [
      { q: q1, x: 0, y: 0 },
      { q: q2, x: distance, y: 0 },
    ]
    const midField = electricFieldAt(charges, distance / 2, 0)

    return {
      force: { value: force, unit: 'N', symbol: 'F', label: 'Coulomb Force' },
      forceMag: { value: Math.abs(force), unit: 'N', symbol: '|F|', label: 'Force Magnitude' },
      fieldMid: { value: midField.magnitude, unit: 'N/C', symbol: 'E', label: 'Field at Midpoint' },
    }
  }

  if (elecType === 2) {
    const voltage = params.voltage ?? 9
    const r1 = params.r1 ?? 100
    const current = ohmsCurrent(voltage, r1)
    const p = electricPower(voltage, current)
    return {
      current: { value: current, unit: 'A', symbol: 'I', label: 'Current' },
      voltageVal: { value: voltage, unit: 'V', symbol: 'V', label: 'Voltage' },
      power: { value: p, unit: 'W', symbol: 'P', label: 'Power' },
    }
  }

  // Series vs Parallel
  const voltage = params.voltage ?? 9
  const r1 = params.r1 ?? 100
  const r2 = params.r2 ?? 200
  const rSer = seriesResistance(r1, r2)
  const rPar = parallelResistance(r1, r2)
  const iSer = ohmsCurrent(voltage, rSer)
  const iPar = ohmsCurrent(voltage, rPar)

  return {
    rSeries: { value: rSer, unit: 'Ω', symbol: 'R_s', label: 'Series R' },
    rParallel: { value: rPar, unit: 'Ω', symbol: 'R_p', label: 'Parallel R' },
    iSeries: { value: iSer, unit: 'A', symbol: 'I_s', label: 'Series Current' },
    iParallel: { value: iPar, unit: 'A', symbol: 'I_p', label: 'Parallel Current' },
  }
}

export function elecTrajectoryBounds(params: Record<string, number>): CanvasBounds {
  const elecType = params.elecType ?? 0
  if (elecType <= 1) {
    const distance = params.distance ?? 0.5
    const pad = Math.max(distance * 0.5, 0.2)
    return {
      xMin: -pad,
      xMax: distance + pad,
      yMin: -(distance * 0.5 + pad),
      yMax: distance * 0.5 + pad,
      scale: 1,
    }
  }
  return { xMin: 0, xMax: 10, yMin: 0, yMax: 8, scale: 1 }
}
