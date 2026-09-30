import { describe, it, expect } from 'vitest'
import {
  pendulumPeriod,
  pendulumFrequency,
  pendulumAngularFrequency,
  pendulumStateAtTime,
  pendulumEnergy,
  pendulumTimeOfFlight,
  springPeriod,
  springFrequency,
  springAngularFrequency,
  springStateAtTime,
  springEnergy,
  springTimeOfFlight,
} from '@/lib/physics/shm'
import type { PendulumParams, SpringParams } from '@/lib/physics/shm'

// ===== PENDULUM GOLDEN VALUES =====
// Standard: L=1m, g=9.8 m/s², θ₀=30°
// T = 2π√(L/g) = 2π√(1/9.8) = 2.0071 s
// ω = √(g/L) = √9.8 = 3.1305 rad/s
// f = 1/T = 0.4982 Hz

describe('pendulum golden values', () => {
  const std: PendulumParams = { length: 1, theta0: 30, g: 9.8, damping: 0 }

  it('period L=1, g=9.8', () => {
    expect(pendulumPeriod(std)).toBeCloseTo(2.0071, 3)
  })

  it('frequency', () => {
    expect(pendulumFrequency(std)).toBeCloseTo(0.4982, 3)
  })

  it('angular frequency', () => {
    expect(pendulumAngularFrequency(std)).toBeCloseTo(3.1305, 3)
  })

  it('period L=2, g=9.8', () => {
    // T = 2π√(2/9.8) = 2.8385
    expect(pendulumPeriod({ ...std, length: 2 })).toBeCloseTo(2.8385, 3)
  })

  it('period L=1, g=1.62 (Moon)', () => {
    // T = 2π√(1/1.62) = 4.9365
    expect(pendulumPeriod({ ...std, g: 1.62 })).toBeCloseTo(4.9365, 3)
  })

  it('timeOfFlight is 3 periods for undamped', () => {
    const T = pendulumPeriod(std)
    expect(pendulumTimeOfFlight(std)).toBeCloseTo(T * 3, 3)
  })
})

describe('pendulum stateAtTime', () => {
  const params = { length: 1, theta0: 30, g: 9.8, damping: 0 }
  const theta0Rad = 30 * Math.PI / 180
  const omega = Math.sqrt(9.8 / 1)

  it('t=0: at initial angle', () => {
    const s = pendulumStateAtTime(params, 0)
    expect(s.x).toBeCloseTo(Math.sin(theta0Rad), 4)
    expect(s.y).toBeCloseTo(1 - Math.cos(theta0Rad), 4)
    expect(s.vx).toBeCloseTo(0, 4)
    expect(s.vy).toBeCloseTo(0, 4)
    expect(s.phase).toBe('ready')
  })

  it('t=T/4: at equilibrium, max speed', () => {
    const T = 2 * Math.PI / omega
    const s = pendulumStateAtTime(params, T / 4)
    expect(s.x).toBeCloseTo(0, 2)
    expect(s.y).toBeCloseTo(0, 2)
    const maxSpeed = 1 * omega * theta0Rad
    const speed = Math.sqrt(s.vx * s.vx + s.vy * s.vy)
    expect(speed).toBeCloseTo(maxSpeed, 2)
  })

  it('t=T/2: at opposite angle', () => {
    const T = 2 * Math.PI / omega
    const s = pendulumStateAtTime(params, T / 2)
    expect(s.x).toBeCloseTo(-Math.sin(theta0Rad), 2)
    expect(s.y).toBeCloseTo(1 - Math.cos(theta0Rad), 2)
  })

  it('t=T: back to start (periodic)', () => {
    const T = 2 * Math.PI / omega
    const s = pendulumStateAtTime(params, T)
    expect(s.x).toBeCloseTo(Math.sin(theta0Rad), 2)
    expect(s.y).toBeCloseTo(1 - Math.cos(theta0Rad), 2)
  })

  it('phase is flying during oscillation', () => {
    const s = pendulumStateAtTime(params, 1)
    expect(s.phase).toBe('flying')
  })
})

