import { describe, it, expect } from 'vitest'
import {
  snellsLaw,
  criticalAngle,
  lensImageDistance,
  lensMagnification,
  lensPower,
  refractionDeviation,
  opticsStateAtTime,
  opticsTimeOfFlight,
  opticsDerivedValues,
} from '@/lib/physics/optics'

// ===== SNELL'S LAW GOLDEN VALUES =====
// n₁ sin θ₁ = n₂ sin θ₂  (NCERT Class 10 Ch.10, Class 12 Ch.9)

describe('snellsLaw golden values', () => {
  it('air to glass at 30 degrees', () => {
    // n1=1, n2=1.5, θ1=30 => sin θ2 = (1/1.5) * sin(30) = 0.3333
    // θ2 = arcsin(0.3333) = 19.47 degrees
    const theta2 = snellsLaw(1, 1.5, 30)
    expect(theta2).not.toBeNull()
    expect(theta2!).toBeCloseTo(19.47, 1)
  })

  it('glass to air at 19.47 degrees (reverse of above)', () => {
    // n1=1.5, n2=1, θ1=19.47 => sin θ2 = (1.5/1) * sin(19.47) = 0.5
    // θ2 = 30 degrees
    const theta2 = snellsLaw(1.5, 1, 19.47)
    expect(theta2).not.toBeNull()
    expect(theta2!).toBeCloseTo(30, 0)
  })

  it('air to water at 45 degrees', () => {
    // n1=1, n2=1.33, θ1=45 => sin θ2 = (1/1.33) * sin(45) = 0.5318
    // θ2 = arcsin(0.5318) = 32.12 degrees
    const theta2 = snellsLaw(1, 1.33, 45)
    expect(theta2).not.toBeNull()
    expect(theta2!).toBeCloseTo(32.12, 0)
  })

  it('normal incidence (0 degrees) gives 0 degrees', () => {
    const theta2 = snellsLaw(1, 1.5, 0)
    expect(theta2).not.toBeNull()
    expect(theta2!).toBeCloseTo(0, 5)
  })

  it('air to diamond at 30 degrees', () => {
    // n1=1, n2=2.42, θ1=30 => sin θ2 = (1/2.42) * 0.5 = 0.2066
    // θ2 = arcsin(0.2066) = 11.93
    const theta2 = snellsLaw(1, 2.42, 30)
    expect(theta2).not.toBeNull()
    expect(theta2!).toBeCloseTo(11.93, 0)
  })

  it('TIR: glass to air beyond critical angle returns null', () => {
    // critical angle for glass->air = arcsin(1/1.5) = 41.81
    const theta2 = snellsLaw(1.5, 1, 45)
    expect(theta2).toBeNull()
  })

  it('same medium: angle unchanged', () => {
    const theta2 = snellsLaw(1.5, 1.5, 30)
    expect(theta2).not.toBeNull()
    expect(theta2!).toBeCloseTo(30, 3)
  })

  it('water to glass at 60 degrees', () => {
    // n1=1.33, n2=1.5, θ1=60 => sin θ2 = (1.33/1.5) * sin(60) = 0.7679
    // θ2 = arcsin(0.7679) = 50.16
    const theta2 = snellsLaw(1.33, 1.5, 60)
    expect(theta2).not.toBeNull()
    expect(theta2!).toBeCloseTo(50.16, 0)
  })
})

describe('snellsLaw edge cases', () => {
  it('NaN n1 returns null', () => {
    expect(snellsLaw(NaN, 1.5, 30)).toBeNull()
  })

  it('NaN n2 returns null', () => {
    expect(snellsLaw(1, NaN, 30)).toBeNull()
  })

  it('NaN angle returns null', () => {
    expect(snellsLaw(1, 1.5, NaN)).toBeNull()
  })

  it('zero n1 returns null', () => {
    expect(snellsLaw(0, 1.5, 30)).toBeNull()
  })

  it('negative n2 returns null', () => {
    expect(snellsLaw(1, -1.5, 30)).toBeNull()
  })

  it('90 degrees from denser to rarer: TIR', () => {
    expect(snellsLaw(1.5, 1, 90)).toBeNull()
  })
})

// ===== CRITICAL ANGLE =====
// θ_c = sin⁻¹(n₂/n₁), only when n₁ > n₂

