import type { SimulationState, CanvasBounds, GhostTrail, CanvasBackground } from '@/lib/physics/types'
import { stateAtTime, trajectoryBounds, getTimeOfFlight } from '@/lib/physics/projectile'
import { t, type Lang } from '@/lib/i18n'
import { drawRuler, drawProtractor } from './measurementTools'
import type { RulerState, ProtractorState } from '@/store/toolStore'

const COLORS = {
  ball: '#EF4444',
  ballB: '#F97316',
  trajectory: '#3B82F6',
  trajectoryB: '#F97316',
  velocity: '#059669',
  velocityOutline: '#064E3B',
  acceleration: '#B45309',
  accelerationOutline: '#78350F',
  components: '#8B5CF6',
  componentsOutline: '#4C1D95',
  ground: '#6B7280',
  gridLight: '#E5E7EB',
  gridDark: '#1E293B',
  skyTop: '#E0F2FE',
  skyBottom: '#FAFAFA',
  darkBg: '#0F172A',
  groundDark: '#334155',
  cricketTop: '#BBF7D0',
  cricketBottom: '#DCFCE7',
  cricketDarkTop: '#052E16',
  cricketDarkBottom: '#064E3B',
  spaceBg: '#1E293B',
  lunarGround: '#94A3B8',
}

const PARAM_SYMBOLS: Record<string, string> = {
  v0: 'v₀', theta: 'θ', g: 'g', y0: 'y₀', drag: 'b', mass: 'm',
}

function getDiffLabel(
  params: Record<string, number>,
  other: Record<string, number>,
  lang: Lang
): string {
  const parts: string[] = []
  for (const [key, sym] of Object.entries(PARAM_SYMBOLS)) {
    const a = params[key] ?? 0
    const b = other[key] ?? 0
    if (Math.abs(a - b) > 0.0001) {
      if (key === 'drag' && a === 0) {
        parts.push(t('canvas.noDrag', lang))
      } else {
        const v = key === 'theta' ? `${a}°`
          : key === 'drag' ? a.toFixed(2)
          : key === 'mass' ? `${a} kg`
          : Number.isInteger(a) ? String(a)
          : String(parseFloat(a.toFixed(2)))
        parts.push(`${sym}=${v}`)
      }
    }
  }
  return parts.join(', ')
}

export interface RenderOptions {
  params: Record<string, number>
  currentTime: number
  bounds: CanvasBounds
  activeLayers: Record<string, boolean>
  isDark: boolean
  background: CanvasBackground
  ghostTrails: GhostTrail[]
  compareMode: boolean
  paramsB?: Record<string, number>
  dragHandles?: {
    angleArc: boolean
    speedArrow: boolean
  }
  lang?: Lang
  tools?: {
    ruler?: RulerState | null
    protractor?: ProtractorState | null
  }
}

function chooseTickSpacing(scale: number): number {
  const candidates = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100]
  for (const spacing of candidates) {
    const px = spacing * scale
    if (px >= 40 && px <= 100) return spacing
  }
  return candidates[candidates.length - 1]
}

export function computeUnifiedBounds(
  params: Record<string, number>,
  compareMode: boolean,
  paramsB?: Record<string, number>,
  ghosts?: GhostTrail[]
): CanvasBounds {
  const boundsA = trajectoryBounds(params)
  let xMax = boundsA.xMax
  let yMax = boundsA.yMax

  if (compareMode && paramsB) {
    const boundsB = trajectoryBounds(paramsB)
    xMax = Math.max(xMax, boundsB.xMax)
    yMax = Math.max(yMax, boundsB.yMax)
  }

  if (ghosts) {
    for (const ghost of ghosts) {
      for (const pt of ghost.points) {
        xMax = Math.max(xMax, pt.x * 1.15)
        yMax = Math.max(yMax, pt.y * 1.15)
      }
    }
  }

  const minArea = 5
  xMax = Math.max(xMax, minArea)
  yMax = Math.max(yMax, minArea)

  const padding = 0.15
  return {
    xMin: -xMax * padding,
    xMax: xMax + xMax * padding,
    yMin: -yMax * padding,
    yMax: yMax + yMax * padding,
    scale: 1,
  }
}