describe('pendulum energy conservation', () => {
  const params = { length: 1, theta0: 30, g: 9.8, damping: 0, mass: 1 }

  it('total energy constant at t=0 vs t=T/4', () => {
    const omega = Math.sqrt(9.8 / 1)
    const T = 2 * Math.PI / omega
    const s0 = pendulumStateAtTime(params, 0)
    const s1 = pendulumStateAtTime(params, T / 4)
    const e0 = pendulumEnergy(params, s0)
    const e1 = pendulumEnergy(params, s1)
    // Small-angle approximation at 30° introduces ~2% energy variation
    expect(e0.total).toBeCloseTo(e1.total, 1)
  })

  it('KE=0 at extremes', () => {
    const s = pendulumStateAtTime(params, 0)
    const e = pendulumEnergy(params, s)
    expect(e.ke).toBeCloseTo(0, 4)
    expect(e.pe).toBeGreaterThan(0)
  })

  it('PE~0 at equilibrium', () => {
    const omega = Math.sqrt(9.8 / 1)
    const T = 2 * Math.PI / omega
    const s = pendulumStateAtTime(params, T / 4)
    const e = pendulumEnergy(params, s)
    expect(e.pe).toBeCloseTo(0, 2)
    expect(e.ke).toBeGreaterThan(0)
  })
})

describe('pendulum edge cases', () => {
  it('zero length returns ZERO_STATE', () => {
    const s = pendulumStateAtTime({ length: 0, theta0: 30, g: 9.8, damping: 0 }, 1)
    expect(s.x).toBe(0)
    expect(s.phase).toBe('ready')
  })

  it('NaN params returns ZERO_STATE', () => {
    const s = pendulumStateAtTime({ length: NaN, theta0: 30, g: 9.8, damping: 0 }, 1)
    expect(s.x).toBe(0)
  })

  it('very small angle', () => {
    const s = pendulumStateAtTime({ length: 1, theta0: 1, g: 9.8, damping: 0 }, 0.5)
    expect(Number.isFinite(s.x)).toBe(true)
    expect(Number.isFinite(s.y)).toBe(true)
  })

  it('large angle (60 deg) does not NaN', () => {
    const s = pendulumStateAtTime({ length: 1, theta0: 60, g: 9.8, damping: 0 }, 0.5)
    expect(Number.isFinite(s.x)).toBe(true)
  })

  it('damped pendulum decays to zero', () => {
    const s = pendulumStateAtTime({ length: 1, theta0: 30, g: 9.8, damping: 0.5 }, 20)
    expect(s.phase).toBe('landed')
    expect(s.x).toBe(0)
  })
})

// ===== SPRING GOLDEN VALUES =====
// Standard: k=10 N/m, m=1 kg, A=0.2 m
// T = 2π√(m/k) = 2π√(1/10) = 1.9869 s
// ω = √(k/m) = √10 = 3.1623 rad/s
// f = 1/T = 0.5033 Hz

describe('spring golden values', () => {
  const std: SpringParams = { k: 10, mass: 1, amplitude: 0.2, damping: 0 }

  it('period k=10, m=1', () => {
    expect(springPeriod(std)).toBeCloseTo(1.9869, 3)
  })

  it('frequency', () => {
    expect(springFrequency(std)).toBeCloseTo(0.5033, 3)
  })

  it('angular frequency', () => {
    expect(springAngularFrequency(std)).toBeCloseTo(3.1623, 3)
  })

  it('period k=100, m=1 (stiffer spring)', () => {
    expect(springPeriod({ ...std, k: 100 })).toBeCloseTo(0.6283, 3)
  })

  it('period k=10, m=5 (heavier mass)', () => {
    expect(springPeriod({ ...std, mass: 5 })).toBeCloseTo(4.4429, 3)
  })

  it('timeOfFlight is 3 periods for undamped', () => {
    const T = springPeriod(std)
    expect(springTimeOfFlight(std)).toBeCloseTo(T * 3, 3)
  })
})

