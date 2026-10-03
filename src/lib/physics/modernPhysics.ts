import { type SimulationState, type PhysicsValue, type CanvasBounds } from './types'

// =====================================================
// MODERN PHYSICS - NCERT Class 12 Ch.11-13
// =====================================================

// ===== CONSTANTS =====
export const h = 6.626e-34        // Planck's constant (J.s)
export const eV = 1.602e-19       // 1 eV in Joules
export const c = 3e8              // Speed of light (m/s)
export const me = 9.109e-31       // Electron mass (kg)
export const a0 = 0.529e-10       // Bohr radius (m)
export const R_inf = 1.097e7      // Rydberg constant (1/m)
export const ln2 = Math.LN2

// ===== PHOTOELECTRIC EFFECT (NCERT Class 12 Ch.11) =====
// Einstein's equation: KE_max = hf - phi
// Threshold frequency: f0 = phi / h
// Stopping potential: V0 = KE_max / e = (hf - phi) / e

export function thresholdFrequency(workFunction_eV: number): number {
  return (workFunction_eV * eV) / h // Hz
}

export function thresholdWavelength(workFunction_eV: number): number {
  const f0 = thresholdFrequency(workFunction_eV)
  if (f0 <= 0) return Infinity
  return (c / f0) * 1e9 // nm
}

export function photonEnergy_eV(wavelength_nm: number): number {
  if (wavelength_nm <= 0) return 0
  const lambda = wavelength_nm * 1e-9
  return (h * c) / (lambda * eV)
}

export function maxKE_eV(wavelength_nm: number, workFunction_eV: number): number {
  const E_photon = photonEnergy_eV(wavelength_nm)
  const ke = E_photon - workFunction_eV
  return Math.max(0, ke)
}

export function stoppingPotential(wavelength_nm: number, workFunction_eV: number): number {
  return maxKE_eV(wavelength_nm, workFunction_eV) // V0 = KE_max / e, and KE_max is already in eV
}

export function photocurrent(
  intensity: number, wavelength_nm: number, workFunction_eV: number
): number {
  const ke = maxKE_eV(wavelength_nm, workFunction_eV)
  if (ke <= 0) return 0
  return intensity // proportional to intensity when above threshold
}

export function maxElectronSpeed(wavelength_nm: number, workFunction_eV: number): number {
  const ke_J = maxKE_eV(wavelength_nm, workFunction_eV) * eV
  if (ke_J <= 0) return 0
  return Math.sqrt(2 * ke_J / me) // v = sqrt(2KE/m)
}

// Work functions of common metals (eV) - NCERT Table 11.1
export const WORK_FUNCTIONS: Record<string, number> = {
  Cs: 2.14,
  K: 2.30,
  Na: 2.75,
  Ca: 2.90,
  Zn: 3.63,
  Ag: 4.28,
  Cu: 4.65,
  Fe: 4.50,
  Pt: 5.65,
  Al: 4.08,
}

// ===== BOHR MODEL (NCERT Class 12 Ch.12) =====
// En = -13.6 / n^2 eV (hydrogen atom)
// rn = n^2 * a0 (Bohr radius * n^2)
// Transition: photon energy = |E_upper - E_lower|
// wavelength: 1/lambda = R_inf * (1/n_lower^2 - 1/n_upper^2)

export function bohrEnergy(n: number, Z: number = 1): number {
  if (n < 1) return 0
  return -13.6 * Z * Z / (n * n) // eV
}

export function bohrRadius(n: number, Z: number = 1): number {
  if (n < 1) return 0
  return (n * n * a0) / Z // meters
}

export function bohrRadiusPm(n: number, Z: number = 1): number {
  return bohrRadius(n, Z) * 1e12 // picometers
}

export function transitionEnergy(nUpper: number, nLower: number, Z: number = 1): number {
  if (nUpper <= nLower || nLower < 1) return 0
  return Math.abs(bohrEnergy(nLower, Z) - bohrEnergy(nUpper, Z)) // eV
}

export function transitionWavelength(nUpper: number, nLower: number, Z: number = 1): number {
  const dE = transitionEnergy(nUpper, nLower, Z)
  if (dE <= 0) return Infinity
  const dE_J = dE * eV
  return (h * c / dE_J) * 1e9 // nm
}

export function electronSpeed(n: number, Z: number = 1): number {
  if (n < 1) return 0
  return (2.18e6 * Z) / n // m/s (from v_n = e^2/(2*epsilon0*h) * Z/n)
}

// Spectral series
export type SpectralSeries = 'lyman' | 'balmer' | 'paschen' | 'brackett'

