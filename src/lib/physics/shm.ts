import { type SimulationState, type PhysicsValue, type CanvasBounds, ZERO_STATE } from './types'

// ===== PENDULUM (small angle approximation) =====
// θ(t) = θ₀ cos(ωt), where ω = √(g/L)
// Bob position relative to pivot:
//   x = L sin(θ)   (horizontal displacement)
//   y = L(1-cosθ)   (height above lowest point)
// Velocity:
//   vx = L cosθ dθ/dt
//   vy = L sinθ dθ/dt

export interface PendulumParams {
  length: number    // L in meters (0.1 - 5.0)
  theta0: number    // initial angle in degrees (1 - 60)
  g: number         // gravity m/s² (1 - 20)
  damping: number   // damping coefficient (0 - 1), 0 = ideal
}

export function pendulumPeriod(params: PendulumParams): number {
  const { length, g } = params
  if (length <= 0 || g <= 0) return 0
  return 2 * Math.PI * Math.sqrt(length / g)
}

export function pendulumFrequency(params: PendulumParams): number {
  const T = pendulumPeriod(params)
  return T > 0 ? 1 / T : 0
}

export function pendulumAngularFrequency(params: PendulumParams): number {
  const { length, g } = params
  if (length <= 0 || g <= 0) return 0
  return Math.sqrt(g / length)
}

export function pendulumTimeOfFlight(params: PendulumParams): number {
  const T = pendulumPeriod(params)
  if (T <= 0) return 0
  if (params.damping > 0) {
    const decayTime = 2 / params.damping
    return Math.min(decayTime * 3, T * 10)
  }
  return T * 3
}

export function pendulumStateAtTime(
  params: Record<string, number>,
  t: number
): SimulationState {
  const length = params.length ?? 1
  const theta0Deg = params.theta0 ?? 30
  const g = params.g ?? 9.8
  const damping = params.damping ?? 0

  if (
    !Number.isFinite(length) || !Number.isFinite(theta0Deg) ||
    !Number.isFinite(g) || !Number.isFinite(t) ||
    length <= 0 || g <= 0
  ) {
    return ZERO_STATE
  }

  const theta0 = theta0Deg * Math.PI / 180
  const omega0 = Math.sqrt(g / length)
  const p: PendulumParams = { length, theta0: theta0Deg, g, damping }
  const tof = pendulumTimeOfFlight(p)

  if (t <= 0) {
    const x = length * Math.sin(theta0)
    const y = length * (1 - Math.cos(theta0))
    return { t: 0, x, y, vx: 0, vy: 0, phase: 'ready' }
  }

  let theta: number
  let dTheta: number

  if (damping > 0) {
    const gamma = damping / 2
    const disc = omega0 * omega0 - gamma * gamma

    if (disc < -1e-12) {
      // Overdamped
      const beta = Math.sqrt(-disc)
      const expGt = Math.exp(-gamma * t)
      const chB = Math.cosh(beta * t)
      const shB = Math.sinh(beta * t)
      theta = theta0 * expGt * (chB + (gamma / beta) * shB)
      dTheta = theta0 * expGt * ((-gamma * chB + beta * shB) + (gamma / beta) * (-gamma * shB + beta * chB))
    } else if (disc < 1e-12) {
      // Critically damped
      const expGt = Math.exp(-gamma * t)
      theta = theta0 * expGt * (1 + gamma * t)
      dTheta = theta0 * expGt * (gamma - gamma * (1 + gamma * t))
    } else {
      // Underdamped
      const omegaD = Math.sqrt(disc)
      const expGt = Math.exp(-gamma * t)
      theta = theta0 * expGt * (Math.cos(omegaD * t) + (gamma / omegaD) * Math.sin(omegaD * t))
      dTheta = theta0 * expGt * ((-gamma * Math.cos(omegaD * t) - omegaD * Math.sin(omegaD * t))
        + (gamma / omegaD) * (-gamma * Math.sin(omegaD * t) + omegaD * Math.cos(omegaD * t)))
    }

    if (Math.abs(theta) < 0.001 && Math.abs(dTheta) < 0.001) {
      return { t, x: 0, y: 0, vx: 0, vy: 0, phase: 'landed' }
    }
  } else {
    theta = theta0 * Math.cos(omega0 * t)
    dTheta = -theta0 * omega0 * Math.sin(omega0 * t)
  }

  const x = length * Math.sin(theta)
  const y = length * (1 - Math.cos(theta))
  const vx = length * Math.cos(theta) * dTheta
  const vy = length * Math.sin(theta) * dTheta

  const phase = t >= tof ? 'landed' : 'flying'

  return { t, x, y, vx, vy, phase }
}

