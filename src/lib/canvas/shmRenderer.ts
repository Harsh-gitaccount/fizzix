import type { CanvasBounds, GhostTrail, CanvasBackground } from '@/lib/physics/types'
import { t, type Lang } from '@/lib/i18n'
import { shmStateAtTime, shmTimeOfFlight, pendulumTrajectoryBounds, springTrajectoryBounds, pendulumEnergy, springEnergy } from '@/lib/physics/shm'
import type { RulerState, ProtractorState } from '@/store/toolStore'
import { drawRuler, drawProtractor } from './measurementTools'

interface SHMRenderOptions {
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

const COLORS = {
  pivot: '#6B7280',
  rod: '#374151',
  rodDark: '#9CA3AF',
  bob: '#EF4444',
  bobB: '#F97316',
  trail: '#3B82F6',
  trailB: '#F97316',
  spring: '#059669',
  springDark: '#34D399',
  mass: '#8B5CF6',
  massB: '#F97316',
  wall: '#6B7280',
  wallDark: '#9CA3AF',
  equilibrium: '#94A3B8',
  velocity: '#059669',
  energy: {
    ke: '#EF4444',
    pe: '#3B82F6',
    total: '#8B5CF6',
  },
  gridLight: '#E5E7EB',
  gridDark: '#1E293B',
  text: '#374151',
  textDark: '#D1D5DB',
  bgLight: '#FAFAFA',
  bgDark: '#0F172A',
}

export function computeSHMBounds(
  params: Record<string, number>,
  compareMode: boolean,
  paramsB?: Record<string, number>,
  _ghosts?: GhostTrail[],
): CanvasBounds {
  const shmType = params.shmType ?? 0
  const boundsA = shmType === 1
    ? springTrajectoryBounds(params)
    : pendulumTrajectoryBounds(params)

  let xMin = boundsA.xMin
  let xMax = boundsA.xMax
  let yMin = boundsA.yMin
  let yMax = boundsA.yMax

  if (compareMode && paramsB) {
    const shmTypeB = paramsB.shmType ?? 0
    const boundsB = shmTypeB === 1
      ? springTrajectoryBounds(paramsB)
      : pendulumTrajectoryBounds(paramsB)
    xMin = Math.min(xMin, boundsB.xMin)
    xMax = Math.max(xMax, boundsB.xMax)
    yMin = Math.min(yMin, boundsB.yMin)
    yMax = Math.max(yMax, boundsB.yMax)
  }

  return { xMin, xMax, yMin, yMax, scale: 1 }
}

export function renderSHMFrame(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  options: SHMRenderOptions,
) {
  const { params, currentTime, bounds, activeLayers, isDark, compareMode, paramsB } = options

  const w = canvas.width
  const h = canvas.height
  const dpr = window.devicePixelRatio || 1

  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, w, h)

  const cw = w / dpr
  const ch = h / dpr

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.fillStyle = isDark ? COLORS.bgDark : COLORS.bgLight
  ctx.fillRect(0, 0, cw, ch)

  const shmType = params.shmType ?? 0

  const state = shmStateAtTime(params, currentTime)

  if (shmType === 0) {
    renderPendulum(ctx, cw, ch, params, currentTime, bounds, activeLayers, isDark, compareMode, paramsB)
  } else {
    renderSpring(ctx, cw, ch, params, currentTime, bounds, activeLayers, isDark, compareMode, paramsB)
  }

  if (activeLayers.energyBar) {
    const energy = shmType === 0 ? pendulumEnergy(params, state) : springEnergy(params, state)
    drawEnergyBar(ctx, cw, ch, energy, isDark)
  }

  drawSHMLegend(ctx, cw, shmType, activeLayers, compareMode, !!paramsB, isDark, options.lang ?? 'en')

