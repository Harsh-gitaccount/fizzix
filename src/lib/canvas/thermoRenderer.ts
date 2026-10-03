import type { CanvasBounds, CanvasBackground, GhostTrail } from '@/lib/physics/types'
import { type Lang } from '@/lib/i18n'
import {
  type GasParticle,
  initParticles,
  initBrownianParticles,
  stepParticles,
  rescaleParticleSpeeds,
  effectiveVolume,
  idealGasPressure,
} from '@/lib/physics/thermodynamics'
import type { RulerState, ProtractorState } from '@/store/toolStore'
import { drawRuler, drawProtractor } from './measurementTools'

interface ThermoRenderOptions {
  params: Record<string, number>
  currentTime: number
  bounds: CanvasBounds
  activeLayers: Record<string, boolean>
  isDark: boolean
  background: CanvasBackground
  ghostTrails: GhostTrail[]
  compareMode: boolean
  paramsB?: Record<string, number>
  dragHandles?: { angleArc: boolean; speedArrow: boolean }
  lang?: Lang
  tools?: {
    ruler?: RulerState | null
    protractor?: ProtractorState | null
  }
}

const C = {
  containerWall: '#6B7280',
  containerWallDark: '#94A3B8',
  containerFill: 'rgba(219, 234, 254, 0.3)',
  containerFillDark: 'rgba(30, 41, 59, 0.5)',
  piston: '#EF4444',
  pistonDark: '#F87171',
  pistonHandle: '#B91C1C',
  bigParticle: '#8B5CF6',
  bigParticleDark: '#A78BFA',
  trace: 'rgba(139, 92, 246, 0.4)',
  text: '#374151',
  textDark: '#D1D5DB',
  bgLight: '#FAFAFA',
  bgDark: '#0F172A',
  pressureArrow: '#EF4444',
}

// Particle state persists across renders
let particles: GasParticle[] = []
let lastParamHash = ''
let lastTime = 0
let brownianTrace: { x: number; y: number }[] = []

// Container dimensions in simulation units
const CONTAINER_H = 250
const CONTAINER_BASE_W = 300

function getContainerW(params: Record<string, number>): number {
  const thermoType = params.thermoType ?? 0
  if (thermoType === 1) {
    const pistonFrac = params.pistonPos ?? 0.7
    return CONTAINER_BASE_W * pistonFrac
  }
  const volume = params.volume ?? 22.4
  const scale = Math.cbrt(volume / 22.4)
  return Math.max(100, Math.min(400, CONTAINER_BASE_W * scale))
}

function getVisualParticleCount(params: Record<string, number>): number {
  const thermoType = params.thermoType ?? 0
  if (thermoType === 2) return Math.round(params.numSmall ?? 80)
  const moles = params.moles ?? 1
  return Math.max(10, Math.min(200, Math.round(moles * 40)))
}

function paramHash(params: Record<string, number>): string {
  const tt = params.thermoType ?? 0
  const n = getVisualParticleCount(params)
  const T = params.temperature ?? 300
  const M = params.molarMass ?? 28
  const cw = getContainerW(params)
  return `${tt}-${n}-${T.toFixed(0)}-${M}-${cw.toFixed(0)}`
}

function needsReinit(params: Record<string, number>): boolean {
  const hash = paramHash(params)
  if (hash !== lastParamHash) {
    const oldParts = lastParamHash.split('-')
    const newParts = hash.split('-')
    if (oldParts.length >= 3 && newParts.length >= 3) {
      if (oldParts[0] === newParts[0] && oldParts[1] === newParts[1] && oldParts[3] === newParts[3]) {
        const oldT = parseFloat(oldParts[2])
        const newT = parseFloat(newParts[2])
        if (oldT > 0 && newT > 0 && oldT !== newT) {
          rescaleParticleSpeeds(particles, oldT, newT)
          lastParamHash = hash
          return false
        }
      }
    }
    return true
  }
  return false
}

function initForParams(params: Record<string, number>) {
  const tt = params.thermoType ?? 0
  const n = getVisualParticleCount(params)
  const T = params.temperature ?? 300
  const M = params.molarMass ?? 28
  const cw = getContainerW(params)

  if (tt === 2) {
    particles = initBrownianParticles(n, cw, CONTAINER_H, T, M)
    brownianTrace = [{ x: cw / 2, y: CONTAINER_H / 2 }]
  } else {
    particles = initParticles(n, cw, CONTAINER_H, T, M)
    brownianTrace = []
  }
  lastParamHash = paramHash(params)
}

