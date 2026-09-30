import { describe, it, expect } from 'vitest'
import {
  coulombForce,
  electricFieldMagnitude,
  electricFieldAt,
  seriesResistance,
  parallelResistance,
  ohmsCurrent,
  electricPower,
  elecStateAtTime,
  elecTimeOfFlight,
  elecDerivedValues,
} from '@/lib/physics/electrostatics'

// k = 8.99e9 N⋅m²/C²

// ===== COULOMB'S LAW GOLDEN VALUES =====

describe('coulomb force golden values', () => {
  it('two +1 μC charges at 1 m', () => {
    // F = 8.99e9 * 1e-6 * 1e-6 / 1² = 8.99e-3 N
    expect(coulombForce(1, 1, 1)).toBeCloseTo(8.99e-3, 5)
  })

  it('opposite charges give negative (attractive) force', () => {
    // F = 8.99e9 * 1e-6 * (-1e-6) / 1² = -8.99e-3 N
    expect(coulombForce(1, -1, 1)).toBeCloseTo(-8.99e-3, 5)
  })

  it('+2 μC and -3 μC at 0.5 m', () => {
    // F = 8.99e9 * 2e-6 * (-3e-6) / 0.25 = -0.21576 N
    const f = coulombForce(2, -3, 0.5)
    expect(f).toBeCloseTo(-0.21576, 4)
    expect(f).toBeLessThan(0)
  })

  it('same sign gives positive (repulsive) force', () => {
    expect(coulombForce(2, 3, 0.5)).toBeGreaterThan(0)
  })

  it('inverse square: doubling distance quarters force', () => {
    const f1 = coulombForce(1, 1, 1)
    const f2 = coulombForce(1, 1, 2)
    expect(f2).toBeCloseTo(f1 / 4, 6)
  })

  it('force proportional to charges', () => {
    const f1 = coulombForce(1, 1, 1)
    const f2 = coulombForce(2, 1, 1)
    expect(f2).toBeCloseTo(f1 * 2, 6)
  })
})

describe('coulomb force edge cases', () => {
  it('zero distance returns 0', () => {
    expect(coulombForce(1, 1, 0)).toBe(0)
  })

  it('negative distance returns 0', () => {
    expect(coulombForce(1, 1, -1)).toBe(0)
  })

  it('NaN charge returns 0', () => {
    expect(coulombForce(NaN, 1, 1)).toBe(0)
  })

  it('NaN distance returns 0', () => {
    expect(coulombForce(1, 1, NaN)).toBe(0)
  })

  it('zero charge returns 0', () => {
    expect(coulombForce(0, 1, 1)).toBe(0)
  })

  it('very large charges no NaN', () => {
    const f = coulombForce(10, 10, 0.05)
    expect(Number.isFinite(f)).toBe(true)
    expect(f).toBeGreaterThan(0)
  })

  it('very small distance no NaN', () => {
    const f = coulombForce(1, 1, 0.01)
    expect(Number.isFinite(f)).toBe(true)
  })
})

// ===== ELECTRIC FIELD GOLDEN VALUES =====

describe('electric field magnitude', () => {
  it('1 μC at 1 m', () => {
    // E = 8.99e9 * 1e-6 / 1² = 8990 N/C
    expect(electricFieldMagnitude(1, 1)).toBeCloseTo(8990, 0)
  })

  it('negative charge gives same magnitude', () => {
    expect(electricFieldMagnitude(-2, 0.5)).toBeCloseTo(electricFieldMagnitude(2, 0.5), 3)
  })

  it('zero distance returns 0', () => {
    expect(electricFieldMagnitude(1, 0)).toBe(0)
  })
})

describe('electric field at point (vector)', () => {
  it('midpoint of equal opposite charges has nonzero field', () => {
    const charges = [
      { q: 1, x: 0, y: 0 },
      { q: -1, x: 1, y: 0 },
    ]
    const field = electricFieldAt(charges, 0.5, 0)
    expect(field.magnitude).toBeGreaterThan(0)
    // Both fields point in +x (from + toward -), so ex > 0
    expect(field.ex).toBeGreaterThan(0)
  })

  it('midpoint of equal same-sign charges has zero field', () => {
    const charges = [
      { q: 1, x: 0, y: 0 },
      { q: 1, x: 1, y: 0 },
    ]
    const field = electricFieldAt(charges, 0.5, 0)
    expect(field.ex).toBeCloseTo(0, 6)
    expect(field.ey).toBeCloseTo(0, 6)
  })

  it('off-axis point has nonzero y component', () => {
    const charges = [{ q: 1, x: 0, y: 0 }]
    const field = electricFieldAt(charges, 1, 1)
    expect(field.ex).toBeGreaterThan(0)
    expect(field.ey).toBeGreaterThan(0)
  })
})

// ===== CIRCUIT ANALYSIS GOLDEN VALUES =====

describe('series resistance', () => {
  it('100 + 200 = 300', () => {
    expect(seriesResistance(100, 200)).toBe(300)
  })

  it('zero resistor', () => {
    expect(seriesResistance(0, 100)).toBe(100)
  })

  it('negative treated as zero', () => {
    expect(seriesResistance(-10, 100)).toBe(100)
  })
})

