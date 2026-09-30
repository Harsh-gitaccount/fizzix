import { describe, it, expect } from 'vitest'
import {
  thresholdFrequency,
  thresholdWavelength,
  photonEnergy_eV,
  maxKE_eV,
  stoppingPotential,
  maxElectronSpeed,
  bohrEnergy,
  bohrRadiusPm,
  transitionEnergy,
  transitionWavelength,
  electronSpeed,
  seriesTransitions,
  decayConstant,
  nucleiRemaining,
  activity,
  halfLivesElapsed,
  nucleiDecayed,
  timeForFraction,
  modernStateAtTime,
  modernDerivedValues,
  modernTimeOfFlight,
  h, eV, c, me, a0, ln2,
} from '@/lib/physics/modernPhysics'

// ===== PHOTOELECTRIC EFFECT (NCERT Class 12 Ch.11) =====
describe('photoelectric: Einstein equation KE_max = hf - phi', () => {
  it('threshold frequency for Cs (phi=2.14 eV)', () => {
    const f0 = thresholdFrequency(2.14)
    const expected = (2.14 * eV) / h
    expect(f0).toBeCloseTo(expected, -5)
    expect(f0 / 1e14).toBeCloseTo(5.16, 1) // ~5.16 x 10^14 Hz
  })

  it('threshold wavelength for Cs (phi=2.14 eV) ~ 580 nm', () => {
    const lambda0 = thresholdWavelength(2.14)
    expect(lambda0).toBeCloseTo(580, -1) // approximately 580 nm
  })

  it('photon energy at 400 nm ~ 3.1 eV', () => {
    const E = photonEnergy_eV(400)
    expect(E).toBeCloseTo(3.1, 1)
  })

  it('photon energy at 200 nm ~ 6.2 eV', () => {
    const E = photonEnergy_eV(200)
    expect(E).toBeCloseTo(6.2, 1)
  })

  it('KE_max for 400nm on Cs (phi=2.14) ~ 0.96 eV', () => {
    const ke = maxKE_eV(400, 2.14)
    expect(ke).toBeCloseTo(0.96, 1)
  })

  it('KE_max = 0 when photon energy < work function', () => {
    const ke = maxKE_eV(700, 2.14) // 700nm = 1.77 eV < 2.14 eV
    expect(ke).toBe(0)
  })

  it('stopping potential equals KE_max in eV', () => {
    const V0 = stoppingPotential(300, 2.14)
    const ke = maxKE_eV(300, 2.14)
    expect(V0).toBe(ke)
  })

  it('max electron speed v = sqrt(2*KE/me)', () => {
    const v = maxElectronSpeed(400, 2.14)
    const ke_J = maxKE_eV(400, 2.14) * eV
    const expected = Math.sqrt(2 * ke_J / me)
    expect(v).toBeCloseTo(expected, 0)
    expect(v / 1e5).toBeCloseTo(5.8, 0) // ~5.8 x 10^5 m/s
  })

  it('no emission when wavelength too long (below threshold)', () => {
    const ke = maxKE_eV(700, 4.65) // Cu, phi=4.65eV, 700nm=1.77eV
    expect(ke).toBe(0)
    const v = maxElectronSpeed(700, 4.65)
    expect(v).toBe(0)
  })

  it('KE_max linear with frequency (Einstein equation)', () => {
    const ke1 = maxKE_eV(300, 2.14)
    const ke2 = maxKE_eV(200, 2.14)
    const f1 = c / (300e-9)
    const f2 = c / (200e-9)
    const slope = (ke2 - ke1) / ((f2 - f1) / 1e14) // eV per 10^14 Hz
    expect(slope).toBeGreaterThan(0) // linear increasing
  })
})