export function renderFrame(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  options: RenderOptions
) {
  const {
    params,
    currentTime,
    bounds,
    activeLayers,
    isDark,
    background,
    ghostTrails,
    compareMode,
    paramsB,
  } = options

  const w = canvas.width
  const h = canvas.height
  const dpr = window.devicePixelRatio || 1

  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, w, h)

  const bw = bounds.xMax - bounds.xMin
  const bh = bounds.yMax - bounds.yMin
  const scaleX = w / (bw * dpr)
  const scaleY = h / (bh * dpr)
  const scale = Math.min(scaleX, scaleY)

  const offsetX = w / (2 * dpr) - (bounds.xMin + bw / 2) * scale
  const offsetY = h / (2 * dpr) + (bounds.yMin + bh / 2) * scale

  drawBackground(ctx, w / dpr, h / dpr, isDark, dpr, background)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  const toSX = (x: number) => x * scale + offsetX
  const toSY = (y: number) => -y * scale + offsetY

  drawGround(ctx, w / dpr, toSY(0), isDark)

  if (activeLayers.grid !== false) {
    drawGrid(ctx, bounds, scale, offsetX, offsetY, w / dpr, h / dpr, isDark)
  }

  // Ghost trails
  for (const ghost of ghostTrails) {
    drawGhostTrail(ctx, ghost, toSX, toSY)
  }

  // Trajectory A
  if (activeLayers.trajectory !== false) {
    drawTrajectory(ctx, params, currentTime, toSX, toSY, COLORS.trajectory)
  }

  // Compare trajectory B
  if (compareMode && paramsB && activeLayers.trajectory !== false) {
    const tofB = getTimeOfFlight(paramsB)
    const tB = Math.min(currentTime, tofB)
    drawTrajectory(ctx, paramsB, tB, toSX, toSY, COLORS.trajectoryB)
  }

  // Ball A
  const stateA = stateAtTime(params, currentTime)
  const hasCompare = compareMode && !!paramsB
  drawBall(ctx, toSX(stateA.x), toSY(stateA.y), toSY(0), h / dpr, COLORS.ball, hasCompare ? 'A' : undefined)

  // Ball B (compare)
  if (hasCompare) {
    const tofB = getTimeOfFlight(paramsB!)
    const tB = Math.min(currentTime, tofB)
    const stateB = stateAtTime(paramsB!, tB)
    drawBall(ctx, toSX(stateB.x), toSY(stateB.y), toSY(0), h / dpr, COLORS.ballB, 'B')
  }

  // Vectors on ball A
  if (activeLayers.velocity) {
    drawVelocityVector(ctx, stateA, scale, toSX, toSY)
  }
  if (activeLayers.acceleration) {
    drawAccelerationVector(ctx, params, scale, toSX, toSY, stateA)
  }
  if (activeLayers.components) {
    drawComponentVectors(ctx, stateA, scale, toSX, toSY)
  }

  // Drag handles
  if (options.dragHandles?.angleArc) {
    drawAngleArc(ctx, params, scale, toSX, toSY)
  }
  if (options.dragHandles?.speedArrow) {
    drawSpeedArrow(ctx, params, scale, toSX, toSY)
  }

  // Measurement tools
  if (options.tools?.ruler) {
    drawRuler(ctx, options.tools.ruler, toSX, toSY, scale, isDark)
  }
  if (options.tools?.protractor) {
    drawProtractor(ctx, options.tools.protractor, toSX, toSY, isDark)
  }

  const lang = options.lang ?? 'en'

  drawLiveValues(ctx, stateA, w / dpr, h / dpr, isDark, lang)

  drawLegend(ctx, w / dpr, h / dpr, isDark, {
    showBallA: true,
    showBallB: compareMode && !!paramsB,
    showTrail: activeLayers.trajectory !== false,
    showVelocity: !!activeLayers.velocity,
    showAcceleration: !!activeLayers.acceleration,
    showComponents: !!activeLayers.components,
    showAngleHandle: !!options.dragHandles?.angleArc,
    showSpeedHandle: !!options.dragHandles?.speedArrow,
    isCompare: compareMode && !!paramsB,
    params,
    paramsB: compareMode && paramsB ? paramsB : undefined,
  }, lang)
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  isDark: boolean,
  dpr: number,
  bg: CanvasBackground
) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  if (bg === 'space') {
    ctx.fillStyle = COLORS.spaceBg
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#FFFFFF'
    for (let i = 0; i < 40; i++) {
      const sx = (Math.sin(i * 137.5) * 0.5 + 0.5) * w
      const sy = (Math.cos(i * 137.5) * 0.5 + 0.5) * h * 0.8
      ctx.beginPath()
      ctx.arc(sx, sy, 1, 0, Math.PI * 2)
      ctx.fill()
    }
    return
  }

  if (bg === 'cricket-field') {
    const grad = ctx.createLinearGradient(0, 0, 0, h)
    if (isDark) {
      grad.addColorStop(0, COLORS.cricketDarkTop)
      grad.addColorStop(1, COLORS.cricketDarkBottom)
    } else {
      grad.addColorStop(0, COLORS.cricketTop)
      grad.addColorStop(1, COLORS.cricketBottom)
    }
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)
    return
  }

  if (bg === 'split-sky-space') {
    const half = w / 2
    // Left: sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h)
    if (isDark) {
      skyGrad.addColorStop(0, COLORS.darkBg)
      skyGrad.addColorStop(1, COLORS.darkBg)
    } else {
      skyGrad.addColorStop(0, COLORS.skyTop)
      skyGrad.addColorStop(1, COLORS.skyBottom)
    }
    ctx.fillStyle = skyGrad
    ctx.fillRect(0, 0, half, h)

    // Right: space
    ctx.fillStyle = COLORS.spaceBg
    ctx.fillRect(half, 0, half, h)
    ctx.fillStyle = '#FFFFFF'
    for (let i = 0; i < 20; i++) {
      const sx = half + (Math.sin(i * 137.5) * 0.5 + 0.5) * half
      const sy = (Math.cos(i * 137.5) * 0.5 + 0.5) * h * 0.8
      ctx.beginPath()
      ctx.arc(sx, sy, 1, 0, Math.PI * 2)
      ctx.fill()
    }

    // Divider
    ctx.strokeStyle = COLORS.ground
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(half, 0)
    ctx.lineTo(half, h)
    ctx.stroke()
    return
  }

  // Default sky
  if (isDark) {
    ctx.fillStyle = COLORS.darkBg
    ctx.fillRect(0, 0, w, h)
  } else {
    const grad = ctx.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, COLORS.skyTop)
    grad.addColorStop(1, COLORS.skyBottom)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)
  }
}