  if (options.tools?.ruler) {
    const bw = bounds.xMax - bounds.xMin
    const bh = bounds.yMax - bounds.yMin
    const scaleX = cw / bw
    const scaleY = ch / bh
    const scale = Math.min(scaleX, scaleY)
    const offsetX = cw / 2 - (bounds.xMin + bw / 2) * scale
    const offsetY = ch / 2 + (bounds.yMin + bh / 2) * scale
    const toSX = (x: number) => x * scale + offsetX
    const toSY = (y: number) => -y * scale + offsetY
    drawRuler(ctx, options.tools.ruler, toSX, toSY, scale, isDark)
  }
  if (options.tools?.protractor) {
    const bw = bounds.xMax - bounds.xMin
    const bh = bounds.yMax - bounds.yMin
    const scaleX = cw / bw
    const scaleY = ch / bh
    const scale = Math.min(scaleX, scaleY)
    const offsetX = cw / 2 - (bounds.xMin + bw / 2) * scale
    const offsetY = ch / 2 + (bounds.yMin + bh / 2) * scale
    const toSX = (x: number) => x * scale + offsetX
    const toSY = (y: number) => -y * scale + offsetY
    drawProtractor(ctx, options.tools.protractor, toSX, toSY, isDark)
  }
}

// ===== PENDULUM RENDERER =====

function renderPendulum(
  ctx: CanvasRenderingContext2D,
  cw: number, ch: number,
  params: Record<string, number>,
  currentTime: number,
  bounds: CanvasBounds,
  activeLayers: Record<string, boolean>,
  isDark: boolean,
  compareMode: boolean,
  paramsB?: Record<string, number>,
) {
  const length = params.length ?? 1
  const pivotScreenX = cw / 2
  const pivotScreenY = ch * 0.12

  const maxSwing = length * Math.sin((params.theta0 ?? 30) * Math.PI / 180)
  const maxHeight = length
  const displayScale = Math.min(
    (cw * 0.4) / Math.max(maxSwing, 0.3),
    (ch * 0.65) / Math.max(maxHeight, 0.5),
  )

  // Draw pivot mount
  ctx.fillStyle = isDark ? COLORS.wallDark : COLORS.pivot
  ctx.fillRect(pivotScreenX - 30, pivotScreenY - 8, 60, 8)
  drawCrossHatch(ctx, pivotScreenX - 30, pivotScreenY - 8, 60, 8, isDark)

  // Pivot dot
  ctx.beginPath()
  ctx.arc(pivotScreenX, pivotScreenY, 4, 0, Math.PI * 2)
  ctx.fillStyle = isDark ? '#D1D5DB' : '#374151'
  ctx.fill()

  // Equilibrium line (dashed)
  if (activeLayers.grid !== false) {
    ctx.beginPath()
    ctx.setLineDash([4, 4])
    ctx.moveTo(pivotScreenX, pivotScreenY)
    ctx.lineTo(pivotScreenX, pivotScreenY + length * displayScale + 20)
    ctx.strokeStyle = COLORS.equilibrium
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.setLineDash([])
  }

  // Trail (trajectory of the bob)
  if (activeLayers.trajectory !== false) {
    drawPendulumTrail(ctx, params, currentTime, pivotScreenX, pivotScreenY, displayScale, COLORS.trail)
  }

  // Current state
  const state = shmStateAtTime(params, currentTime)
  const bobX = pivotScreenX + state.x * displayScale
  const bobY = pivotScreenY + (length - state.y) * displayScale

  // Rod
  ctx.beginPath()
  ctx.moveTo(pivotScreenX, pivotScreenY)
  ctx.lineTo(bobX, bobY)
  ctx.strokeStyle = isDark ? COLORS.rodDark : COLORS.rod
  ctx.lineWidth = 2
  ctx.stroke()

  // Bob
  drawBob(ctx, bobX, bobY, 12, COLORS.bob)

  // Angle arc
  if (activeLayers.velocity || activeLayers.components) {
    const currentTheta = Math.asin(Math.max(-1, Math.min(1, state.x / length)))
    drawAngleIndicator(ctx, pivotScreenX, pivotScreenY, currentTheta, displayScale * 0.3, isDark)
  }

  // Velocity vector on bob
  if (activeLayers.velocity) {
    const speed = Math.sqrt(state.vx * state.vx + state.vy * state.vy)
    if (speed > 0.01) {
      const vScale = displayScale * 0.3
      drawArrow(ctx, bobX, bobY, bobX + state.vx * vScale, bobY - state.vy * vScale, COLORS.velocity, 2)
      ctx.fillStyle = COLORS.velocity
      ctx.font = 'bold 10px system-ui'
      ctx.fillText(`v = ${speed.toFixed(2)} m/s`, bobX + state.vx * vScale + 5, bobY - state.vy * vScale)
    }
  }

  // Compare pendulum B
  if (compareMode && paramsB) {
    const lengthB = paramsB.length ?? 1
    const tofB = shmTimeOfFlight(paramsB)
    const tB = Math.min(currentTime, tofB)
    const stateB = shmStateAtTime(paramsB, tB)
    const bobBX = pivotScreenX + stateB.x * displayScale
    const bobBY = pivotScreenY + (lengthB - stateB.y) * displayScale

    if (activeLayers.trajectory !== false) {
      drawPendulumTrail(ctx, paramsB, tB, pivotScreenX, pivotScreenY, displayScale, COLORS.trailB)
    }

    ctx.beginPath()
    ctx.moveTo(pivotScreenX, pivotScreenY)
    ctx.lineTo(bobBX, bobBY)
    ctx.strokeStyle = isDark ? '#FCD34D' : '#D97706'
    ctx.lineWidth = 1.5
    ctx.setLineDash([3, 3])
    ctx.stroke()
    ctx.setLineDash([])

    drawBob(ctx, bobBX, bobBY, 10, COLORS.bobB)
  }

  // Labels
  drawPendulumLabels(ctx, cw, ch, params, state, currentTime, isDark)
}