describe('parallel resistance', () => {
  it('100 and 200 in parallel', () => {
    // R = 100*200/(100+200) = 20000/300 = 66.667
    expect(parallelResistance(100, 200)).toBeCloseTo(66.667, 2)
  })

  it('two equal resistors', () => {
    // R = 100*100/200 = 50
    expect(parallelResistance(100, 100)).toBeCloseTo(50, 3)
  })

  it('parallel is always less than smallest', () => {
    const rp = parallelResistance(100, 200)
    expect(rp).toBeLessThan(100)
  })

  it('zero resistor returns 0', () => {
    expect(parallelResistance(0, 100)).toBe(0)
  })

  it('100 and 300 in parallel = 75', () => {
    expect(parallelResistance(100, 300)).toBeCloseTo(75, 3)
  })
})

describe('ohms current', () => {
  it('V=9, R=100 gives 0.09 A', () => {
    expect(ohmsCurrent(9, 100)).toBeCloseTo(0.09, 5)
  })

  it('V=12, R=200 gives 0.06 A', () => {
    expect(ohmsCurrent(12, 200)).toBeCloseTo(0.06, 5)
  })

  it('zero resistance returns 0', () => {
    expect(ohmsCurrent(9, 0)).toBe(0)
  })

  it('NaN inputs return 0', () => {
    expect(ohmsCurrent(NaN, 100)).toBe(0)
    expect(ohmsCurrent(9, NaN)).toBe(0)
  })
})

describe('electric power', () => {
  it('P = V*I = 9 * 0.09 = 0.81 W', () => {
    expect(electricPower(9, 0.09)).toBeCloseTo(0.81, 4)
  })

  it('always positive', () => {
    expect(electricPower(-9, 0.09)).toBeCloseTo(0.81, 4)
  })
})

// ===== stateAtTime =====

describe('elecStateAtTime', () => {
  it('t=0 returns ready', () => {
    const s = elecStateAtTime({ elecType: 0 }, 0)
    expect(s.phase).toBe('ready')
  })

  it('t>0 returns flying', () => {
    const s = elecStateAtTime({ elecType: 0 }, 1)
    expect(s.phase).toBe('flying')
  })

  it('x stores animation phase 0..1', () => {
    const s = elecStateAtTime({ elecType: 0 }, 5)
    expect(s.x).toBeGreaterThanOrEqual(0)
    expect(s.x).toBeLessThanOrEqual(1)
  })

  it('negative t returns zero state', () => {
    const s = elecStateAtTime({ elecType: 0 }, -1)
    expect(s.phase).toBe('ready')
  })

  it('NaN t returns zero state', () => {
    const s = elecStateAtTime({ elecType: 0 }, NaN)
    expect(s.phase).toBe('ready')
  })

  it('is pure: same inputs same outputs', () => {
    const a = elecStateAtTime({ elecType: 0, q1: 2, q2: -2, distance: 0.5 }, 3)
    const b = elecStateAtTime({ elecType: 0, q1: 2, q2: -2, distance: 0.5 }, 3)
    expect(a).toEqual(b)
  })
})

describe('elecTimeOfFlight', () => {
  it('returns positive value', () => {
    expect(elecTimeOfFlight()).toBeGreaterThan(0)
  })
})

// ===== derivedValues =====

describe('elecDerivedValues charges tab', () => {
  it('returns force for charges tab', () => {
    const d = elecDerivedValues({ elecType: 0, q1: 2, q2: -2, distance: 0.5 }, { t: 0, x: 0, y: 0, vx: 0, vy: 0, phase: 'ready' })
    expect(d.force).toBeDefined()
    expect(d.forceMag).toBeDefined()
    expect(d.force.value).toBeLessThan(0) // attractive
    expect(d.forceMag.value).toBeGreaterThan(0)
  })
})

describe('elecDerivedValues circuit tab', () => {
  it('returns current for simple circuit', () => {
    const d = elecDerivedValues({ elecType: 2, voltage: 9, r1: 100 }, { t: 0, x: 0, y: 0, vx: 0, vy: 0, phase: 'ready' })
    expect(d.current.value).toBeCloseTo(0.09, 4)
    expect(d.power.value).toBeCloseTo(0.81, 3)
  })
})

describe('elecDerivedValues series-parallel tab', () => {
  it('returns correct series and parallel values', () => {
    const d = elecDerivedValues({ elecType: 3, voltage: 12, r1: 100, r2: 100 }, { t: 0, x: 0, y: 0, vx: 0, vy: 0, phase: 'ready' })
    expect(d.rSeries.value).toBe(200)
    expect(d.rParallel.value).toBe(50)
    expect(d.iSeries.value).toBeCloseTo(0.06, 4)
    expect(d.iParallel.value).toBeCloseTo(0.24, 4)
  })

  it('parallel current is always more than series', () => {
    const d = elecDerivedValues({ elecType: 3, voltage: 9, r1: 100, r2: 200 }, { t: 0, x: 0, y: 0, vx: 0, vy: 0, phase: 'ready' })
    expect(d.iParallel.value).toBeGreaterThan(d.iSeries.value)
  })
})