function drawGround(ctx: CanvasRenderingContext2D, w: number, groundY: number, isDark: boolean) {
  ctx.strokeStyle = isDark ? COLORS.groundDark : COLORS.ground
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, groundY)
  ctx.lineTo(w, groundY)
  ctx.stroke()
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  bounds: CanvasBounds,
  scale: number,
  offsetX: number,
  offsetY: number,
  w: number,
  h: number,
  isDark: boolean
) {
  const spacing = chooseTickSpacing(scale)
  ctx.strokeStyle = isDark ? COLORS.gridDark : COLORS.gridLight
  ctx.font = '10px Inter, system-ui, sans-serif'
  ctx.fillStyle = isDark ? '#475569' : '#9CA3AF'

  const xStart = Math.floor(bounds.xMin / spacing) * spacing
  const xEnd = Math.ceil(bounds.xMax / spacing) * spacing
  const yStart = Math.floor(bounds.yMin / spacing) * spacing
  const yEnd = Math.ceil(bounds.yMax / spacing) * spacing

  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  for (let x = xStart; x <= xEnd; x += spacing) {
    const sx = x * scale + offsetX
    if (sx < 0 || sx > w) continue
    const isBold = Math.abs(x % (spacing * 5)) < 0.001
    ctx.lineWidth = isBold ? 1 : 0.5
    ctx.beginPath()
    ctx.moveTo(sx, 0)
    ctx.lineTo(sx, h)
    ctx.stroke()
    if (isBold && Math.abs(x) > 0.001) {
      ctx.fillText(`${x}m`, sx, Math.min(-0 * scale + offsetY + 4, h - 14))
    }
  }

  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  for (let y = yStart; y <= yEnd; y += spacing) {
    const sy = -y * scale + offsetY
    if (sy < 0 || sy > h) continue
    const isBold = Math.abs(y % (spacing * 5)) < 0.001
    ctx.lineWidth = isBold ? 1 : 0.5
    ctx.beginPath()
    ctx.moveTo(0, sy)
    ctx.lineTo(w, sy)
    ctx.stroke()
    if (isBold && Math.abs(y) > 0.001) {
      ctx.fillText(`${y}m`, offsetX - 14, Math.max(sy, 8))
    }
  }
}