function drawPendulumTrail(
  ctx: CanvasRenderingContext2D,
  params: Record<string, number>,
  maxTime: number,
  pivotX: number, pivotY: number,
  scale: number,
  color: string,
) {
  const length = params.length ?? 1
  const steps = Math.min(Math.ceil(maxTime * 30), 300)
  if (steps < 2) return

  ctx.beginPath()
  ctx.globalAlpha = 0.4
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * maxTime
    const s = shmStateAtTime(params, t)
    const sx = pivotX + s.x * scale
    const sy = pivotY + (length - s.y) * scale
    if (i === 0) ctx.moveTo(sx, sy)
    else ctx.lineTo(sx, sy)
  }
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.globalAlpha = 1.0
}

function drawBob(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  radius: number,
  color: string,
) {
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  const grad = ctx.createRadialGradient(x - 2, y - 2, 1, x, y, radius)
  grad.addColorStop(0, '#FFFFFF')
  grad.addColorStop(0.3, color)
  grad.addColorStop(1, darken(color, 0.3))
  ctx.fillStyle = grad
  ctx.fill()
  ctx.strokeStyle = darken(color, 0.4)
  ctx.lineWidth = 1.5
  ctx.stroke()
}

function drawAngleIndicator(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  angle: number,
  radius: number,
  isDark: boolean,
) {
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.arc(cx, cy, radius, Math.PI / 2 - angle, Math.PI / 2, angle > 0)
  ctx.closePath()
  ctx.fillStyle = isDark ? 'rgba(96, 165, 250, 0.2)' : 'rgba(59, 130, 246, 0.15)'
  ctx.fill()
  ctx.strokeStyle = isDark ? '#60A5FA' : '#3B82F6'
  ctx.lineWidth = 1
  ctx.stroke()

  const angleDeg = Math.abs(angle * 180 / Math.PI)
  if (angleDeg > 1) {
    ctx.fillStyle = isDark ? '#93C5FD' : '#2563EB'
    ctx.font = 'bold 11px system-ui'
    ctx.textAlign = 'center'
    const labelX = cx + (radius + 14) * Math.sin(angle * 0.5)
    const labelY = cy + (radius + 14) * Math.cos(angle * 0.5)
    ctx.fillText(`${angleDeg.toFixed(1)}°`, labelX, labelY)
    ctx.textAlign = 'start'
  }
}