function speedToColor(speed: number, maxSpeed: number): string {
  const ratio = Math.min(speed / maxSpeed, 1)
  if (ratio < 0.33) {
    const t = ratio / 0.33
    const r = Math.round(59 + t * (16 - 59))
    const g = Math.round(130 + t * (185 - 130))
    const b = Math.round(246 + t * (129 - 246))
    return `rgb(${r},${g},${b})`
  }
  if (ratio < 0.66) {
    const t = (ratio - 0.33) / 0.33
    const r = Math.round(16 + t * (234 - 16))
    const g = Math.round(185 + t * (179 - 185))
    const b = Math.round(129 + t * (8 - 129))
    return `rgb(${r},${g},${b})`
  }
  const t2 = (ratio - 0.66) / 0.34
  const r = Math.round(234 + t2 * (239 - 234))
  const g = Math.round(179 + t2 * (68 - 179))
  const b = Math.round(8 + t2 * (68 - 8))
  return `rgb(${r},${g},${b})`
}

function drawContainer(
  ctx: CanvasRenderingContext2D,
  ox: number, oy: number,
  cw: number, ch: number,
  isDark: boolean,
  thermoType: number,
  _pistonFrac: number,
) {
  ctx.fillStyle = isDark ? C.containerFillDark : C.containerFill
  ctx.fillRect(ox, oy, cw, ch)

  ctx.strokeStyle = isDark ? C.containerWallDark : C.containerWall
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(ox, oy)
  ctx.lineTo(ox, oy + ch)
  ctx.lineTo(ox + cw, oy + ch)
  if (thermoType !== 1) {
    ctx.lineTo(ox + cw, oy)
    ctx.lineTo(ox, oy)
  } else {
    ctx.moveTo(ox, oy)
    ctx.lineTo(ox + CONTAINER_BASE_W * 1.0 + 10, oy)
  }
  ctx.stroke()

  if (thermoType === 1) {
    const pistonX = ox + cw
    ctx.fillStyle = isDark ? C.pistonDark : C.piston
    ctx.fillRect(pistonX - 4, oy, 8, ch)
    ctx.fillStyle = C.pistonHandle
    ctx.beginPath()
    ctx.arc(pistonX, oy + ch / 2, 10, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = isDark ? C.containerWallDark : C.containerWall
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.strokeStyle = isDark ? C.containerWallDark : C.containerWall
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(pistonX + 4, oy)
    ctx.lineTo(pistonX + 4, oy + ch)
    ctx.stroke()
  }
}

function drawParticles(
  ctx: CanvasRenderingContext2D,
  ox: number, oy: number,
  showSpeedColors: boolean,
  isDark: boolean,
) {
  let maxSpeed = 1
  for (const p of particles) {
    if (p.isBig) continue
    const s = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
    if (s > maxSpeed) maxSpeed = s
  }

  for (const p of particles) {
    const px = ox + p.x
    const py = oy + p.y
    ctx.beginPath()
    ctx.arc(px, py, p.radius, 0, Math.PI * 2)

    if (p.isBig) {
      ctx.fillStyle = isDark ? C.bigParticleDark : C.bigParticle
      ctx.fill()
      ctx.strokeStyle = isDark ? '#7C3AED' : '#6D28D9'
      ctx.lineWidth = 2
      ctx.stroke()
    } else {
      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
      if (showSpeedColors) {
        ctx.fillStyle = speedToColor(speed, maxSpeed)
      } else {
        ctx.fillStyle = isDark ? '#60A5FA' : '#3B82F6'
      }
      ctx.fill()
    }
  }
}

function drawBrownianTrace(
  ctx: CanvasRenderingContext2D,
  ox: number, oy: number,
) {
  if (brownianTrace.length < 2) return
  ctx.strokeStyle = C.trace
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(ox + brownianTrace[0].x, oy + brownianTrace[0].y)
  for (let i = 1; i < brownianTrace.length; i++) {
    ctx.lineTo(ox + brownianTrace[i].x, oy + brownianTrace[i].y)
  }
  ctx.stroke()
}

function drawSpeedHistogram(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  isDark: boolean,
  lang: Lang,
) {
  const smallParticles = particles.filter(p => !p.isBig)
  if (smallParticles.length < 5) return

  const speeds = smallParticles.map(p => Math.sqrt(p.vx * p.vx + p.vy * p.vy))
  const maxSpeed = Math.max(...speeds) * 1.1
  const bins = 12
  const counts = new Array(bins).fill(0)
  for (const s of speeds) {
    const bin = Math.min(Math.floor((s / maxSpeed) * bins), bins - 1)
    counts[bin]++
  }
  const maxCount = Math.max(...counts, 1)

  ctx.fillStyle = isDark ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.9)'
  ctx.strokeStyle = isDark ? '#334155' : '#E5E7EB'
  ctx.lineWidth = 1
  const pad = 6
  ctx.beginPath()
  ctx.roundRect(x - pad, y - pad - 18, w + 2 * pad, h + 2 * pad + 18, 6)
  ctx.fill()
  ctx.stroke()

  ctx.font = 'bold 10px system-ui'
  ctx.fillStyle = isDark ? '#D1D5DB' : '#374151'
  ctx.textAlign = 'left'
  ctx.fillText(lang === 'hi' ? 'चाल वितरण' : 'Speed Distribution', x, y - 6)

  const barW = w / bins - 1
  for (let i = 0; i < bins; i++) {
    const barH = (counts[i] / maxCount) * h
    const bx = x + i * (barW + 1)
    const by = y + h - barH
    const ratio = i / bins
    ctx.fillStyle = speedToColor(ratio * maxSpeed, maxSpeed)
    ctx.fillRect(bx, by, barW, barH)
  }

  ctx.font = '8px system-ui'
  ctx.fillStyle = isDark ? '#9CA3AF' : '#6B7280'
  ctx.textAlign = 'right'
  ctx.fillText(lang === 'hi' ? 'चाल →' : 'Speed →', x + w, y + h + 10)
  ctx.textAlign = 'left'
  ctx.fillText('N', x - pad + 1, y + 4)
}

