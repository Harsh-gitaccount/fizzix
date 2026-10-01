import { type SimulationState, type PhysicsValue, type CanvasBounds, ZERO_STATE } from './types'

// ===== CONSTANTS (NCERT Class 11 Ch.13 Kinetic Theory) =====
const R = 8.314       // J/(mol·K) - universal gas constant
const k_B = 1.38e-23  // J/K - Boltzmann constant


// ===== IDEAL GAS LAW =====
// PV = nRT  (NCERT Class 11 Ch.13)
// P in Pa, V in m³, n in mol, T in K

export function idealGasPressure(n: number, T: number, V_liters: number): number {
  if (!Number.isFinite(n) || !Number.isFinite(T) || !Number.isFinite(V_liters)) return 0
  if (n <= 0 || T <= 0 || V_liters <= 0) return 0
  const V_m3 = V_liters / 1000
  return (n * R * T) / V_m3
}

// ===== AVERAGE KINETIC ENERGY PER MOLECULE =====
// KE_avg = (3/2) k_B T  (NCERT Class 11 Ch.13, Eq 13.22)
// For monatomic ideal gas, 3 translational degrees of freedom

export function avgKineticEnergy(T: number): number {
  if (!Number.isFinite(T) || T <= 0) return 0
  return 1.5 * k_B * T
}

// ===== TOTAL KINETIC ENERGY =====
// KE_total = (3/2) n R T  (NCERT Class 11 Ch.13)

export function totalKineticEnergy(n: number, T: number): number {
  if (!Number.isFinite(n) || !Number.isFinite(T)) return 0
  if (n <= 0 || T <= 0) return 0
  return 1.5 * n * R * T
}

// ===== RMS SPEED =====
// v_rms = sqrt(3RT/M)  (NCERT Class 11 Ch.13, Eq 13.24)
// M in kg/mol (molar mass)

export function rmsSpeed(T: number, M_gmol: number): number {
  if (!Number.isFinite(T) || !Number.isFinite(M_gmol)) return 0
  if (T <= 0 || M_gmol <= 0) return 0
  const M_kgmol = M_gmol / 1000
  return Math.sqrt(3 * R * T / M_kgmol)
}

// ===== AVERAGE SPEED =====
// v_avg = sqrt(8RT/(πM))  (NCERT Class 11 Ch.13)

export function avgSpeed(T: number, M_gmol: number): number {
  if (!Number.isFinite(T) || !Number.isFinite(M_gmol)) return 0
  if (T <= 0 || M_gmol <= 0) return 0
  const M_kgmol = M_gmol / 1000
  return Math.sqrt(8 * R * T / (Math.PI * M_kgmol))
}

// ===== MOST PROBABLE SPEED =====
// v_mp = sqrt(2RT/M)  (NCERT Class 11 Ch.13)

export function mostProbableSpeed(T: number, M_gmol: number): number {
  if (!Number.isFinite(T) || !Number.isFinite(M_gmol)) return 0
  if (T <= 0 || M_gmol <= 0) return 0
  const M_kgmol = M_gmol / 1000
  return Math.sqrt(2 * R * T / M_kgmol)
}

// ===== MEAN FREE PATH =====
// λ = kT/(√2 π d² P)  (NCERT Class 11 Ch.13, Eq 13.29)
// d = molecular diameter in meters

export function meanFreePath(T: number, P: number, d_nm: number): number {
  if (!Number.isFinite(T) || !Number.isFinite(P) || !Number.isFinite(d_nm)) return 0
  if (T <= 0 || P <= 0 || d_nm <= 0) return 0
  const d_m = d_nm * 1e-9
  return (k_B * T) / (Math.SQRT2 * Math.PI * d_m * d_m * P)
}

// ===== EFFECTIVE VOLUME =====
// For piston mode (thermoType=1), volume scales with piston position.
// pistonPos=1.0 means full volume, pistonPos=0.5 means half volume.

export function effectiveVolume(params: Record<string, number>): number {
  const V = params.volume ?? 22.4
  const thermoType = params.thermoType ?? 0
  if (thermoType === 1) {
    const pistonPos = params.pistonPos ?? 1.0
    return V * pistonPos
  }
  return V
}

// ===== STATE AT TIME =====
// For thermodynamics, the state represents equilibrium macroscopic properties.
// t parameter tracks elapsed simulation time but doesn't affect equilibrium values.
// x = volume (L), y = pressure (kPa), vx = rms speed, vy = avg KE

export function thermoStateAtTime(params: Record<string, number>, t: number): SimulationState {
  if (!Number.isFinite(t)) return ZERO_STATE

  const n = params.moles ?? 1
  const T = params.temperature ?? 300
  const V = effectiveVolume(params)
  const M = params.molarMass ?? 28

  if (!Number.isFinite(n) || !Number.isFinite(T) || !Number.isFinite(V) || !Number.isFinite(M)) {
    return ZERO_STATE
  }

  const P = idealGasPressure(n, T, V)
  const vrms = rmsSpeed(T, M)

  return {
    t,
    x: V,
    y: P / 1000,
    vx: vrms,
    vy: avgKineticEnergy(T),
    phase: t === 0 ? 'ready' : 'flying',
  }
}

// ===== TIME OF FLIGHT =====
// Continuous simulation - no fixed endpoint

export function thermoTimeOfFlight(_params: Record<string, number>): number {
  return 9999
}

// ===== DERIVED VALUES =====