// ===== BOHR MODEL (NCERT Class 12 Ch.12) =====
describe('bohr: energy levels En = -13.6/n^2 eV', () => {
  it('ground state E1 = -13.6 eV', () => {
    expect(bohrEnergy(1)).toBeCloseTo(-13.6, 1)
  })

  it('E2 = -3.4 eV', () => {
    expect(bohrEnergy(2)).toBeCloseTo(-3.4, 1)
  })

  it('E3 = -1.51 eV', () => {
    expect(bohrEnergy(3)).toBeCloseTo(-1.51, 1)
  })

  it('E4 = -0.85 eV', () => {
    expect(bohrEnergy(4)).toBeCloseTo(-0.85, 1)
  })

  it('ground state radius r1 = 53 pm (Bohr radius)', () => {
    expect(bohrRadiusPm(1)).toBeCloseTo(52.9, 0)
  })

  it('r2 = 4 * a0 = 211.6 pm', () => {
    expect(bohrRadiusPm(2)).toBeCloseTo(211.6, 0)
  })

  it('rn scales as n^2', () => {
    const r1 = bohrRadiusPm(1)
    const r3 = bohrRadiusPm(3)
    expect(r3 / r1).toBeCloseTo(9, 1)
  })

  it('Lyman alpha (2->1) transition energy = 10.2 eV', () => {
    const dE = transitionEnergy(2, 1)
    expect(dE).toBeCloseTo(10.2, 1)
  })

  it('Balmer alpha (3->2) transition energy = 1.89 eV', () => {
    const dE = transitionEnergy(3, 2)
    expect(dE).toBeCloseTo(1.89, 1)
  })

  it('Lyman alpha wavelength ~ 122 nm (UV)', () => {
    const wl = transitionWavelength(2, 1)
    expect(wl).toBeCloseTo(122, 0)
  })

  it('Balmer alpha wavelength ~ 657 nm (red)', () => {
    const wl = transitionWavelength(3, 2)
    expect(wl).toBeCloseTo(657, 0) // 13.6eV model gives 656.9
  })

  it('Balmer beta (4->2) wavelength ~ 487 nm (blue-green)', () => {
    const wl = transitionWavelength(4, 2)
    expect(wl).toBeCloseTo(487, 0) // 13.6eV model gives 486.6
  })

  it('electron speed in ground state ~ 2.18 x 10^6 m/s', () => {
    const v = electronSpeed(1)
    expect(v / 1e6).toBeCloseTo(2.18, 1)
  })

  it('He+ (Z=2): E1 = -54.4 eV', () => {
    expect(bohrEnergy(1, 2)).toBeCloseTo(-54.4, 1)
  })

  it('He+ (Z=2): r1 = a0/2 = 26.5 pm', () => {
    expect(bohrRadiusPm(1, 2)).toBeCloseTo(26.5, 0)
  })

  it('Lyman series has decreasing wavelengths', () => {
    const series = seriesTransitions('lyman')
    for (let i = 1; i < series.length; i++) {
      expect(series[i].wavelength_nm).toBeLessThan(series[i - 1].wavelength_nm)
    }
  })

  it('Balmer series is in visible range (roughly 400-700 nm)', () => {
    const series = seriesTransitions('balmer')
    expect(series[0].wavelength_nm).toBeCloseTo(657, 0) // H-alpha (656.9)
    expect(series[1].wavelength_nm).toBeCloseTo(487, 0) // H-beta (486.6)
    expect(series[2].wavelength_nm).toBeCloseTo(434, 0) // H-gamma (434.2)
  })
})

// ===== RADIOACTIVE DECAY (NCERT Class 12 Ch.13) =====
describe('decay: N(t) = N0 * exp(-lambda*t)', () => {
  it('decay constant lambda = ln2 / T_half', () => {
    const lambda = decayConstant(10)
    expect(lambda).toBeCloseTo(ln2 / 10, 6)
  })

  it('after 1 half-life, N = N0/2', () => {
    const lambda = decayConstant(10)
    const N = nucleiRemaining(1000, lambda, 10)
    expect(N).toBeCloseTo(500, 0)
  })

  it('after 2 half-lives, N = N0/4', () => {
    const lambda = decayConstant(10)
    const N = nucleiRemaining(1000, lambda, 20)
    expect(N).toBeCloseTo(250, 0)
  })

  it('after 3 half-lives, N = N0/8', () => {
    const lambda = decayConstant(10)
    const N = nucleiRemaining(1000, lambda, 30)
    expect(N).toBeCloseTo(125, 0)
  })

  it('at t=0, activity = lambda * N0', () => {
    const lambda = decayConstant(10)
    const A = activity(1000, lambda, 0)
    expect(A).toBeCloseTo(lambda * 1000, 3)
  })

  it('activity halves each half-life', () => {
    const lambda = decayConstant(10)
    const A0 = activity(1000, lambda, 0)
    const A1 = activity(1000, lambda, 10)
    expect(A1 / A0).toBeCloseTo(0.5, 3)
  })

  it('half-lives elapsed after 25s with T_half=10 is 2.5', () => {
    const lambda = decayConstant(10)
    expect(halfLivesElapsed(lambda, 25)).toBeCloseTo(2.5, 3)
  })

  it('nuclei decayed = N0 - N(t)', () => {
    const lambda = decayConstant(10)
    const Nd = nucleiDecayed(1000, lambda, 10)
    expect(Nd).toBeCloseTo(500, 0)
  })

  it('time for 75% decay (1/4 remaining) = 2 half-lives', () => {
    const lambda = decayConstant(10)
    const t = timeForFraction(0.75, lambda)
    expect(t).toBeCloseTo(20, 1)
  })

  it('time for 50% decay = 1 half-life', () => {
    const lambda = decayConstant(10)
    const t = timeForFraction(0.5, lambda)
    expect(t).toBeCloseTo(10, 3)
  })

  it('N approaches 0 after many half-lives', () => {
    const lambda = decayConstant(10)
    const N = nucleiRemaining(1000, lambda, 100)
    expect(N).toBeLessThan(1)
  })
})