function drawPressureArrows(
  ctx: CanvasRenderingContext2D,
  ox: number, oy: number,
  cw: number, ch: number,
  pressure: number,
) {
  const arrowLen = Math.min(30, Math.max(8, pressure / 50))
  ctx.strokeStyle = C.pressureArrow
  ctx.fillStyle = C.pressureArrow
  ctx.lineWidth = 2

  const walls = [
    { x: ox, y: oy + ch / 2, dx: -1, dy: 0 },
    { x: ox + cw, y: oy + ch / 2, dx: 1, dy: 0 },
    { x: ox + cw / 2, y: oy, dx: 0, dy: -1 },
    { x: ox + cw / 2, y: oy + ch, dx: 0, dy: 1 },
  ]

  for (const w of walls) {
    const ex = w.x + w.dx * arrowLen
    const ey = w.y + w.dy * arrowLen
    ctx.beginPath()
    ctx.moveTo(w.x, w.y)
    ctx.lineTo(ex, ey)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(ex, ey)
    ctx.lineTo(ex - w.dx * 6 - w.dy * 3, ey - w.dy * 6 - w.dx * 3)
    ctx.lineTo(ex - w.dx * 6 + w.dy * 3, ey - w.dy * 6 + w.dx * 3)
    ctx.closePath()
    ctx.fill()
  }
}

function drawLiveValues(
  ctx: CanvasRenderingContext2D,
  cw: number, ch: number,
  params: Record<string, number>,
  isDark: boolean,
  lang: Lang,
) {
  const T = params.temperature ?? 300
  const n = params.moles ?? 1
  const V = effectiveVolume(params)
  const M = params.molarMass ?? 28

  const gasNames: Record<number, string> = {
    2: 'H₂', 4: 'He', 28: 'N₂', 32: 'O₂', 44: 'CO₂', 40: 'Ar',
  }
  const gasName = gasNames[M] ?? `M=${M}`

  const lines = [
    `T = ${T} K`,
    `n = ${n.toFixed(1)} mol`,
    `V = ${V.toFixed(1)} L`,
    lang === 'hi' ? `गैस: ${gasName}` : `Gas: ${gasName}`,
  ]

  ctx.font = '600 12px system-ui'
  ctx.textAlign = 'left'
  const lx = 12
  let ly = ch - lines.length * 18 - 8

  const bgW = 120
  const bgH = lines.length * 18 + 12
  ctx.fillStyle = isDark ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.85)'
  ctx.beginPath()
  ctx.roundRect(lx - 4, ly - 14, bgW, bgH, 4)
  ctx.fill()

  ctx.fillStyle = isDark ? C.textDark : C.text
  for (const line of lines) {
    ctx.fillText(line, lx, ly)
    ly += 18
  }
}