function drawPendulumLabels(
  ctx: CanvasRenderingContext2D,
  cw: number, ch: number,
  params: Record<string, number>,
  state: { x: number; y: number; vx: number; vy: number; t: number },
  currentTime: number,
  isDark: boolean,
) {
  const length = params.length ?? 1
  const theta0 = params.theta0 ?? 30
  const g = params.g ?? 9.8
  const speed = Math.sqrt(state.vx * state.vx + state.vy * state.vy)
  const angle = length > 0 ? Math.asin(Math.max(-1, Math.min(1, state.x / length))) * 180 / Math.PI : 0

  ctx.fillStyle = isDark ? COLORS.textDark : COLORS.text
  ctx.font = 'bold 11px system-ui'
  ctx.textAlign = 'left'

  const x = 12
  let y = ch - 80
  const lineH = 16

  ctx.fillText(`L = ${length.toFixed(2)} m`, x, y); y += lineH
  ctx.fillText(`θ₀ = ${theta0.toFixed(1)}°`, x, y); y += lineH
  ctx.fillText(`g = ${g.toFixed(1)} m/s²`, x, y); y += lineH
  ctx.fillText(`t = ${currentTime.toFixed(2)} s`, x, y); y += lineH
  ctx.fillText(`θ = ${angle.toFixed(1)}°  |  v = ${speed.toFixed(2)} m/s`, x, y)
}

// ===== SPRING RENDERER =====