export function pendulumEnergy(
  params: Record<string, number>,
  state: SimulationState
): { ke: number; pe: number; total: number } {
  const mass = params.mass ?? 1
  const length = params.length ?? 1
  const g = params.g ?? 9.8
  const speed = Math.sqrt(state.vx * state.vx + state.vy * state.vy)
  const ke = 0.5 * mass * speed * speed
  // Use small-angle consistent PE: 0.5*m*g*L*theta^2
  // theta is recovered from x = L*sin(theta) ≈ L*theta for small angles
  const theta = length > 0 ? Math.asin(Math.max(-1, Math.min(1, state.x / length))) : 0
  const pe = 0.5 * mass * g * length * theta * theta
  return { ke, pe, total: ke + pe }
}

export function pendulumDerivedValues(
  params: Record<string, number>,
  state: SimulationState
): Record<string, PhysicsValue> {
  const p: PendulumParams = {
    length: params.length ?? 1,
    theta0: params.theta0 ?? 30,
    g: params.g ?? 9.8,
    damping: params.damping ?? 0,
  }
  const T = pendulumPeriod(p)
  const f = pendulumFrequency(p)
  const omega = pendulumAngularFrequency(p)
  const theta0Rad = p.theta0 * Math.PI / 180
  const maxSpeed = p.length * omega * theta0Rad
  const energy = pendulumEnergy(params, state)
  const currentSpeed = Math.sqrt(state.vx * state.vx + state.vy * state.vy)

  const currentTheta = p.length > 0
    ? Math.asin(Math.max(-1, Math.min(1, state.x / p.length))) * 180 / Math.PI
    : 0

  return {
    period: { value: T, unit: 's', symbol: 'T', label: 'Period' },
    frequency: { value: f, unit: 'Hz', symbol: 'f', label: 'Frequency' },
    angularFreq: { value: omega, unit: 'rad/s', symbol: '\\omega', label: 'Angular Frequency' },
    maxSpeed: { value: maxSpeed, unit: 'm/s', symbol: 'v_{max}', label: 'Max Speed' },
    currentAngle: { value: currentTheta, unit: '°', symbol: '\\theta', label: 'Angle' },
    currentHeight: { value: state.y, unit: 'm', symbol: 'h', label: 'Height' },
    currentSpeed: { value: currentSpeed, unit: 'm/s', symbol: 'v', label: 'Speed' },
    kineticEnergy: { value: energy.ke, unit: 'J', symbol: 'KE', label: 'Kinetic Energy' },
    potentialEnergy: { value: energy.pe, unit: 'J', symbol: 'PE', label: 'Potential Energy' },
    totalEnergy: { value: energy.total, unit: 'J', symbol: 'E', label: 'Total Energy' },
  }
}

export function pendulumTrajectoryBounds(params: Record<string, number>): CanvasBounds {
  const length = params.length ?? 1
  const theta0Deg = params.theta0 ?? 30
  const theta0 = theta0Deg * Math.PI / 180
  const xMax = length * Math.sin(theta0)

  const padding = 0.15
  const halfWidth = Math.max(xMax * 1.2, 0.5)
  const height = Math.max(length * 1.1, 1)

  return {
    xMin: -halfWidth - halfWidth * padding,
    xMax: halfWidth + halfWidth * padding,
    yMin: -height * 0.1,
    yMax: height + height * padding,
    scale: 1,
  }
}