function drawLegend(
  ctx: CanvasRenderingContext2D,
  cw: number,
  isDark: boolean,
  showSpeedColors: boolean,
  thermoType: number,
  lang: Lang,
) {
  const items: { color: string; label: string }[] = []

  if (showSpeedColors) {
    items.push({ color: '#3B82F6', label: lang === 'hi' ? 'धीमा' : 'Slow' })
    items.push({ color: '#10B981', label: lang === 'hi' ? 'मध्यम' : 'Medium' })
    items.push({ color: '#EF4444', label: lang === 'hi' ? 'तेज़' : 'Fast' })
  } else {
    items.push({ color: isDark ? '#60A5FA' : '#3B82F6', label: lang === 'hi' ? 'अणु' : 'Molecule' })
  }

  if (thermoType === 2) {
    items.push({ color: isDark ? C.bigParticleDark : C.bigParticle, label: lang === 'hi' ? 'बड़ा कण' : 'Large Particle' })
  }

  ctx.font = '600 11px system-ui'
  const rx = cw - 10
  let ry = 16

  const maxLabelW = Math.max(...items.map(i => ctx.measureText(i.label).width))
  const boxW = maxLabelW + 30
  const boxH = items.length * 20 + 10

  ctx.fillStyle = isDark ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.85)'
  ctx.beginPath()
  ctx.roundRect(rx - boxW, ry - 6, boxW, boxH, 4)
  ctx.fill()

  ctx.textAlign = 'right'
  for (const item of items) {
    ctx.fillStyle = item.color
    ctx.beginPath()
    ctx.arc(rx - maxLabelW - 14, ry + 4, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = isDark ? C.textDark : C.text
    ctx.fillText(item.label, rx - 4, ry + 8)
    ry += 20
  }
}

export function renderThermoFrame(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  options: ThermoRenderOptions,
): void {
  const { params, currentTime, isDark, lang = 'en' } = options
  const dpr = window.devicePixelRatio || 1
  const cw = canvas.width / dpr
  const ch = canvas.height / dpr

  ctx.save()
  ctx.scale(dpr, dpr)

  // Background
  if (isDark) {
    ctx.fillStyle = C.bgDark
  } else {
    const grad = ctx.createLinearGradient(0, 0, 0, ch)
    grad.addColorStop(0, '#F8FAFC')
    grad.addColorStop(1, '#F1F5F9')
    ctx.fillStyle = grad
  }
  ctx.fillRect(0, 0, cw, ch)

  const thermoType = params.thermoType ?? 0
  const containerW = getContainerW(params)
  const containerH = CONTAINER_H

  // Center container
  const ox = Math.max(20, (cw - containerW) / 2)
  const oy = Math.max(30, (ch - containerH) / 2)

  // Init or update particles
  if (needsReinit(params) || particles.length === 0) {
    initForParams(params)
    lastTime = currentTime
  }

  // Step simulation
  const dt = currentTime - lastTime
  if (dt > 0 && dt < 1) {
    const subSteps = Math.min(Math.ceil(dt * 60), 4)
    const subDt = (dt / subSteps) * 60
    const rightWall = thermoType === 1 ? containerW : undefined
    for (let s = 0; s < subSteps; s++) {
      stepParticles(particles, subDt, containerW, containerH, rightWall)
    }

    if (thermoType === 2) {
      const big = particles.find(p => p.isBig)
      if (big) {
        brownianTrace.push({ x: big.x, y: big.y })
        if (brownianTrace.length > 2000) brownianTrace.splice(0, brownianTrace.length - 2000)
      }
    }
  }
  lastTime = currentTime

  // Draw
  const pistonFrac = params.pistonPos ?? 0.7
  drawContainer(ctx, ox, oy, containerW, containerH, isDark, thermoType, pistonFrac)

  if (thermoType === 2 && options.activeLayers.trace !== false) {
    drawBrownianTrace(ctx, ox, oy)
  }

  const showSpeedColors = options.activeLayers.speedColors !== false
  drawParticles(ctx, ox, oy, showSpeedColors, isDark)

  if (options.activeLayers.pressure) {
    const V_eff = effectiveVolume(params)
    const P_kPa = idealGasPressure(params.moles ?? 1, params.temperature ?? 300, V_eff) / 1000
    drawPressureArrows(ctx, ox, oy, containerW, containerH, P_kPa)
  }

  if (options.activeLayers.histogram) {
    const histW = Math.min(160, cw * 0.3)
    const histH = 80
    drawSpeedHistogram(ctx, ox + containerW + 20, oy + containerH - histH - 10, histW, histH, isDark, lang)
  }

  drawLiveValues(ctx, cw, ch, params, isDark, lang)
  drawLegend(ctx, cw, isDark, showSpeedColors, thermoType, lang)

  // Measurement tools
  const identityX = (x: number) => x
  const identityY = (y: number) => y
  if (options.tools?.ruler) drawRuler(ctx, options.tools.ruler, identityX, identityY, 1, isDark)
  if (options.tools?.protractor) drawProtractor(ctx, options.tools.protractor, identityX, identityY, isDark)

  ctx.restore()
}

export function computeThermoBounds(
  _params: Record<string, number>,
  _compareMode: boolean,
  _paramsB?: Record<string, number>,
): CanvasBounds {
  return {
    xMin: 0,
    xMax: 400,
    yMin: 0,
    yMax: 300,
    scale: 1,
  }
}

export function resetThermoParticles(): void {
  particles = []
  lastParamHash = ''
  lastTime = 0
  brownianTrace = []
}