// ===== stateAtTime / derivedValues / timeOfFlight =====
describe('modernStateAtTime', () => {
  it('photoelectric: state has photon position', () => {
    const state = modernStateAtTime({ modernType: 0, wavelength: 400, workFunction: 2.14 }, 0.5)
    expect(state.x).toBeCloseTo(0.5, 1) // photon midway
    expect(state.phase).toBe('flying')
  })

  it('bohr: state has orbit angle and radius', () => {
    const state = modernStateAtTime({ modernType: 1, orbitN: 2 }, 0)
    expect(state.y).toBeCloseTo(bohrRadiusPm(2), 0)
  })

  it('decay: state tracks fraction remaining', () => {
    const state = modernStateAtTime({ modernType: 2, halfLife: 10, N0: 1000 }, 10)
    expect(state.x).toBeCloseTo(0.5, 2) // half remaining
    expect(state.y).toBeCloseTo(0.5, 2) // half decayed
  })
})

describe('modernDerivedValues', () => {
  it('photoelectric: shows photon energy and max KE', () => {
    const state = modernStateAtTime({ modernType: 0, wavelength: 400, workFunction: 2.14, intensity: 50 }, 0)
    const dv = modernDerivedValues({ modernType: 0, wavelength: 400, workFunction: 2.14, intensity: 50 }, state)
    expect(dv.photonEnergy.value).toBeCloseTo(3.1, 1)
    expect(dv.maxKE.value).toBeCloseTo(0.96, 1)
    expect(dv.emission.value).toBe(1)
  })

  it('photoelectric: no emission below threshold', () => {
    const state = modernStateAtTime({ modernType: 0, wavelength: 700, workFunction: 4.65 }, 0)
    const dv = modernDerivedValues({ modernType: 0, wavelength: 700, workFunction: 4.65 }, state)
    expect(dv.maxKE.value).toBe(0)
    expect(dv.emission.value).toBe(0)
  })

  it('bohr: energy and radius for n=1', () => {
    const state = modernStateAtTime({ modernType: 1, orbitN: 1, atomicZ: 1, transitionFrom: 3, transitionTo: 2 }, 0)
    const dv = modernDerivedValues({ modernType: 1, orbitN: 1, atomicZ: 1, transitionFrom: 3, transitionTo: 2 }, state)
    expect(dv.energy.value).toBeCloseTo(-13.6, 1)
    expect(dv.radius.value).toBeCloseTo(52.9, 0)
  })

  it('decay: remaining nuclei at t=T_half', () => {
    const state = modernStateAtTime({ modernType: 2, halfLife: 10, N0: 1000 }, 10)
    const dv = modernDerivedValues({ modernType: 2, halfLife: 10, N0: 1000 }, state)
    expect(dv.remaining.value).toBeCloseTo(500, 0)
    expect(dv.halfLives.value).toBeCloseTo(1, 2)
  })
})

describe('modernTimeOfFlight', () => {
  it('photoelectric: returns 10', () => {
    expect(modernTimeOfFlight({ modernType: 0 })).toBe(10)
  })

  it('decay: returns 5 half-lives', () => {
    expect(modernTimeOfFlight({ modernType: 2, halfLife: 8 })).toBe(40)
  })
})