// ===== SPRING-MASS SYSTEM =====
// x(t) = A cos(ωt), where ω = √(k/m)
// v(t) = -Aω sin(ωt)

export interface SpringParams {
  k: number         // spring constant N/m (1 - 100)
  mass: number      // mass in kg (0.1 - 10)
  amplitude: number // amplitude in meters (0.01 - 1.0)
  damping: number   // damping coefficient (0 - 1), 0 = ideal
}

export function springPeriod(params: SpringParams): number {
  const { k, mass } = params
  if (k <= 0 || mass <= 0) return 0
  return 2 * Math.PI * Math.sqrt(mass / k)
}

export function springFrequency(params: SpringParams): number {
  const T = springPeriod(params)
  return T > 0 ? 1 / T : 0
}

export function springAngularFrequency(params: SpringParams): number {
  const { k, mass } = params
  if (k <= 0 || mass <= 0) return 0
  return Math.sqrt(k / mass)
}

export function springTimeOfFlight(params: SpringParams): number {
  const T = springPeriod(params)
  if (T <= 0) return 0
  if (params.damping > 0) {
    const decayTime = 2 * params.mass / params.damping
    return Math.min(decayTime * 3, T * 10)
  }
  return T * 3
}

export function springStateAtTime(
  params: Record<string, number>,
  t: number
): SimulationState {
  const k = params.k ?? 10
  const mass = params.mass ?? 1
  const amplitude = params.amplitude ?? 0.2
  const damping = params.damping ?? 0

  if (
    !Number.isFinite(k) || !Number.isFinite(mass) ||
    !Number.isFinite(amplitude) || !Number.isFinite(t) ||
    k <= 0 || mass <= 0
  ) {
    return ZERO_STATE
  }

  const omega0 = Math.sqrt(k / mass)
  const p: SpringParams = { k, mass, amplitude, damping }
  const tof = springTimeOfFlight(p)

  if (t <= 0) {
    return { t: 0, x: amplitude, y: 0, vx: 0, vy: 0, phase: 'ready' }
  }

  let x: number
  let vx: number

  if (damping > 0) {
    // damping is b in kg/s: m*x'' + b*x' + k*x = 0
    // IC: x(0) = A, v(0) = 0
    const gamma = damping / (2 * mass)
    const disc = omega0 * omega0 - gamma * gamma

    if (disc < -1e-12) {
      // Overdamped: no equilibrium crossing from rest
      const beta = Math.sqrt(-disc)
      const expGt = Math.exp(-gamma * t)
      const chB = Math.cosh(beta * t)
      const shB = Math.sinh(beta * t)
      x = amplitude * expGt * (chB + (gamma / beta) * shB)
      vx = amplitude * expGt * ((-gamma * chB + beta * shB)
        + (gamma / beta) * (-gamma * shB + beta * chB))
    } else if (disc < 1e-12) {
      // Critically damped
      const expGt = Math.exp(-gamma * t)
      x = amplitude * expGt * (1 + gamma * t)
      vx = amplitude * expGt * (gamma - gamma * (1 + gamma * t))
    } else {
      // Underdamped
      const omegaD = Math.sqrt(disc)
      const expGt = Math.exp(-gamma * t)
      x = amplitude * expGt * (Math.cos(omegaD * t) + (gamma / omegaD) * Math.sin(omegaD * t))
      vx = amplitude * expGt * ((-gamma * Math.cos(omegaD * t) - omegaD * Math.sin(omegaD * t))
        + (gamma / omegaD) * (-gamma * Math.sin(omegaD * t) + omegaD * Math.cos(omegaD * t)))
    }

    if (Math.abs(x) < 0.0001 && Math.abs(vx) < 0.0001) {
      return { t, x: 0, y: 0, vx: 0, vy: 0, phase: 'landed' }
    }
  } else {
    x = amplitude * Math.cos(omega0 * t)
    vx = -amplitude * omega0 * Math.sin(omega0 * t)
  }

  const phase = t >= tof ? 'landed' : 'flying'

  return { t, x, y: 0, vx, vy: 0, phase }
}