describe('criticalAngle golden values', () => {
  it('glass to air', () => {
    // θ_c = arcsin(1/1.5) = 41.81 degrees
    const crit = criticalAngle(1.5, 1)
    expect(crit).not.toBeNull()
    expect(crit!).toBeCloseTo(41.81, 1)
  })

  it('water to air', () => {
    // θ_c = arcsin(1/1.33) = 48.75 degrees
    const crit = criticalAngle(1.33, 1)
    expect(crit).not.toBeNull()
    expect(crit!).toBeCloseTo(48.75, 0)
  })

  it('diamond to air', () => {
    // θ_c = arcsin(1/2.42) = 24.41 degrees
    const crit = criticalAngle(2.42, 1)
    expect(crit).not.toBeNull()
    expect(crit!).toBeCloseTo(24.41, 0)
  })

  it('diamond to water', () => {
    // θ_c = arcsin(1.33/2.42) = 33.33 degrees
    const crit = criticalAngle(2.42, 1.33)
    expect(crit).not.toBeNull()
    expect(crit!).toBeCloseTo(33.33, 0)
  })

  it('air to glass returns null (no TIR going to denser)', () => {
    expect(criticalAngle(1, 1.5)).toBeNull()
  })

  it('equal indices returns null', () => {
    expect(criticalAngle(1.5, 1.5)).toBeNull()
  })

  it('NaN returns null', () => {
    expect(criticalAngle(NaN, 1)).toBeNull()
  })

  it('zero n1 returns null', () => {
    expect(criticalAngle(0, 1)).toBeNull()
  })
})

// ===== THIN LENS FORMULA =====
// 1/v - 1/u = 1/f  (NCERT sign convention)

describe('lensImageDistance golden values', () => {
  it('convex lens: object at 2f (u=-30, f=15) gives v=30', () => {
    // 1/v = 1/15 + 1/(-30) = 2/30 - 1/30 = 1/30 => v = 30
    const v = lensImageDistance(-30, 15)
    expect(v).not.toBeNull()
    expect(v!).toBeCloseTo(30, 3)
  })

  it('convex lens: object at f (u=-15, f=15) gives image at infinity', () => {
    // 1/v = 1/15 + 1/(-15) = 0 => v = infinity
    const v = lensImageDistance(-15, 15)
    expect(v).toBe(Infinity)
  })

  it('convex lens: object between f and lens (u=-10, f=15) gives virtual image', () => {
    // 1/v = 1/15 + 1/(-10) = 2/30 - 3/30 = -1/30 => v = -30
    const v = lensImageDistance(-10, 15)
    expect(v).not.toBeNull()
    expect(v!).toBeCloseTo(-30, 3)
  })

  it('convex lens: object at infinity (u=-1e6, f=15) gives v near f', () => {
    const v = lensImageDistance(-1e6, 15)
    expect(v).not.toBeNull()
    expect(v!).toBeCloseTo(15, 0)
  })

  it('concave lens: always virtual image (u=-30, f=-15)', () => {
    // 1/v = 1/(-15) + 1/(-30) = -2/30 - 1/30 = -3/30 = -1/10 => v = -10
    const v = lensImageDistance(-30, -15)
    expect(v).not.toBeNull()
    expect(v!).toBeCloseTo(-10, 3)
    expect(v!).toBeLessThan(0)
  })

  it('concave lens: object at 30cm (f=-20) gives v = -12', () => {
    // 1/v = 1/(-20) + 1/(-30) = -3/60 - 2/60 = -5/60 = -1/12 => v = -12
    const v = lensImageDistance(-30, -20)
    expect(v).not.toBeNull()
    expect(v!).toBeCloseTo(-12, 3)
  })

  it('u=0 returns null', () => {
    expect(lensImageDistance(0, 15)).toBeNull()
  })

  it('f=0 returns null', () => {
    expect(lensImageDistance(-30, 0)).toBeNull()
  })

  it('NaN returns null', () => {
    expect(lensImageDistance(NaN, 15)).toBeNull()
    expect(lensImageDistance(-30, NaN)).toBeNull()
  })
})

// ===== MAGNIFICATION =====

describe('lensMagnification golden values', () => {
  it('object at 2f: m = -1 (inverted, same size)', () => {
    // u=-30, v=30 => m = 30/(-30) = -1
    expect(lensMagnification(30, -30)).toBeCloseTo(-1, 5)
  })

  it('object beyond 2f: |m| < 1 (diminished)', () => {
    // u=-60, f=15 => v=20, m = 20/(-60) = -0.333
    expect(lensMagnification(20, -60)).toBeCloseTo(-0.333, 2)
  })

  it('virtual image from convex: m > 0, |m| > 1', () => {
    // u=-10, f=15 => v=-30, m = -30/(-10) = 3
    expect(lensMagnification(-30, -10)).toBeCloseTo(3, 3)
  })

  it('concave lens: always erect and diminished', () => {
    // u=-30, f=-15 => v=-10, m = -10/(-30) = 0.333
    const m = lensMagnification(-10, -30)
    expect(m).toBeGreaterThan(0)
    expect(Math.abs(m)).toBeLessThan(1)
  })

  it('u=0 returns 0', () => {
    expect(lensMagnification(10, 0)).toBe(0)
  })

  it('NaN returns 0', () => {
    expect(lensMagnification(NaN, -30)).toBe(0)
  })
})

// ===== LENS POWER =====

