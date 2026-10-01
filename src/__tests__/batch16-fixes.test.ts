import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderOpticsFrame } from '@/lib/canvas/opticsRenderer'
import { PRESETS } from '@/simulations/projectile-motion/presets'

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
    const fs = await import('fs')
    const path = await import('path')
    const vm = await import('vm')

    const swPath = path.resolve(__dirname, '../../public/sw.js')
    const swSource = fs.readFileSync(swPath, 'utf-8')

    const handlers: Record<string, (e: unknown) => void> = {}
    const store = new Map<string, { status: number }>()
    const cache = {
      async match(r: { url?: string } | string) {
        const k = typeof r === 'string' ? r : r.url ?? ''
        return store.get(k) ?? undefined
      },
      async put(r: { url?: string } | string, res: { status: number; clone: () => { status: number } }) {
        const k = typeof r === 'string' ? r : r.url ?? ''
        store.set(k, { status: res.status })
      },
      async addAll() {},
    }
    const caches = {
      async open() { return cache },
      async keys() { return [] },
      async delete() { return true },
    }

    vm.runInNewContext(swSource, {
      self: {
        addEventListener: (name: string, fn: (e: unknown) => void) => { handlers[name] = fn },
        skipWaiting() {},
        clients: { claim() {} },
      },
      caches,
      fetch: async () => new Response('not found', { status: 404 }),
      URL,
      Response,
    })

    let response: Promise<Response> | undefined
    handlers.fetch({
      request: { method: 'GET', url: 'https://localhost/_next/static/missing.js', mode: 'cors' },
      respondWith(p: Promise<Response>) { response = p },
    })

    const res = await response!
    expect(res.status).toBe(404)
    expect(store.has('https://localhost/_next/static/missing.js')).toBe(false)
  })
})

describe('F24 - Mass preset uses distinct masses', () => {
  it('does-mass-matter preset has different mass values for A and B', () => {
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
  it('clearScene disposes label and arrow resources', async () => {
    const THREE = await import('three')
    const { createFieldView3D } = await import('@/lib/three/fieldView3D')

    const scene = new THREE.Scene()
    const disposed: string[] = []

    const origMeshDispose = THREE.BufferGeometry.prototype.dispose
    THREE.BufferGeometry.prototype.dispose = function () {
      disposed.push('geometry')
      return origMeshDispose.call(this)
    }
    const origMatDispose = THREE.Material.prototype.dispose
    THREE.Material.prototype.dispose = function () {
      disposed.push('material')
      return origMatDispose.call(this)
    }

    const mockCanvas = document.createElement('canvas')
    vi.spyOn(mockCanvas, 'getContext').mockReturnValue({
      drawImage: vi.fn(),
      fillText: vi.fn(),
      measureText: vi.fn(() => ({ width: 40 })),
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      canvas: mockCanvas,
    } as unknown as CanvasRenderingContext2D)
    vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas as unknown as HTMLElement)

    const container = document.createElement('div') as HTMLDivElement
    const builder = createFieldView3D({
      scene,
      camera: new THREE.PerspectiveCamera(),
      renderer: { domElement: document.createElement('div') } as unknown as import('three').WebGLRenderer,
      container,
    })

    builder.update({ q1: 1, q2: -1, distance: 2 }, 0, false)
    const childrenAfterBuild = scene.children.length
    expect(childrenAfterBuild).toBeGreaterThan(0)

    disposed.length = 0
    builder.update({ q1: 2, q2: -2, distance: 3 }, 0, false)

    expect(disposed.filter(d => d === 'material').length).toBeGreaterThan(3)
    expect(disposed.filter(d => d === 'geometry').length).toBeGreaterThan(0)

    THREE.BufferGeometry.prototype.dispose = origMeshDispose
    THREE.Material.prototype.dispose = origMatDispose
    vi.restoreAllMocks()
  })
})