describe('spring stateAtTime', () => {
  const params = { k: 10, mass: 1, amplitude: 0.2, damping: 0 }
  const omega = Math.sqrt(10 / 1)

  it('t=0: at max displacement', () => {
    const s = springStateAtTime(params, 0)
    expect(s.x).toBeCloseTo(0.2, 4)
    expect(s.vx).toBeCloseTo(0, 4)
    expect(s.y).toBe(0)
    expect(s.phase).toBe('ready')
  })

  it('t=T/4: at equilibrium, max speed', () => {
    const T = 2 * Math.PI / omega
    const s = springStateAtTime(params, T / 4)
    expect(s.x).toBeCloseTo(0, 2)
    const maxSpeed = 0.2 * omega
    expect(Math.abs(s.vx)).toBeCloseTo(maxSpeed, 2)
  })

  it('t=T/2: at opposite extreme', () => {
    const T = 2 * Math.PI / omega
    const s = springStateAtTime(params, T / 2)
    expect(s.x).toBeCloseTo(-0.2, 2)
    expect(s.vx).toBeCloseTo(0, 2)
  })

  it('t=T: back to start', () => {
    const T = 2 * Math.PI / omega
    const s = springStateAtTime(params, T)
    expect(s.x).toBeCloseTo(0.2, 2)
    expect(s.vx).toBeCloseTo(0, 2)
  })

  it('velocity is negative at T/4 (moving left)', () => {
    const T = 2 * Math.PI / omega
    const s = springStateAtTime(params, T / 4)
    expect(s.vx).toBeLessThan(0)
  })
})

describe('spring energy conservation', () => {
  const params = { k: 10, mass: 1, amplitude: 0.2, damping: 0 }

  it('total energy = ½kA² at all times', () => {
    const expectedTotal = 0.5 * 10 * 0.2 * 0.2
    const omega = Math.sqrt(10)
    const T = 2 * Math.PI / omega

    for (const frac of [0, 0.1, 0.25, 0.37, 0.5, 0.75, 1.0]) {
      const s = springStateAtTime(params, T * frac)
      const e = springEnergy(params, s)
      expect(e.total).toBeCloseTo(expectedTotal, 3)
    }
  })

  it('KE=0 at extremes (t=0)', () => {
    const s = springStateAtTime(params, 0)
    const e = springEnergy(params, s)
    expect(e.ke).toBeCloseTo(0, 6)
    expect(e.pe).toBeCloseTo(0.5 * 10 * 0.04, 6)
  })

  it('PE=0 at equilibrium (t=T/4)', () => {
    const omega = Math.sqrt(10)
    const T = 2 * Math.PI / omega
    const s = springStateAtTime(params, T / 4)
    const e = springEnergy(params, s)
    expect(e.pe).toBeCloseTo(0, 2)
    expect(e.ke).toBeCloseTo(0.5 * 10 * 0.04, 2)
  })
})

describe('spring edge cases', () => {
  it('zero k returns ZERO_STATE', () => {
    const s = springStateAtTime({ k: 0, mass: 1, amplitude: 0.2, damping: 0 }, 1)
    expect(s.x).toBe(0)
  })

  it('zero mass returns ZERO_STATE', () => {
    const s = springStateAtTime({ k: 10, mass: 0, amplitude: 0.2, damping: 0 }, 1)
    expect(s.x).toBe(0)
  })

  it('NaN params returns ZERO_STATE', () => {
    const s = springStateAtTime({ k: NaN, mass: 1, amplitude: 0.2, damping: 0 }, 1)
    expect(s.x).toBe(0)
  })

  it('very small amplitude no NaN', () => {
    const s = springStateAtTime({ k: 10, mass: 1, amplitude: 0.001, damping: 0 }, 0.5)
    expect(Number.isFinite(s.x)).toBe(true)
  })

  it('very stiff spring (k=1000)', () => {
    const s = springStateAtTime({ k: 1000, mass: 0.1, amplitude: 0.05, damping: 0 }, 0.01)
    expect(Number.isFinite(s.x)).toBe(true)
    expect(Number.isFinite(s.vx)).toBe(true)
  })

  it('damped spring decays', () => {
    const s = springStateAtTime({ k: 10, mass: 1, amplitude: 0.2, damping: 2 }, 20)
    expect(s.phase).toBe('landed')
    expect(s.x).toBe(0)
  })
})

describe('pendulum stateAtTime is pure', () => {
  it('same inputs produce same outputs', () => {
    const params = { length: 1, theta0: 30, g: 9.8, damping: 0 }
    const a = pendulumStateAtTime(params, 1.5)
    const b = pendulumStateAtTime(params, 1.5)
    expect(a).toEqual(b)
  })
})

describe('spring stateAtTime is pure', () => {
  it('same inputs produce same outputs', () => {
    const params = { k: 10, mass: 1, amplitude: 0.2, damping: 0 }
    const a = springStateAtTime(params, 1.5)
    const b = springStateAtTime(params, 1.5)
    expect(a).toEqual(b)
  })
})