describe('lensPower golden values', () => {
  it('f = 10 cm convex => P = +10 D', () => {
    expect(lensPower(10)).toBeCloseTo(10, 3)
  })

  it('f = 20 cm convex => P = +5 D', () => {
    expect(lensPower(20)).toBeCloseTo(5, 3)
  })

  it('f = -15 cm concave => P = -6.67 D', () => {
    expect(lensPower(-15)).toBeCloseTo(-6.667, 2)
  })

  it('f = 50 cm => P = +2 D', () => {
    expect(lensPower(50)).toBeCloseTo(2, 3)
  })

  it('f = 0 returns null', () => {
    expect(lensPower(0)).toBeNull()
  })

  it('NaN returns null', () => {
    expect(lensPower(NaN)).toBeNull()
  })
})

// ===== REFRACTION DEVIATION =====

describe('refractionDeviation', () => {
  it('air to glass 30 -> 19.47: deviation ~10.53', () => {
    expect(refractionDeviation(30, 19.47)).toBeCloseTo(10.53, 1)
  })

  it('normal incidence: deviation = 0', () => {
    expect(refractionDeviation(0, 0)).toBeCloseTo(0, 5)
  })

  it('null theta2 returns 0', () => {
    expect(refractionDeviation(45, null)).toBe(0)
  })
})

// ===== stateAtTime =====

describe('opticsStateAtTime', () => {
  it('t=0 returns ready', () => {
    const s = opticsStateAtTime({ opticsType: 0 }, 0)
    expect(s.phase).toBe('ready')
  })

  it('t>0 returns flying', () => {
    const s = opticsStateAtTime({ opticsType: 0 }, 1)
    expect(s.phase).toBe('flying')
  })

  it('x stores animation phase 0..1', () => {
    const s = opticsStateAtTime({ opticsType: 0 }, 5)
    expect(s.x).toBeGreaterThanOrEqual(0)
    expect(s.x).toBeLessThanOrEqual(1)
  })

  it('negative t returns zero state', () => {
    const s = opticsStateAtTime({ opticsType: 0 }, -1)
    expect(s.phase).toBe('ready')
  })

  it('NaN t returns zero state', () => {
    const s = opticsStateAtTime({ opticsType: 0 }, NaN)
    expect(s.phase).toBe('ready')
  })

  it('is pure: same inputs same outputs', () => {
    const a = opticsStateAtTime({ opticsType: 0, n1: 1, n2: 1.5, theta1: 30 }, 3)
    const b = opticsStateAtTime({ opticsType: 0, n1: 1, n2: 1.5, theta1: 30 }, 3)
    expect(a).toEqual(b)
  })
})

describe('opticsTimeOfFlight', () => {
  it('returns positive value', () => {
    expect(opticsTimeOfFlight()).toBeGreaterThan(0)
  })
})

// ===== derivedValues =====

describe('opticsDerivedValues refraction', () => {
  it('air to glass at 30 degrees', () => {
    const d = opticsDerivedValues(
      { opticsType: 0, n1: 1, n2: 1.5, theta1: 30 },
      { t: 0, x: 0, y: 0, vx: 0, vy: 0, phase: 'ready' },
    )
    expect(d.theta2).toBeDefined()
    expect(d.theta2.value).toBeCloseTo(19.47, 1)
    expect(d.deviation).toBeDefined()
  })

  it('TIR detected when angle exceeds critical', () => {
    const d = opticsDerivedValues(
      { opticsType: 0, n1: 1.5, n2: 1, theta1: 45 },
      { t: 0, x: 0, y: 0, vx: 0, vy: 0, phase: 'ready' },
    )
    expect(d.tir).toBeDefined()
    expect(d.tir.value).toBe(1)
  })
})

describe('opticsDerivedValues lenses', () => {
  it('convex lens u=-30, f=15 gives v=30, m=-1', () => {
    const d = opticsDerivedValues(
      { opticsType: 1, objectDist: -30, focalLength: 15 },
      { t: 0, x: 0, y: 0, vx: 0, vy: 0, phase: 'ready' },
    )
    expect(d.imageDistance.value).toBeCloseTo(30, 2)
    expect(d.magnification.value).toBeCloseTo(-1, 2)
    expect(d.power.value).toBeCloseTo(6.667, 2)
  })
})

describe('opticsDerivedValues TIR', () => {
  it('glass to air at 30 degrees (below critical): no TIR', () => {
    const d = opticsDerivedValues(
      { opticsType: 2, n1: 1.5, n2: 1, theta1: 30 },
      { t: 0, x: 0, y: 0, vx: 0, vy: 0, phase: 'ready' },
    )
    expect(d.isTIR.value).toBe(0)
    expect(d.criticalAngle).toBeDefined()
    expect(d.criticalAngle.value).toBeCloseTo(41.81, 1)
  })

  it('glass to air at 45 degrees (above critical): TIR', () => {
    const d = opticsDerivedValues(
      { opticsType: 2, n1: 1.5, n2: 1, theta1: 45 },
      { t: 0, x: 0, y: 0, vx: 0, vy: 0, phase: 'ready' },
    )
    expect(d.isTIR.value).toBe(1)
    expect(d.criticalAngle.value).toBeCloseTo(41.81, 1)
  })
})