export function springEnergy(
  params: Record<string, number>,
  state: SimulationState
): { ke: number; pe: number; total: number } {
  const k = params.k ?? 10
  const mass = params.mass ?? 1
  const ke = 0.5 * mass * state.vx * state.vx
  const pe = 0.5 * k * state.x * state.x
  return { ke, pe, total: ke + pe }
}

export function springDerivedValues(
  params: Record<string, number>,
  state: SimulationState
): Record<string, PhysicsValue> {
  const p: SpringParams = {
    k: params.k ?? 10,
    mass: params.mass ?? 1,
    amplitude: params.amplitude ?? 0.2,
    damping: params.damping ?? 0,
  }
  const T = springPeriod(p)
  const f = springFrequency(p)
  const omega = springAngularFrequency(p)
  const maxSpeed = p.amplitude * omega
  const energy = springEnergy(params, state)

  return {
    period: { value: T, unit: 's', symbol: 'T', label: 'Period' },
    frequency: { value: f, unit: 'Hz', symbol: 'f', label: 'Frequency' },
    angularFreq: { value: omega, unit: 'rad/s', symbol: '\\omega', label: 'Angular Frequency' },
    maxSpeed: { value: maxSpeed, unit: 'm/s', symbol: 'v_{max}', label: 'Max Speed' },
    displacement: { value: state.x, unit: 'm', symbol: 'x', label: 'Displacement' },
    velocity: { value: state.vx, unit: 'm/s', symbol: 'v', label: 'Velocity' },
    currentSpeed: { value: Math.abs(state.vx), unit: 'm/s', symbol: '|v|', label: 'Speed' },
    kineticEnergy: { value: energy.ke, unit: 'J', symbol: 'KE', label: 'Kinetic Energy' },
    potentialEnergy: { value: energy.pe, unit: 'J', symbol: 'PE', label: 'Potential Energy' },
    totalEnergy: { value: energy.total, unit: 'J', symbol: 'E', label: 'Total Energy' },
  }
}

export function springTrajectoryBounds(params: Record<string, number>): CanvasBounds {
  const amplitude = params.amplitude ?? 0.2
  const halfWidth = Math.max(amplitude * 1.5, 0.3)
  const padding = 0.15

  return {
    xMin: -halfWidth - halfWidth * padding,
    xMax: halfWidth + halfWidth * padding,
    yMin: -0.5,
    yMax: 0.5,
    scale: 1,
  }
}

// ===== UNIFIED SHM INTERFACE =====
// Routes to pendulum or spring based on params.shmType

export type SHMType = 'pendulum' | 'spring'

export function shmStateAtTime(params: Record<string, number>, t: number): SimulationState {
  const shmType = params.shmType ?? 0
  if (shmType === 1) return springStateAtTime(params, t)
  return pendulumStateAtTime(params, t)
}

export function shmTimeOfFlight(params: Record<string, number>): number {
  const shmType = params.shmType ?? 0
  if (shmType === 1) {
    return springTimeOfFlight({
      k: params.k ?? 10,
      mass: params.mass ?? 1,
      amplitude: params.amplitude ?? 0.2,
      damping: params.damping ?? 0,
    })
  }
  return pendulumTimeOfFlight({
    length: params.length ?? 1,
    theta0: params.theta0 ?? 30,
    g: params.g ?? 9.8,
    damping: params.damping ?? 0,
  })
}

export function shmDerivedValues(
  params: Record<string, number>,
  state: SimulationState
): Record<string, PhysicsValue> {
  const shmType = params.shmType ?? 0
  if (shmType === 1) return springDerivedValues(params, state)
  return pendulumDerivedValues(params, state)
}

export function shmTrajectoryBounds(params: Record<string, number>): CanvasBounds {
  const shmType = params.shmType ?? 0
  if (shmType === 1) return springTrajectoryBounds(params)
  return pendulumTrajectoryBounds(params)
}