export function seriesTransitions(series: SpectralSeries, Z: number = 1): Array<{
  nUpper: number; nLower: number; wavelength_nm: number; energy_eV: number
}> {
  const nLowerMap: Record<SpectralSeries, number> = {
    lyman: 1, balmer: 2, paschen: 3, brackett: 4
  }
  const nLower = nLowerMap[series]
  const result = []
  for (let nUp = nLower + 1; nUp <= nLower + 5; nUp++) {
    result.push({
      nUpper: nUp,
      nLower,
      wavelength_nm: transitionWavelength(nUp, nLower, Z),
      energy_eV: transitionEnergy(nUp, nLower, Z),
    })
  }
  return result
}

// ===== RADIOACTIVE DECAY (NCERT Class 12 Ch.13) =====
// N(t) = N0 * exp(-lambda * t)
// lambda = ln2 / T_half
// Activity A(t) = lambda * N(t) = A0 * exp(-lambda * t)

export function decayConstant(halfLife: number): number {
  if (halfLife <= 0) return 0
  return ln2 / halfLife
}

export function nucleiRemaining(N0: number, lambda: number, t: number): number {
  if (lambda <= 0 || t < 0) return N0
  return N0 * Math.exp(-lambda * t)
}

export function activity(N0: number, lambda: number, t: number): number {
  return lambda * nucleiRemaining(N0, lambda, t)
}

export function halfLivesElapsed(lambda: number, t: number): number {
  if (lambda <= 0) return 0
  const T_half = ln2 / lambda
  return t / T_half
}

export function nucleiDecayed(N0: number, lambda: number, t: number): number {
  return N0 - nucleiRemaining(N0, lambda, t)
}

export function timeForFraction(fraction: number, lambda: number): number {
  if (lambda <= 0 || fraction <= 0 || fraction >= 1) return 0
  return -Math.log(1 - fraction) / lambda
}

// Common isotopes half-lives (seconds)
export const HALF_LIVES: Record<string, { halfLife: number; unit: string; displayHL: string }> = {
  'C-14':   { halfLife: 5730 * 365.25 * 24 * 3600, unit: 'years', displayHL: '5730 years' },
  'I-131':  { halfLife: 8.02 * 24 * 3600, unit: 'days', displayHL: '8.02 days' },
  'Co-60':  { halfLife: 5.27 * 365.25 * 24 * 3600, unit: 'years', displayHL: '5.27 years' },
  'Ra-226': { halfLife: 1600 * 365.25 * 24 * 3600, unit: 'years', displayHL: '1600 years' },
  'Po-210': { halfLife: 138.4 * 24 * 3600, unit: 'days', displayHL: '138.4 days' },
  'U-238':  { halfLife: 4.47e9 * 365.25 * 24 * 3600, unit: 'years', displayHL: '4.47 billion years' },
}

// ===== SIMULATION INTERFACE =====
// modernType: 0=photoelectric, 1=bohr, 2=decay, 3=free-play

export function modernStateAtTime(params: Record<string, number>, t: number): SimulationState {
  const modernType = params.modernType ?? 0

  if (modernType === 0) {
    // Photoelectric: x represents photon position traveling toward metal
    const wavelength = params.wavelength ?? 400
    const phi = params.workFunction ?? 2.14
    const ke = maxKE_eV(wavelength, phi)
    const emitting = ke > 0

    const period = 2 // full cycle period
    const tNorm = t % period
    const photonPhase = Math.min(tNorm / 1.0, 1.0) // photon hits at t=1

    if (tNorm < 1.0) {
      return { t, x: photonPhase, y: 0, vx: 1, vy: 0, phase: 'flying' }
    }
    if (emitting) {
      const electronPhase = (tNorm - 1.0) / 1.0
      return { t, x: 1, y: electronPhase, vx: 0, vy: ke, phase: 'flying' }
    }
    return { t, x: 1, y: 0, vx: 0, vy: 0, phase: 'flying' }
  }

  if (modernType === 1) {
    // Bohr: x represents electron orbit angle
    const n = params.orbitN ?? 1
    const Z = params.atomicZ ?? 1
    const r = bohrRadiusPm(n, Z) // picometers
    const v = electronSpeed(n, Z)
    const angularSpeed = v / bohrRadius(n, Z)
    const angle = (angularSpeed * t) % (2 * Math.PI)
    return { t, x: angle, y: r, vx: v, vy: 0, phase: 'flying' }
  }

  if (modernType === 2) {
    // Decay: x = fraction remaining, y = fraction decayed
    const halfLife = params.halfLife ?? 1
    const lambda = decayConstant(halfLife)
    const N0 = params.N0 ?? 1000
    const remaining = nucleiRemaining(N0, lambda, t)
    const decayed = N0 - remaining
    return { t, x: remaining / N0, y: decayed / N0, vx: lambda, vy: 0, phase: 'flying' }
  }

  // Free play: same as photoelectric by default
  return modernStateAtTime({ ...params, modernType: 0 }, t)
}

export function modernTimeOfFlight(params: Record<string, number>): number {
  const modernType = params.modernType ?? 0
  if (modernType === 0) return 10 // photoelectric cycles
  if (modernType === 1) return 10 // Bohr orbiting
  if (modernType === 2) {
    const halfLife = params.halfLife ?? 1
    return halfLife * 5 // show 5 half-lives
  }
  return 10
}

