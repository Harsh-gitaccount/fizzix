import { describe, it, expect } from 'vitest'
import { timeOfFlight, maxHeight, range, stateAtTime } from '@/lib/physics/projectile'
import { stateAtTimeWithDrag, timeOfFlightWithDrag } from '@/lib/physics/drag'
import type { ProjectileParams } from '@/lib/physics/types'

function tof(p: ProjectileParams) { return timeOfFlight(p) }
function maxH(p: ProjectileParams) { return maxHeight(p) }
function r(p: ProjectileParams) { return range(p) }

describe('projectile golden values', () => {
  // Standard case: v0=20, theta=45, g=9.8, y0=0
  it('range at 45deg', () => {
    expect(r({ v0: 20, theta: 45, g: 9.8, y0: 0 })).toBeCloseTo(40.816, 3)
  })

  it('max height', () => {
    expect(maxH({ v0: 20, theta: 45, g: 9.8, y0: 0 })).toBeCloseTo(10.204, 3)
  })

  it('TOF', () => {
    expect(tof({ v0: 20, theta: 45, g: 9.8, y0: 0 })).toBeCloseTo(2.886, 3)
  })

  it('horizontal velocity', () => {
    const s = stateAtTime({ v0: 20, theta: 45, g: 9.8, y0: 0 }, 1)
    expect(s.vx).toBeCloseTo(14.142, 3)
  })

  it('vy at peak is zero', () => {
    const p = { v0: 20, theta: 45, g: 9.8, y0: 0 }
    const tPeak = 20 * Math.sin(45 * Math.PI / 180) / 9.8
    const s = stateAtTime(p, tPeak)
    expect(s.vy).toBeCloseTo(0, 3)
  })

  // Edge: free fall (v0=0, theta=0, y0=20)
  it('free fall TOF', () => {
    expect(tof({ v0: 0, theta: 0, g: 9.8, y0: 20 })).toBeCloseTo(2.020, 3)
  })

  it('free fall range=0', () => {
    expect(r({ v0: 0, theta: 0, g: 9.8, y0: 20 })).toBeCloseTo(0, 3)
  })

  it('free fall vx=0 at all t', () => {
    const s = stateAtTime({ v0: 0, theta: 0, g: 9.8, y0: 20 }, 1)
    expect(s.vx).toBe(0)
  })

  // Edge: horizontal throw (v0=15, theta=0, y0=10)
  it('horizontal throw TOF', () => {
    expect(tof({ v0: 15, theta: 0, g: 9.8, y0: 10 })).toBeCloseTo(1.429, 2)
  })

  it('horizontal throw range', () => {
    expect(r({ v0: 15, theta: 0, g: 9.8, y0: 10 })).toBeCloseTo(21.429, 2)
  })

  it('horizontal throw max height is start height', () => {
    expect(maxH({ v0: 15, theta: 0, g: 9.8, y0: 10 })).toBeCloseTo(10, 3)
  })

  // Edge: vertical throw (v0=20, theta=90, y0=0)
  it('vertical range=0', () => {
    expect(r({ v0: 20, theta: 90, g: 9.8, y0: 0 })).toBeCloseTo(0, 3)
  })

  it('vertical maxH', () => {
    expect(maxH({ v0: 20, theta: 90, g: 9.8, y0: 0 })).toBeCloseTo(20.408, 3)
  })

  // Edge: near-zero speed (no NaN)
  it('tiny v0 no NaN', () => {
    const s = stateAtTime({ v0: 0.1, theta: 45, g: 9.8, y0: 0 }, 0.01)
    expect(Number.isFinite(s.x)).toBe(true)
    expect(Number.isFinite(s.y)).toBe(true)
  })

  it('tiny v0 range', () => {
    expect(r({ v0: 0.1, theta: 45, g: 9.8, y0: 0 })).toBeCloseTo(0.001, 3)
  })

  // Edge: high speed
  it('high speed range', () => {
    expect(r({ v0: 100, theta: 30, g: 9.8, y0: 0 })).toBeCloseTo(884.0, 0)
  })

  // v9: elevated + angled (quadratic TOF)
  it('elevated TOF', () => {
    expect(tof({ v0: 20, theta: 45, g: 9.8, y0: 10 })).toBeCloseTo(3.474, 3)
  })

  it('elevated range', () => {
    expect(r({ v0: 20, theta: 45, g: 9.8, y0: 10 })).toBeCloseTo(49.125, 2)
  })

  it('elevated maxH', () => {
    expect(maxH({ v0: 20, theta: 45, g: 9.8, y0: 10 })).toBeCloseTo(20.204, 3)
  })

  // v0=0, y0=0 => TOF=0
  it('zero everything', () => {
    expect(tof({ v0: 0, theta: 0, g: 9.8, y0: 0 })).toBe(0)
    expect(r({ v0: 0, theta: 0, g: 9.8, y0: 0 })).toBe(0)
  })

  // NaN guard
  it('NaN params return ZERO_STATE', () => {
    const s = stateAtTime({ v0: NaN, theta: 45, g: 9.8, y0: 0 }, 1)
    expect(s.phase).toBe('ready')
    expect(s.x).toBe(0)
  })

  it('Infinity params return ZERO_STATE', () => {
    const s = stateAtTime({ v0: Infinity, theta: 45, g: 9.8, y0: 0 }, 1)
    expect(s.phase).toBe('ready')
  })
})

