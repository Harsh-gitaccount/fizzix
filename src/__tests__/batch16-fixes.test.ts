import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderOpticsFrame } from '@/lib/canvas/opticsRenderer'

function createMockCanvas() {
  const calls: string[] = []
  const gradient = { addColorStop: vi.fn() }
  const ctx = {
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn((_x: number, _y: number) => calls.push(`moveTo`)),
    lineTo: vi.fn((_x: number, _y: number) => calls.push(`lineTo`)),
    stroke: vi.fn(() => calls.push('stroke')),
    fill: vi.fn(),
    arc: vi.fn(),
    closePath: vi.fn(),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn(),
    setLineDash: vi.fn(),
    getLineDash: vi.fn(() => []),
    measureText: vi.fn(() => ({ width: 40 })),
    roundRect: vi.fn(),
    createRadialGradient: vi.fn(() => gradient),
    createLinearGradient: vi.fn(() => gradient),
    drawImage: vi.fn(),
    getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
    putImageData: vi.fn(),
    clip: vi.fn(),
    rect: vi.fn(),
    quadraticCurveTo: vi.fn(),
    bezierCurveTo: vi.fn(),
    ellipse: vi.fn(),
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 1,
    lineCap: '' as CanvasLineCap,
    lineJoin: '' as CanvasLineJoin,
    font: '',
    textAlign: '' as CanvasTextAlign,
    textBaseline: '' as CanvasTextBaseline,
    globalAlpha: 1,
    globalCompositeOperation: '' as GlobalCompositeOperation,
    shadowColor: '',
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
  }
  const canvas = {
    width: 800,
    height: 600,
    getContext: () => ctx,
  }
  return { ctx, canvas, calls }
}

describe('F12 - Refraction Rays toggle', () => {
  beforeEach(() => {
    vi.stubGlobal('devicePixelRatio', 1)
  })

  it('refraction draws stroke calls with rays enabled', () => {
    const { ctx, canvas, calls } = createMockCanvas()
    const opts = {
      params: { opticsType: 0, n1: 1.0, n2: 1.5, theta1: 30 },
      currentTime: 5,
      bounds: { xMin: 0, xMax: 10, yMin: 0, yMax: 10, scale: 1 },
      activeLayers: { rays: true, grid: false, angles: false, values: false } as Record<string, boolean>,
      isDark: false,
      background: 'default-sky' as const,
      ghostTrails: [],
      compareMode: false,
    }

    renderOpticsFrame(ctx as unknown as CanvasRenderingContext2D, canvas as unknown as HTMLCanvasElement, opts)

    const strokeCount = calls.filter(c => c === 'stroke').length
    expect(strokeCount).toBeGreaterThan(2)
  })

  it('refraction draws fewer strokes with rays disabled', () => {
    const { ctx, canvas } = createMockCanvas()

    const raysOn = {
      params: { opticsType: 0, n1: 1.0, n2: 1.5, theta1: 30 },
      currentTime: 5,
      bounds: { xMin: 0, xMax: 10, yMin: 0, yMax: 10, scale: 1 },
      activeLayers: { rays: true, grid: false, angles: false, values: false } as Record<string, boolean>,
      isDark: false,
      background: 'default-sky' as const,
      ghostTrails: [],
      compareMode: false,
    }

    renderOpticsFrame(ctx as unknown as CanvasRenderingContext2D, canvas as unknown as HTMLCanvasElement, raysOn)
    const strokesWithRays = (ctx.stroke as ReturnType<typeof vi.fn>).mock.calls.length

    ;(ctx.stroke as ReturnType<typeof vi.fn>).mockClear()

    const raysOff = { ...raysOn, activeLayers: { rays: false, grid: false, angles: false, values: false } as Record<string, boolean> }
    renderOpticsFrame(ctx as unknown as CanvasRenderingContext2D, canvas as unknown as HTMLCanvasElement, raysOff)
    const strokesWithoutRays = (ctx.stroke as ReturnType<typeof vi.fn>).mock.calls.length

    expect(strokesWithoutRays).toBeLessThan(strokesWithRays)
  })
})

describe('F26 - Service worker static asset caching', () => {
  it('sw.js only caches successful responses for static assets', async () => {
    const swSource = await import('fs').then(fs =>
      fs.readFileSync('/home/user/fizzix/public/sw.js', 'utf-8')
    )

    const staticHandler = swSource.match(/pathname\.startsWith\(['"]\/\_next\/static\/['"]\)[\s\S]*?return\s*\n?\s*\}/)?.[0] ?? ''
    expect(staticHandler).toContain('res.ok')
  })
})

describe('F24 - Mass preset uses distinct masses', () => {
  it('does-mass-matter preset has different mass values for A and B', async () => {
    const { PRESETS } = await import('@/simulations/projectile-motion/presets')
    const preset = PRESETS.find(p => p.id === 'does-mass-matter')
    expect(preset).toBeDefined()
    expect(preset!.params.mass).toBeDefined()
    expect(preset!.compareParams).toBeDefined()
    expect(preset!.compareParams!.mass).toBeDefined()
    expect(preset!.params.mass).not.toBe(preset!.compareParams!.mass)
    expect(preset!.params.drag).toBe(0)
    expect(preset!.compareParams!.drag).toBe(0)
  })
})

describe('F23 - fieldView3D resource disposal', () => {
  it('clearScene disposes label and arrow resources via source inspection', async () => {
    const source = await import('fs').then(fs =>
      fs.readFileSync('/home/user/fizzix/src/lib/three/fieldView3D.ts', 'utf-8')
    )

    expect(source).toContain('disposeSprite(label1)')
    expect(source).toContain('disposeSprite(label2)')
    expect(source).toContain('disposeGroup(forceArrow1)')
    expect(source).toContain('disposeGroup(forceArrow2)')
    expect(source).toContain('material.map')
    expect(source).toContain('material.dispose()')
  })
})