function renderSpring(
  ctx: CanvasRenderingContext2D,
  cw: number, ch: number,
  params: Record<string, number>,
  currentTime: number,
  _bounds: CanvasBounds,
  activeLayers: Record<string, boolean>,
  isDark: boolean,
  compareMode: boolean,
  paramsB?: Record<string, number>,
) {
  const amplitude = params.amplitude ?? 0.2
  const equilibriumX = cw / 2
  const springY = ch * 0.45

  const displayScale = (cw * 0.3) / Math.max(amplitude, 0.1)

  const wallX = equilibriumX - displayScale * amplitude * 1.8

  // Wall
  ctx.fillStyle = isDark ? COLORS.wallDark : COLORS.wall
  ctx.fillRect(wallX - 8, springY - 40, 8, 80)
  drawCrossHatch(ctx, wallX - 8, springY - 40, 8, 80, isDark)

  // Equilibrium line
  if (activeLayers.grid !== false) {
    ctx.beginPath()
    ctx.setLineDash([4, 4])
    ctx.moveTo(equilibriumX, springY - 35)
    ctx.lineTo(equilibriumX, springY + 35)
    ctx.strokeStyle = COLORS.equilibrium
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.setLineDash([])

    ctx.fillStyle = COLORS.equilibrium
    ctx.font = '10px system-ui'
    ctx.textAlign = 'center'
    ctx.fillText('x = 0', equilibriumX, springY + 48)
    ctx.textAlign = 'start'
  }

  // Floor/surface
  ctx.fillStyle = isDark ? '#1E293B' : '#F3F4F6'
  ctx.fillRect(wallX - 8, springY + 15, cw - wallX + 16, 3)

  // Current state
  const state = shmStateAtTime(params, currentTime)
  const massX = equilibriumX + state.x * displayScale
  const massSize = 24

  // Trail
  if (activeLayers.trajectory !== false) {
    drawSpringTrail(ctx, params, currentTime, equilibriumX, springY, displayScale, COLORS.trail)
  }

  // Spring coils
  drawSpringCoils(ctx, wallX, springY, massX - massSize / 2, springY, isDark)

  // Mass block
  drawMassBlock(ctx, massX, springY, massSize, isDark ? '#A78BFA' : COLORS.mass)

  // Displacement arrow
  if (Math.abs(state.x) > 0.001) {
    const sign = state.x > 0 ? 1 : -1
    ctx.fillStyle = isDark ? '#FCA5A5' : '#DC2626'
    ctx.font = 'bold 10px system-ui'
    ctx.textAlign = 'center'
    const labelY = springY - 30
    ctx.fillText(`x = ${state.x.toFixed(3)} m`, (equilibriumX + massX) / 2, labelY - 8)

    ctx.beginPath()
    ctx.setLineDash([2, 2])
    ctx.moveTo(equilibriumX, labelY)
    ctx.lineTo(massX, labelY)
    ctx.strokeStyle = isDark ? '#FCA5A5' : '#DC2626'
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.setLineDash([])

    drawArrowhead(ctx, massX, labelY, sign > 0 ? 0 : Math.PI, isDark ? '#FCA5A5' : '#DC2626')
  }

  // Velocity vector
  if (activeLayers.velocity && Math.abs(state.vx) > 0.01) {
    const vScale = displayScale * 0.15
    drawArrow(ctx, massX, springY, massX + state.vx * vScale, springY, COLORS.velocity, 2)
    ctx.fillStyle = COLORS.velocity
    ctx.font = 'bold 10px system-ui'
    ctx.textAlign = 'center'
    ctx.fillText(`v = ${state.vx.toFixed(2)} m/s`, massX + state.vx * vScale * 0.5, springY + 30)
    ctx.textAlign = 'start'
  }

  // Compare spring B
  if (compareMode && paramsB) {
    const tofB = shmTimeOfFlight(paramsB)
    const tB = Math.min(currentTime, tofB)
    const stateB = shmStateAtTime(paramsB, tB)
    const massBX = equilibriumX + stateB.x * displayScale

    if (activeLayers.trajectory !== false) {
      drawSpringTrail(ctx, paramsB, tB, equilibriumX, springY + 50, displayScale, COLORS.trailB)
    }

    drawSpringCoils(ctx, wallX, springY + 50, massBX - massSize / 2, springY + 50, isDark)
    drawMassBlock(ctx, massBX, springY + 50, massSize * 0.9, COLORS.massB)
  }

  // Labels
  drawSpringLabels(ctx, cw, ch, params, state, currentTime, isDark)
}

function drawSpringTrail(
  ctx: CanvasRenderingContext2D,
  params: Record<string, number>,
  maxTime: number,
  eqX: number, _y: number,
  scale: number,
  color: string,
) {
  const tof = shmTimeOfFlight(params)
  const drawTime = Math.min(maxTime, tof)
  const steps = Math.min(Math.ceil(drawTime * 30), 300)
  if (steps < 2) return

  // Draw x vs t graph below the spring
  const graphY = _y + 70
  const graphH = 60
  const graphW = scale * (params.amplitude ?? 0.2) * 2 * 1.5

  ctx.globalAlpha = 0.3
  ctx.fillStyle = color
  ctx.font = '9px system-ui'
  ctx.textAlign = 'center'
  ctx.fillText('x(t)', eqX - graphW / 2 - 12, graphY)

  ctx.beginPath()
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * drawTime
    const s = shmStateAtTime(params, t)
    const sx = eqX + s.x * scale
    const sy = graphY + (t / Math.max(drawTime, 0.01)) * graphH
    if (i === 0) ctx.moveTo(sx, sy)
    else ctx.lineTo(sx, sy)
  }
  ctx.strokeStyle = color
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.globalAlpha = 1.0
  ctx.textAlign = 'start'
}