export function thermoDerivedValues(
  params: Record<string, number>,
  _state: SimulationState,
): Record<string, PhysicsValue> {
  const n = params.moles ?? 1
  const T = params.temperature ?? 300
  const V = effectiveVolume(params)
  const M = params.molarMass ?? 28

  const P = idealGasPressure(n, T, V)
  const ke = avgKineticEnergy(T)
  const vrms = rmsSpeed(T, M)
  const vavg = avgSpeed(T, M)
  const keTotal = totalKineticEnergy(n, T)

  const PV = P * (V / 1000)

  return {
    pressure: {
      value: P / 1000,
      unit: 'kPa',
      symbol: 'P',
      label: 'Pressure',
    },
    pv: {
      value: PV,
      unit: 'J',
      symbol: 'PV',
      label: 'PV Product',
    },
    avgKE: {
      value: ke * 1e21,
      unit: '×10⁻²¹ J',
      symbol: '⟨KE⟩ₜᵣ',
      label: 'Avg translational KE',
    },
    rmsSpeed: {
      value: vrms,
      unit: 'm/s',
      symbol: 'vᵣₘₛ',
      label: 'RMS Speed',
    },
    avgSpeed: {
      value: vavg,
      unit: 'm/s',
      symbol: 'vₐᵥg',
      label: 'Avg Speed',
    },
    totalKE: {
      value: keTotal,
      unit: 'J',
      symbol: 'KEₜ',
      label: 'Total KE',
    },
  }
}

// ===== TRAJECTORY BOUNDS =====
// Not trajectory-based; returns fixed container bounds

export function thermoTrajectoryBounds(_params: Record<string, number>): CanvasBounds {
  return {
    xMin: 0,
    xMax: 100,
    yMin: 0,
    yMax: 100,
    scale: 1,
  }
}

// ===== PARTICLE SIMULATION =====

export interface GasParticle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  mass: number
  isBig?: boolean
}

export function initParticles(
  count: number,
  containerW: number,
  containerH: number,
  temperature: number,
  molarMass: number,
): GasParticle[] {
  const speedScale = 0.3 * Math.sqrt(temperature / molarMass)
  const particles: GasParticle[] = []
  const r = 3

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * 2 * Math.PI
    const speed = speedScale * (0.5 + Math.random())
    particles.push({
      x: r + Math.random() * (containerW - 2 * r),
      y: r + Math.random() * (containerH - 2 * r),
      vx: speed * Math.cos(angle),
      vy: speed * Math.sin(angle),
      radius: r,
      mass: 1,
    })
  }

  return particles
}

export function initBrownianParticles(
  smallCount: number,
  containerW: number,
  containerH: number,
  temperature: number,
  molarMass: number,
): GasParticle[] {
  const particles = initParticles(smallCount, containerW, containerH, temperature, molarMass)
  const bigR = 12
  particles.push({
    x: containerW / 2,
    y: containerH / 2,
    vx: 0,
    vy: 0,
    radius: bigR,
    mass: 20,
    isBig: true,
  })
  return particles
}

export function stepParticles(
  particles: GasParticle[],
  dt: number,
  containerW: number,
  containerH: number,
  rightWall?: number,
): void {
  const rw = rightWall ?? containerW

  for (const p of particles) {
    p.x += p.vx * dt
    p.y += p.vy * dt

    // Wall collisions
    if (p.x - p.radius < 0) {
      p.x = p.radius
      p.vx = Math.abs(p.vx)
    }
    if (p.x + p.radius > rw) {
      p.x = rw - p.radius
      p.vx = -Math.abs(p.vx)
    }
    if (p.y - p.radius < 0) {
      p.y = p.radius
      p.vy = Math.abs(p.vy)
    }
    if (p.y + p.radius > containerH) {
      p.y = containerH - p.radius
      p.vy = -Math.abs(p.vy)
    }
  }

  // Particle-particle collisions (elastic)
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const a = particles[i]
      const b = particles[j]
      const dx = b.x - a.x
      const dy = b.y - a.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      const minDist = a.radius + b.radius

      if (dist < minDist && dist > 0) {
        // Normal vector
        const nx = dx / dist
        const ny = dy / dist

        // Relative velocity along collision normal
        const dvx = a.vx - b.vx
        const dvy = a.vy - b.vy
        const dvn = dvx * nx + dvy * ny

        if (dvn > 0) {
          // Elastic collision impulse
          const totalMass = a.mass + b.mass
          const impulse = (2 * dvn) / totalMass

          a.vx -= impulse * b.mass * nx
          a.vy -= impulse * b.mass * ny
          b.vx += impulse * a.mass * nx
          b.vy += impulse * a.mass * ny

          // Separate particles
          const overlap = minDist - dist
          const sepX = (overlap / 2 + 0.5) * nx
          const sepY = (overlap / 2 + 0.5) * ny
          a.x -= sepX
          a.y -= sepY
          b.x += sepX
          b.y += sepY
        }
      }
    }
  }
}

export function rescaleParticleSpeeds(
  particles: GasParticle[],
  oldTemp: number,
  newTemp: number,
): void {
  if (oldTemp <= 0 || newTemp <= 0) return
  const factor = Math.sqrt(newTemp / oldTemp)
  for (const p of particles) {
    if (!p.isBig) {
      p.vx *= factor
      p.vy *= factor
    }
  }
}

export function measureTemperature(particles: GasParticle[]): number {
  let totalKE = 0
  let count = 0
  for (const p of particles) {
    if (!p.isBig) {
      totalKE += 0.5 * p.mass * (p.vx * p.vx + p.vy * p.vy)
      count++
    }
  }
  if (count === 0) return 0
  return totalKE / count
}