function drawGhostTrail(
  ctx: CanvasRenderingContext2D,
  ghost: GhostTrail,
  toSX: (x: number) => number,
  toSY: (y: number) => number
) {
  if (ghost.points.length < 2) return

  ctx.globalAlpha = 0.2
  ctx.fillStyle = ghost.color

  for (const pt of ghost.points) {
    ctx.beginPath()
    ctx.arc(toSX(pt.x), toSY(pt.y), 4, 0, Math.PI * 2)
    ctx.fill()
  }

  // Label at peak
  const peak = ghost.points.reduce((best, pt) => (pt.y > best.y ? pt : best), ghost.points[0])
  if (ghost.label) {
    ctx.globalAlpha = 0.5
    ctx.font = '600 10px Inter, system-ui, sans-serif'
    ctx.fillStyle = ghost.color
    ctx.textAlign = 'center'
    ctx.fillText(ghost.label, toSX(peak.x), toSY(peak.y) - 10)
  }

  ctx.globalAlpha = 1
}

function drawTrajectory(
  ctx: CanvasRenderingContext2D,
  params: Record<string, number>,
  currentTime: number,
  toSX: (x: number) => number,
  toSY: (y: number) => number,
  color: string
) {
  if (currentTime <= 0) return

  const maxPoints = 500
  const step = Math.max(0.1, currentTime / maxPoints)
  const dots: { x: number; y: number }[] = []
  for (let t = 0; t <= currentTime; t += step) {
    const s = stateAtTime(params, t)
    dots.push({ x: s.x, y: s.y })
  }
  const cur = stateAtTime(params, currentTime)
  dots.push({ x: cur.x, y: cur.y })

  if (dots.length > 1) {
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(toSX(dots[0].x), toSY(dots[0].y))
    for (let i = 1; i < dots.length; i++) {
      ctx.lineTo(toSX(dots[i].x), toSY(dots[i].y))
    }
    ctx.stroke()
  }

  ctx.fillStyle = color
  for (const dot of dots) {
    ctx.beginPath()
    ctx.arc(toSX(dot.x), toSY(dot.y), 4, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawBall(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  groundY: number,
  canvasH: number,
  color: string,
  label?: string
) {
  const r = 8
  const height = groundY - y
  const maxH = canvasH * 0.7
  const shadowOpacity = Math.max(0.1, 0.6 - (height / maxH) * 0.5)
  ctx.fillStyle = `rgba(0,0,0,${shadowOpacity})`
  ctx.beginPath()
  ctx.ellipse(x, groundY, r * 1.2, r * 0.3, 0, 0, Math.PI * 2)
  ctx.fill()

  const lighter = color === COLORS.ball ? '#F87171' : '#FDBA74'
  const grad = ctx.createRadialGradient(x - 2, y - 2, 1, x, y, r)
  grad.addColorStop(0, lighter)
  grad.addColorStop(1, color)
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()

  if (label) {
    ctx.font = '700 10px Inter, system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText(label, x, y)
  }
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  color: string,
  outlineColor: string,
  shaftWidth: number,
  headLength: number,
  headWidth: number
) {
  const dx = toX - fromX
  const dy = toY - fromY
  const len = Math.sqrt(dx * dx + dy * dy)
  if (len < 2) return

  const angle = Math.atan2(dy, dx)

  // Outline
  ctx.strokeStyle = outlineColor
  ctx.lineWidth = shaftWidth + 2
  ctx.beginPath()
  ctx.moveTo(fromX, fromY)
  ctx.lineTo(toX - Math.cos(angle) * headLength, toY - Math.sin(angle) * headLength)
  ctx.stroke()

  // Shaft
  ctx.strokeStyle = color
  ctx.lineWidth = shaftWidth
  ctx.beginPath()
  ctx.moveTo(fromX, fromY)
  ctx.lineTo(toX - Math.cos(angle) * headLength, toY - Math.sin(angle) * headLength)
  ctx.stroke()

  // Head outline
  const hx1 = toX - headLength * Math.cos(angle) + headWidth * Math.sin(angle)
  const hy1 = toY - headLength * Math.sin(angle) - headWidth * Math.cos(angle)
  const hx2 = toX - headLength * Math.cos(angle) - headWidth * Math.sin(angle)
  const hy2 = toY - headLength * Math.sin(angle) + headWidth * Math.cos(angle)

  ctx.fillStyle = color
  ctx.strokeStyle = outlineColor
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(toX, toY)
  ctx.lineTo(hx1, hy1)
  ctx.lineTo(hx2, hy2)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
}

function drawVelocityVector(
  ctx: CanvasRenderingContext2D,
  state: SimulationState,
  scale: number,
  toSX: (x: number) => number,
  toSY: (y: number) => number
) {
  const vScale = 2 // 1px = 0.5 m/s
  const vx = state.vx * vScale
  const vy = state.vy * vScale
  const len = Math.sqrt(vx * vx + vy * vy)
  const clamped = Math.min(Math.max(len, 15), 120)
  const factor = len > 0 ? clamped / len : 0

  const sx = toSX(state.x)
  const sy = toSY(state.y)
  const ex = sx + vx * factor
  const ey = sy - vy * factor // screen Y is flipped

  drawArrow(ctx, sx, sy, ex, ey, COLORS.velocity, COLORS.velocityOutline, 2.5, 10, 7)
}

function drawAccelerationVector(
  ctx: CanvasRenderingContext2D,
  params: Record<string, number>,
  _scale: number,
  toSX: (x: number) => number,
  toSY: (y: number) => number,
  state: SimulationState
) {
  const g = params.g ?? 9.8
  const drag = params.drag ?? 0
  const aScale = 4

  let ax = 0
  let ay = -g
  if (drag > 0 && state.phase === 'flying') {
    const speed = Math.sqrt(state.vx * state.vx + state.vy * state.vy)
    if (speed > 0) {
      ax = -drag * speed * state.vx
      ay += -drag * speed * state.vy
    }
  }

  const aMag = Math.sqrt(ax * ax + ay * ay)
  if (aMag < 0.01) return
  const aLen = aMag * aScale
  const clamped = Math.min(Math.max(aLen, 15), 80)
  const normX = ax / aMag
  const normY = ay / aMag

  const sx = toSX(state.x)
  const sy = toSY(state.y)
  const ex = sx + normX * clamped
  const ey = sy - normY * clamped

  drawArrow(ctx, sx, sy, ex, ey, COLORS.acceleration, COLORS.accelerationOutline, 2.5, 10, 7)
}

function drawComponentVectors(
  ctx: CanvasRenderingContext2D,
  state: SimulationState,
  _scale: number,
  toSX: (x: number) => number,
  toSY: (y: number) => number
) {
  const vScale = 2
  const sx = toSX(state.x)
  const sy = toSY(state.y)

  // vx component (horizontal)
  const vxLen = Math.min(Math.max(Math.abs(state.vx * vScale), 10), 100)
  const vxDir = state.vx >= 0 ? 1 : -1
  drawArrow(ctx, sx, sy, sx + vxLen * vxDir, sy, COLORS.components, COLORS.componentsOutline, 2, 8, 5)

  // vy component (vertical)
  const vyLen = Math.min(Math.max(Math.abs(state.vy * vScale), 10), 100)
  const vyDir = state.vy >= 0 ? -1 : 1 // screen Y is flipped
  drawArrow(ctx, sx, sy, sx, sy + vyLen * vyDir, COLORS.components, COLORS.componentsOutline, 2, 8, 5)
}

function drawAngleArc(
  ctx: CanvasRenderingContext2D,
  params: Record<string, number>,
  _scale: number,
  toSX: (x: number) => number,
  toSY: (y: number) => number
) {
  const theta = (params.theta ?? 45) * Math.PI / 180
  const sx = toSX(0)
  const sy = toSY(params.y0 ?? 0)
  const arcRadius = 30

  ctx.strokeStyle = '#3B82F6'
  ctx.lineWidth = 2
  ctx.setLineDash([4, 4])
  ctx.beginPath()
  ctx.arc(sx, sy, arcRadius, -theta, 0)
  ctx.stroke()
  ctx.setLineDash([])

  const hx = sx + arcRadius * Math.cos(-theta)
  const hy = sy + arcRadius * Math.sin(-theta)
  ctx.fillStyle = '#3B82F6'
  ctx.beginPath()
  ctx.arc(hx, hy, 6, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.arc(hx, hy, 3, 0, Math.PI * 2)
  ctx.fill()
}

function drawSpeedArrow(
  ctx: CanvasRenderingContext2D,
  params: Record<string, number>,
  _scale: number,
  toSX: (x: number) => number,
  toSY: (y: number) => number
) {
  const theta = (params.theta ?? 45) * Math.PI / 180
  const v0 = params.v0 ?? 20
  const sx = toSX(0)
  const sy = toSY(params.y0 ?? 0)
  const arrowLen = Math.min(Math.max(v0 * 2, 20), 120)

  const ex = sx + arrowLen * Math.cos(-theta)
  const ey = sy + arrowLen * Math.sin(-theta)

  ctx.strokeStyle = 'rgba(5, 150, 105, 0.4)'
  ctx.lineWidth = 1
  ctx.setLineDash([3, 3])
  ctx.beginPath()
  ctx.moveTo(sx, sy)
  ctx.lineTo(ex, ey)
  ctx.stroke()
  ctx.setLineDash([])

  ctx.fillStyle = COLORS.velocity
  ctx.beginPath()
  ctx.arc(ex, ey, 6, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.arc(ex, ey, 3, 0, Math.PI * 2)
  ctx.fill()
}

interface LegendItems {
  showBallA: boolean
  showBallB: boolean
  showTrail: boolean
  showVelocity: boolean
  showAcceleration: boolean
  showComponents: boolean
  showAngleHandle: boolean
  showSpeedHandle: boolean
  isCompare: boolean
  params?: Record<string, number>
  paramsB?: Record<string, number>
}

function drawLegend(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number,
  isDark: boolean,
  items: LegendItems,
  lang: Lang
) {
  const entries: { color: string; label: string; type: 'circle' | 'line' | 'handle' }[] = []

  let labelA = items.isCompare ? t('canvas.ballA', lang) : t('canvas.ball', lang)
  let labelB = t('canvas.ballB', lang)
  if (items.isCompare && items.params && items.paramsB) {
    const diffA = getDiffLabel(items.params, items.paramsB, lang)
    const diffB = getDiffLabel(items.paramsB, items.params, lang)
    if (diffA) labelA += `: ${diffA}`
    if (diffB) labelB += `: ${diffB}`
  }

  entries.push({ color: COLORS.ball, label: labelA, type: 'circle' })
  if (items.showBallB) {
    entries.push({ color: COLORS.ballB, label: labelB, type: 'circle' })
  }
  if (items.showTrail) {
    if (items.isCompare) {
      entries.push({ color: COLORS.trajectory, label: t('canvas.trailA', lang), type: 'circle' })
      entries.push({ color: COLORS.trajectoryB, label: t('canvas.trailB', lang), type: 'circle' })
    } else {
      entries.push({ color: COLORS.trajectory, label: t('canvas.trail', lang), type: 'circle' })
    }
  }
  if (items.showVelocity) {
    entries.push({ color: COLORS.velocity, label: t('canvas.velocity', lang), type: 'line' })
  }
  if (items.showAcceleration) {
    const hasDrag = (items.params?.drag ?? 0) > 0
    entries.push({ color: COLORS.acceleration, label: hasDrag ? t('canvas.acceleration', lang) : t('canvas.gravity', lang), type: 'line' })
  }
  if (items.showComponents) {
    entries.push({ color: COLORS.components, label: 'Vx / Vy', type: 'line' })
  }
  if (items.showAngleHandle) {
    entries.push({ color: '#3B82F6', label: t('canvas.angle', lang), type: 'handle' })
  }
  if (items.showSpeedHandle) {
    entries.push({ color: COLORS.velocity, label: t('canvas.speed', lang), type: 'handle' })
  }

  if (entries.length <= 1) return

  ctx.font = '500 10px Inter, system-ui, sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'

  const iconW = 14
  const gap = 6
  const padX = 8
  const padY = 6
  const maxAvailH = canvasH - 16
  const idealRowH = 16
  const rawBoxH = padY * 2 + 12 + (entries.length - 1) * idealRowH
  const rowH = rawBoxH > maxAvailH
    ? Math.max(9, Math.floor((maxAvailH - padY * 2 - 12) / (entries.length - 1)))
    : idealRowH

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
    } else if (entry.type === 'handle') {
      ctx.fillStyle = entry.color
      ctx.beginPath()
      ctx.arc(ix + iconW / 2, y, 4.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = isDark ? 'rgba(15,23,42,0.75)' : 'rgba(255,255,255,0.75)'
      ctx.beginPath()
      ctx.arc(ix + iconW / 2, y, 2, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.font = '500 10px Inter, system-ui, sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = isDark ? '#CBD5E1' : '#374151'
    ctx.fillText(entry.label, tx, y)
    y += rowH
  }
}

function drawLiveValues(
  ctx: CanvasRenderingContext2D,
  state: SimulationState,
  w: number,
  h: number,
  isDark: boolean,
  lang: Lang
) {
  const speed = Math.sqrt(state.vx * state.vx + state.vy * state.vy)
  const lines = lang === 'hi'
    ? [
        `समय = ${state.t.toFixed(2)} s`,
        `ऊँचाई = ${state.y.toFixed(2)} m`,
        `दूरी = ${state.x.toFixed(2)} m`,
        `वेग = ${speed.toFixed(2)} m/s`,
      ]
    : [
        `t = ${state.t.toFixed(2)} s`,
        `h = ${state.y.toFixed(2)} m`,
        `x = ${state.x.toFixed(2)} m`,
        `v = ${speed.toFixed(2)} m/s`,
      ]

  ctx.font = '600 12px Inter, system-ui, sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  const lineHeight = 20
  const padding = 6
  const x = 12
  let y = h - 12 - lines.length * lineHeight

  for (const line of lines) {
    const metrics = ctx.measureText(line)
    const tw = metrics.width + padding * 2

    ctx.fillStyle = isDark ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.85)'
    ctx.beginPath()
    ctx.roundRect(x, y - 14, tw, lineHeight, 4)
    ctx.fill()

    ctx.fillStyle = isDark ? '#F1F5F9' : '#111827'
    ctx.fillText(line, x + padding, y)
    y += lineHeight
  }
}

export function getCanvasTransforms(
  canvas: HTMLCanvasElement,
  bounds: CanvasBounds
) {
  const dpr = window.devicePixelRatio || 1
  const w = canvas.width
  const h = canvas.height
  const bw = bounds.xMax - bounds.xMin
  const bh = bounds.yMax - bounds.yMin
  const scaleX = w / (bw * dpr)
  const scaleY = h / (bh * dpr)
  const scale = Math.min(scaleX, scaleY)
  const offsetX = w / (2 * dpr) - (bounds.xMin + bw / 2) * scale
  const offsetY = h / (2 * dpr) + (bounds.yMin + bh / 2) * scale

  const toSX = (x: number) => x * scale + offsetX
  const toSY = (y: number) => -y * scale + offsetY
  const fromSX = (sx: number) => (sx - offsetX) / scale
  const fromSY = (sy: number) => -(sy - offsetY) / scale

  return { scale, offsetX, offsetY, toSX, toSY, fromSX, fromSY }
}