function drawSpringCoils(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number,
  x2: number, y2: number,
  isDark: boolean,
) {
  const coils = 12
  const amplitude = 8
  const dx = x2 - x1
  const len = Math.abs(dx)
  const dir = dx > 0 ? 1 : -1

  ctx.beginPath()
  ctx.moveTo(x1, y1)

  const segLen = len / (coils * 2)
  for (let i = 0; i < coils * 2; i++) {
    const xPos = x1 + dir * (i + 1) * segLen
    const yOff = (i % 2 === 0 ? -1 : 1) * amplitude
    ctx.lineTo(xPos, y1 + yOff)
  }
  ctx.lineTo(x2, y2)

  ctx.strokeStyle = isDark ? COLORS.springDark : COLORS.spring
  ctx.lineWidth = 2
  ctx.stroke()
}

function drawMassBlock(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  size: number,
  color: string,
) {
  const half = size / 2
  ctx.fillStyle = color
  ctx.fillRect(cx - half, cy - half, size, size)
  ctx.strokeStyle = darken(color, 0.3)
  ctx.lineWidth = 1.5
  ctx.strokeRect(cx - half, cy - half, size, size)

  ctx.fillStyle = 'rgba(255,255,255,0.3)'
  ctx.fillRect(cx - half + 2, cy - half + 2, size - 4, 4)

  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 10px system-ui'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('m', cx, cy)
  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'start'
}

function drawSpringLabels(
  ctx: CanvasRenderingContext2D,
  cw: number, ch: number,
  params: Record<string, number>,
  state: { x: number; vx: number; t: number },
  currentTime: number,
  isDark: boolean,
) {
  const k = params.k ?? 10
  const mass = params.mass ?? 1
  const amplitude = params.amplitude ?? 0.2

  ctx.fillStyle = isDark ? COLORS.textDark : COLORS.text
  ctx.font = 'bold 11px system-ui'
  ctx.textAlign = 'left'

  const x = 12
  let y = ch - 80
  const lineH = 16

  ctx.fillText(`k = ${k.toFixed(1)} N/m`, x, y); y += lineH
  ctx.fillText(`m = ${mass.toFixed(2)} kg`, x, y); y += lineH
  ctx.fillText(`A = ${amplitude.toFixed(3)} m`, x, y); y += lineH
  ctx.fillText(`t = ${currentTime.toFixed(2)} s`, x, y); y += lineH
  ctx.fillText(`x = ${state.x.toFixed(3)} m  |  v = ${state.vx.toFixed(2)} m/s`, x, y)
}

// ===== SHARED DRAWING HELPERS =====

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number,
  x2: number, y2: number,
  color: string,
  lineWidth: number,
) {
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.sqrt(dx * dx + dy * dy)
  if (len < 1) return

  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  ctx.stroke()

  const angle = Math.atan2(dy, dx)
  const headLen = Math.min(8, len * 0.3)
  ctx.beginPath()
  ctx.moveTo(x2, y2)
  ctx.lineTo(x2 - headLen * Math.cos(angle - 0.4), y2 - headLen * Math.sin(angle - 0.4))
  ctx.lineTo(x2 - headLen * Math.cos(angle + 0.4), y2 - headLen * Math.sin(angle + 0.4))
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
}

function drawArrowhead(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  angle: number,
  color: string,
) {
  const headLen = 6
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x - headLen * Math.cos(angle - 0.4), y - headLen * Math.sin(angle - 0.4))
  ctx.lineTo(x - headLen * Math.cos(angle + 0.4), y - headLen * Math.sin(angle + 0.4))
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
}

function drawCrossHatch(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  isDark: boolean,
) {
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, w, h)
  ctx.clip()
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'
  ctx.lineWidth = 0.5
  for (let i = -h; i < w + h; i += 4) {
    ctx.beginPath()
    ctx.moveTo(x + i, y)
    ctx.lineTo(x + i + h, y + h)
    ctx.stroke()
  }
  ctx.restore()
}