describe('stateAtTime phase transitions', () => {
  const params = { v0: 20, theta: 45, g: 9.8, y0: 0 }

  it('t=0 is ready', () => {
    expect(stateAtTime(params, 0).phase).toBe('ready')
  })

  it('mid-flight is flying', () => {
    expect(stateAtTime(params, 1).phase).toBe('flying')
  })

  it('past TOF is landed', () => {
    expect(stateAtTime(params, 10).phase).toBe('landed')
  })

  it('landed y is 0', () => {
    expect(stateAtTime(params, 10).y).toBe(0)
  })
})

describe('stateAtTime is pure', () => {
  it('same inputs produce same outputs', () => {
    const params = { v0: 20, theta: 45, g: 9.8, y0: 0 }
    const a = stateAtTime(params, 1.5)
    const b = stateAtTime(params, 1.5)
    expect(a).toEqual(b)
  })
})

describe('drag=0 matches analytical stateAtTime', () => {
  const cases: Array<{ label: string; params: Record<string, number> }> = [
    { label: '45deg standard', params: { v0: 20, theta: 45, g: 9.8, y0: 0, drag: 0 } },
    { label: 'horizontal throw', params: { v0: 15, theta: 0, g: 9.8, y0: 10, drag: 0 } },
    { label: 'free fall', params: { v0: 0, theta: 0, g: 9.8, y0: 20, drag: 0 } },
    { label: 'steep angle', params: { v0: 30, theta: 80, g: 9.8, y0: 0, drag: 0 } },
    { label: 'low gravity', params: { v0: 20, theta: 45, g: 1.62, y0: 0, drag: 0 } },
  ]

  for (const { label, params } of cases) {
    it(`TOF matches: ${label}`, () => {
      const analytical = timeOfFlight(params as unknown as ProjectileParams)
      const numerical = timeOfFlightWithDrag(params)
      expect(numerical).toBeCloseTo(analytical, 2)
    })

    it(`mid-flight state matches: ${label}`, () => {
      const analytical = timeOfFlight(params as unknown as ProjectileParams)
      const tMid = analytical * 0.5
      if (tMid <= 0) return
      const sa = stateAtTime(params, tMid)
      const sn = stateAtTimeWithDrag(params, tMid)
      expect(sn.x).toBeCloseTo(sa.x, 1)
      expect(sn.y).toBeCloseTo(sa.y, 1)
      expect(sn.vx).toBeCloseTo(sa.vx, 1)
      expect(sn.vy).toBeCloseTo(sa.vy, 1)
    })
  }
})