export function modernDerivedValues(
  params: Record<string, number>,
  state: SimulationState,
): Record<string, PhysicsValue> {
  const modernType = params.modernType ?? 0

  if (modernType === 0) {
    const wavelength = params.wavelength ?? 400
    const phi = params.workFunction ?? 2.14
    const Eph = photonEnergy_eV(wavelength)
    const ke = maxKE_eV(wavelength, phi)
    const V0 = stoppingPotential(wavelength, phi)
    const f0 = thresholdFrequency(phi)
    const lambda0 = thresholdWavelength(phi)
    const vMax = maxElectronSpeed(wavelength, phi)
    const emitting = ke > 0

    return {
      photonEnergy: { value: Eph, unit: 'eV', symbol: 'E', label: 'Photon Energy' },
      maxKE: { value: ke, unit: 'eV', symbol: 'KE_max', label: 'Max KE' },
      stoppingV: { value: V0, unit: 'V', symbol: 'V₀', label: 'Stopping Potential' },
      thresholdFreq: { value: f0 / 1e14, unit: 'x10¹⁴ Hz', symbol: 'f₀', label: 'Threshold Freq' },
      thresholdWL: { value: lambda0, unit: 'nm', symbol: 'λ₀', label: 'Threshold λ' },
      maxSpeed: { value: vMax / 1e5, unit: 'x10⁵ m/s', symbol: 'v_max', label: 'Max Speed' },
      emission: { value: emitting ? 1 : 0, unit: '', symbol: '', label: emitting ? 'Emitting' : 'No emission' },
    }
  }

  if (modernType === 1) {
    const n = params.orbitN ?? 1
    const Z = params.atomicZ ?? 1
    const E = bohrEnergy(n, Z)
    const r = bohrRadiusPm(n, Z)
    const v = electronSpeed(n, Z)
    const nUpper = params.transitionFrom ?? 3
    const nLower = params.transitionTo ?? 2

    const dE = nUpper > nLower ? transitionEnergy(nUpper, nLower, Z) : 0
    const lambda = nUpper > nLower ? transitionWavelength(nUpper, nLower, Z) : 0

    return {
      energy: { value: E, unit: 'eV', symbol: 'E_n', label: 'Energy Level' },
      radius: { value: r, unit: 'pm', symbol: 'r_n', label: 'Orbit Radius' },
      speed: { value: v / 1e6, unit: 'x10⁶ m/s', symbol: 'v_n', label: 'Electron Speed' },
      transitionE: { value: dE, unit: 'eV', symbol: 'ΔE', label: 'Transition Energy' },
      transitionWL: { value: lambda, unit: 'nm', symbol: 'λ', label: 'Emitted λ' },
    }
  }

  if (modernType === 2) {
    const halfLife = params.halfLife ?? 1
    const N0 = params.N0 ?? 1000
    const lambda = decayConstant(halfLife)
    const t = state.t
    const N = nucleiRemaining(N0, lambda, t)
    const A = activity(N0, lambda, t)
    const nHL = halfLivesElapsed(lambda, t)
    const Nd = nucleiDecayed(N0, lambda, t)

    return {
      remaining: { value: Math.round(N), unit: '', symbol: 'N', label: 'Nuclei Remaining' },
      decayed: { value: Math.round(Nd), unit: '', symbol: 'N_d', label: 'Nuclei Decayed' },
      activityVal: { value: A, unit: '/s', symbol: 'A', label: 'Activity' },
      halfLives: { value: nHL, unit: '', symbol: 'n', label: 'Half-lives Elapsed' },
      fractionLeft: { value: N / N0, unit: '', symbol: 'N/N₀', label: 'Fraction Remaining' },
    }
  }

  // Free play: show photoelectric values
  return modernDerivedValues({ ...params, modernType: 0 }, state)
}

export function modernTrajectoryBounds(params: Record<string, number>): CanvasBounds {
  const modernType = params.modernType ?? 0

  if (modernType === 0) {
    return { xMin: -1, xMax: 11, yMin: -2, yMax: 8, scale: 1 }
  }
  if (modernType === 1) {
    const n = Math.max(params.orbitN ?? 1, params.transitionFrom ?? 3)
    const maxR = n * n // relative orbit radius
    return { xMin: -maxR - 2, xMax: maxR + 2, yMin: -maxR - 2, yMax: maxR + 2, scale: 1 }
  }
  if (modernType === 2) {
    const halfLife = params.halfLife ?? 1
    const N0 = params.N0 ?? 1000
    return { xMin: -halfLife * 0.2, xMax: halfLife * 5.2, yMin: -N0 * 0.05, yMax: N0 * 1.1, scale: 1 }
  }
  return { xMin: -1, xMax: 11, yMin: -2, yMax: 8, scale: 1 }
}