function darken(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgb(${Math.round(r * (1 - amount))},${Math.round(g * (1 - amount))},${Math.round(b * (1 - amount))})`
}

function drawEnergyBar(
  ctx: CanvasRenderingContext2D,
  cw: number,
  ch: number,
  energy: { ke: number; pe: number; total: number },
  isDark: boolean,
) {
  const barW = 24
  const barH = Math.min(ch * 0.4, 160)
  const x = cw - 50
  const y = ch - barH - 40

  const total = energy.total || 1
  const keH = (energy.ke / total) * barH
  const peH = (energy.pe / total) * barH

  // Bar background
  ctx.fillStyle = isDark ? 'rgba(30,41,59,0.8)' : 'rgba(241,245,249,0.9)'
  ctx.strokeStyle = isDark ? '#475569' : '#CBD5E1'
  ctx.lineWidth = 1
  const r = 4
  ctx.beginPath()
  ctx.roundRect(x - 4, y - 20, barW + 8, barH + 50, r)
  ctx.fill()
  ctx.stroke()

  // Title
  ctx.fillStyle = isDark ? '#94A3B8' : '#64748B'
  ctx.font = 'bold 8px system-ui'
  ctx.textAlign = 'center'
  ctx.fillText('Energy', x + barW / 2, y - 8)

  // PE (bottom, blue)
  ctx.fillStyle = COLORS.energy.pe
  ctx.fillRect(x, y + barH - peH, barW, peH)

  // KE (top, red)
  ctx.fillStyle = COLORS.energy.ke
  ctx.fillRect(x, y + barH - peH - keH, barW, keH)

  // Border
  ctx.strokeStyle = isDark ? '#475569' : '#94A3B8'
  ctx.lineWidth = 1
  ctx.strokeRect(x, y, barW, barH)

  // Labels
  ctx.font = 'bold 7px system-ui'
  ctx.textAlign = 'center'

  if (keH > 12) {
    ctx.fillStyle = '#FFF'
    ctx.fillText('KE', x + barW / 2, y + barH - peH - keH / 2 + 3)
  }
  if (peH > 12) {
    ctx.fillStyle = '#FFF'
    ctx.fillText('PE', x + barW / 2, y + barH - peH / 2 + 3)
  }

  // Values below
  ctx.textAlign = 'left'
  ctx.font = '7px system-ui'
  const valY = y + barH + 12
  ctx.fillStyle = COLORS.energy.ke
  ctx.fillText(`KE ${energy.ke.toFixed(2)}J`, x - 4, valY)
  ctx.fillStyle = COLORS.energy.pe
  ctx.fillText(`PE ${energy.pe.toFixed(2)}J`, x - 4, valY + 10)
  ctx.fillStyle = isDark ? '#C4B5FD' : COLORS.energy.total
  ctx.fillText(`E  ${energy.total.toFixed(2)}J`, x - 4, valY + 20)
}

function drawSHMLegend(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  shmType: number,
  activeLayers: Record<string, boolean>,
  compareMode: boolean,
  hasParamsB: boolean,
  isDark: boolean,
  lang: Lang = 'en',
) {
  const entries: { color: string; label: string; type: 'circle' | 'line' | 'dash' | 'rect' }[] = []

  if (shmType === 0) {
    entries.push({ color: COLORS.bob, label: t('canvas.bob', lang), type: 'circle' })
    if (compareMode && hasParamsB) {
      entries.push({ color: COLORS.bobB, label: t('canvas.bobB', lang), type: 'circle' })
    }
    if (activeLayers.trajectory !== false) {
      entries.push({ color: COLORS.trail, label: t('canvas.swingPath', lang), type: 'line' })
    }
    if (activeLayers.velocity) {
      entries.push({ color: COLORS.velocity, label: t('canvas.velocityV', lang), type: 'line' })
    }
    if (activeLayers.components) {
      entries.push({ color: isDark ? '#93C5FD' : '#2563EB', label: t('canvas.angleTheta', lang), type: 'line' })
    }
    entries.push({ color: COLORS.equilibrium, label: t('canvas.restPosition', lang), type: 'dash' })
  } else {
    entries.push({ color: COLORS.spring, label: t('canvas.springLabel', lang), type: 'line' })
    entries.push({ color: COLORS.mass, label: t('canvas.massM', lang), type: 'rect' })
    if (compareMode && hasParamsB) {
      entries.push({ color: COLORS.bobB, label: t('canvas.massB', lang), type: 'rect' })
    }
    if (activeLayers.trajectory !== false) {
      entries.push({ color: COLORS.trail, label: t('canvas.xtGraph', lang), type: 'line' })
    }
    if (activeLayers.velocity) {
      entries.push({ color: COLORS.velocity, label: t('canvas.velocityV', lang), type: 'line' })
    }
    entries.push({ color: COLORS.equilibrium, label: t('canvas.restX', lang), type: 'dash' })
    entries.push({ color: isDark ? '#FCA5A5' : '#DC2626', label: t('canvas.displacementX', lang), type: 'line' })
  }

  if (entries.length < 2) return

  ctx.font = '500 10px Inter, system-ui, sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'

  const iconW = 14
  const gap = 6
  const padX = 8
  const padY = 6
  const rowH = 16

  let maxTextW = 0
  for (const e of entries) {
    maxTextW = Math.max(maxTextW, ctx.measureText(e.label).width)
  }

  const boxW = padX * 2 + iconW + gap + maxTextW
  const boxH = padY * 2 + 12 + (entries.length - 1) * rowH
  const boxX = canvasW - boxW - 10
  const boxY = 8

  ctx.fillStyle = isDark ? 'rgba(15,23,42,0.75)' : 'rgba(255,255,255,0.75)'
  ctx.beginPath()
  ctx.roundRect(boxX, boxY, boxW, boxH, 6)
  ctx.fill()

  ctx.strokeStyle = isDark ? 'rgba(71,85,105,0.5)' : 'rgba(209,213,219,0.8)'
  ctx.lineWidth = 0.5
  ctx.stroke()

  let y = boxY + padY + 6
  for (const entry of entries) {
    const ix = boxX + padX
    const tx = ix + iconW + gap

    if (entry.type === 'circle') {
      ctx.fillStyle = entry.color
      ctx.beginPath()
      ctx.arc(ix + iconW / 2, y, 4, 0, Math.PI * 2)
      ctx.fill()
    } else if (entry.type === 'line') {
      ctx.strokeStyle = entry.color
      ctx.lineWidth = 2.5
      ctx.setLineDash([])
      ctx.beginPath()
      ctx.moveTo(ix, y)
      ctx.lineTo(ix + iconW, y)
      ctx.stroke()
      ctx.fillStyle = entry.color
      ctx.beginPath()
      ctx.moveTo(ix + iconW, y)
      ctx.lineTo(ix + iconW - 4, y - 3)
      ctx.lineTo(ix + iconW - 4, y + 3)
      ctx.closePath()
      ctx.fill()
    } else if (entry.type === 'dash') {
      ctx.strokeStyle = entry.color
      ctx.lineWidth = 1.5
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.moveTo(ix, y)
      ctx.lineTo(ix + iconW, y)
      ctx.stroke()
      ctx.setLineDash([])
    } else if (entry.type === 'rect') {
      ctx.fillStyle = entry.color
      ctx.fillRect(ix, y - 4, iconW, 8)
    }

    ctx.font = '500 10px Inter, system-ui, sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = isDark ? '#CBD5E1' : '#374151'
    ctx.fillText(entry.label, tx, y)
    y += rowH
  }
}
