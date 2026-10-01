import type { CanvasBounds, GhostTrail, CanvasBackground } from '@/lib/physics/types'
import { t, type Lang } from '@/lib/i18n'
import {
  snellsLaw,
  criticalAngle,
  lensImageDistance,
  lensMagnification,
  lensPower,
} from '@/lib/physics/optics'
import type { RulerState, ProtractorState } from '@/store/toolStore'
import { drawRuler, drawProtractor } from './measurementTools'

interface OpticsRenderOptions {
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
  incidentRay: '#EF4444',
  refractedRay: '#3B82F6',
  reflectedRay: '#F59E0B',
  normal: '#6B7280',
  normalDark: '#94A3B8',
  interface: '#8B5CF6',
  interfaceDark: '#A78BFA',
  lens: '#3B82F6',
  lensDark: '#60A5FA',
  opticalAxis: '#6B7280',
  focalPoint: '#EF4444',
  objectArrow: '#059669',
  imageArrow: '#F59E0B',
  imageArrowVirtual: '#F59E0B',
  angleArc: '#D97706',
  criticalArc: '#EF4444',
  text: '#374151',
  textDark: '#D1D5DB',
  bgLight: '#FAFAFA',
  bgDark: '#0F172A',
  gridLight: '#E5E7EB',
  gridDark: '#1E293B',
  medium1: 'rgba(219, 234, 254, 0.3)',
  medium1Dark: 'rgba(30, 58, 138, 0.3)',
  medium2: 'rgba(254, 243, 199, 0.3)',
  medium2Dark: 'rgba(120, 53, 15, 0.2)',
}

export function renderOpticsFrame(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  options: OpticsRenderOptions,
) {
  const w = canvas.width
  const h = canvas.height
  const dpr = window.devicePixelRatio || 1
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, w, h)
  const cw = w / dpr
  const ch = h / dpr
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.fillStyle = options.isDark ? C.bgDark : C.bgLight
  ctx.fillRect(0, 0, cw, ch)

  const opticsType = options.params.opticsType ?? 0

  if (opticsType === 0 || opticsType === 3) renderRefraction(ctx, cw, ch, options)
  else if (opticsType === 1) renderLens(ctx, cw, ch, options)
  else renderTIR(ctx, cw, ch, options)

  if (options.tools?.ruler) {
    const b = options.bounds
    const bw = b.xMax - b.xMin
    const bh = b.yMax - b.yMin
    const scX = cw / bw
    const scY = ch / bh
    const sc = Math.min(scX, scY)
    const oX = cw / 2 - (b.xMin + bw / 2) * sc
    const oY = ch / 2 + (b.yMin + bh / 2) * sc
    drawRuler(ctx, options.tools.ruler, (x: number) => x * sc + oX, (y: number) => -y * sc + oY, sc, options.isDark)
  }
  if (options.tools?.protractor) {
    const b = options.bounds
    const bw = b.xMax - b.xMin
    const bh = b.yMax - b.yMin
    const scX = cw / bw
    const scY = ch / bh
    const sc = Math.min(scX, scY)
    const oX = cw / 2 - (b.xMin + bw / 2) * sc
    const oY = ch / 2 + (b.yMin + bh / 2) * sc
    drawProtractor(ctx, options.tools.protractor, (x: number) => x * sc + oX, (y: number) => -y * sc + oY, options.isDark)
  }
}

export function computeOpticsBounds(
  params: Record<string, number>,
  _compareMode: boolean,
  _paramsB?: Record<string, number>,
  _ghosts?: GhostTrail[],
): CanvasBounds {
  const opticsType = params.opticsType ?? 0
  if (opticsType === 1) {
    const f = Math.abs(params.focalLength ?? 15)
    const u = Math.abs(params.objectDist ?? -30)
    const span = Math.max(f * 3, u * 1.5, 30)
    return { xMin: -span, xMax: span, yMin: -span * 0.5, yMax: span * 0.5, scale: 1 }
  }
  return { xMin: -5, xMax: 5, yMin: -5, yMax: 5, scale: 1 }
}

// ===== GRID =====

function drawLabGrid(ctx: CanvasRenderingContext2D, cw: number, ch: number, isDark: boolean) {
  ctx.strokeStyle = isDark ? C.gridDark : C.gridLight
  ctx.lineWidth = 0.5
  const spacing = 40
  for (let x = 0; x < cw; x += spacing) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, ch)
    ctx.stroke()
  }
  for (let y = 0; y < ch; y += spacing) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(cw, y)
    ctx.stroke()
  }
}

// ===== TAB 0: REFRACTION =====

function renderRefraction(
  ctx: CanvasRenderingContext2D,
  cw: number, ch: number,
  opts: OpticsRenderOptions,
) {
  const { params, isDark, currentTime } = opts
  const n1 = params.n1 ?? 1.0
  const n2 = params.n2 ?? 1.5
  const theta1 = params.theta1 ?? 30
  const lang = opts.lang ?? 'en'

  if (opts.activeLayers.grid !== false) drawLabGrid(ctx, cw, ch, isDark)

  const midX = cw / 2
  const midY = ch / 2
  const rayLen = Math.min(cw, ch) * 0.38

  // Medium backgrounds
  ctx.fillStyle = isDark ? C.medium1Dark : C.medium1
  ctx.fillRect(0, 0, midX, ch)
  ctx.fillStyle = isDark ? C.medium2Dark : C.medium2
  ctx.fillRect(midX, 0, cw - midX, ch)

  // Interface line (vertical)
  ctx.strokeStyle = isDark ? C.interfaceDark : C.interface
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(midX, 0)
  ctx.lineTo(midX, ch)
  ctx.stroke()

  // Normal line (horizontal, dashed)
  ctx.strokeStyle = isDark ? C.normalDark : C.normal
  ctx.lineWidth = 1
  ctx.setLineDash([6, 4])
  ctx.beginPath()
  ctx.moveTo(midX - rayLen * 0.8, midY)
  ctx.lineTo(midX + rayLen * 0.8, midY)
  ctx.stroke()
  ctx.setLineDash([])

  // Normal label
  ctx.fillStyle = isDark ? C.textDark : C.text
  ctx.font = '11px system-ui'
  ctx.textAlign = 'center'
  ctx.fillText(t('optics.normal', lang), midX + rayLen * 0.65, midY - 8)

  const theta1Rad = theta1 * Math.PI / 180
  const theta2 = snellsLaw(n1, n2, theta1)

  // Animated ray progress - slower draw over ~4 seconds
  const progress = Math.min(currentTime * 0.25, 1)

  // Incident ray: comes from left, angle measured from normal (horizontal here)
  const incStartX = midX - rayLen * Math.cos(theta1Rad)
  const incStartY = midY - rayLen * Math.sin(theta1Rad)

  const animIncX = incStartX + (midX - incStartX) * progress
  const animIncY = incStartY + (midY - incStartY) * progress

  ctx.strokeStyle = C.incidentRay
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.moveTo(incStartX, incStartY)
  ctx.lineTo(animIncX, animIncY)
  ctx.stroke()
  drawArrowHead(ctx, incStartX, incStartY, animIncX, animIncY, C.incidentRay, 10)

  let refEndX = midX
  let refEndY = midY
  let outRayDrawn = false

  if (theta2 !== null && progress > 0.35) {
    const theta2Rad = theta2 * Math.PI / 180
    refEndX = midX + rayLen * Math.cos(theta2Rad)
    refEndY = midY + rayLen * Math.sin(theta2Rad)
    const refProgress = Math.min((currentTime * 0.25 - 0.35) / 0.65, 1)

    const animRefX = midX + (refEndX - midX) * Math.max(0, refProgress)
    const animRefY = midY + (refEndY - midY) * Math.max(0, refProgress)

    ctx.strokeStyle = C.refractedRay
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.moveTo(midX, midY)
    ctx.lineTo(animRefX, animRefY)
    ctx.stroke()
    if (refProgress > 0.1) drawArrowHead(ctx, midX, midY, animRefX, animRefY, C.refractedRay, 10)
    outRayDrawn = refProgress >= 1

    if (opts.activeLayers.angles !== false) {
      drawAngleArc(ctx, midX, midY, 40, Math.PI, Math.PI - theta1Rad, C.angleArc, `θ₁=${theta1.toFixed(1)}°`, isDark)
      drawAngleArc(ctx, midX, midY, 50, 0, theta2Rad, C.refractedRay, `θ₂=${theta2.toFixed(1)}°`, isDark)
    }
  } else if (theta2 === null && progress > 0.35) {
    refEndX = midX - rayLen * Math.cos(theta1Rad)
    refEndY = midY + rayLen * Math.sin(theta1Rad)
    const refProgress = Math.min((currentTime * 0.25 - 0.35) / 0.65, 1)

    const animReflX = midX + (refEndX - midX) * Math.max(0, refProgress)
    const animReflY = midY + (refEndY - midY) * Math.max(0, refProgress)

    ctx.strokeStyle = C.reflectedRay
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.moveTo(midX, midY)
    ctx.lineTo(animReflX, animReflY)
    ctx.stroke()
    if (refProgress > 0.1) drawArrowHead(ctx, midX, midY, animReflX, animReflY, C.reflectedRay, 10)
    outRayDrawn = refProgress >= 1

    ctx.fillStyle = C.reflectedRay
    ctx.font = 'bold 13px system-ui'
    ctx.textAlign = 'center'
    ctx.fillText('Total Internal Reflection', midX, midY - rayLen * 0.5)
  }

  // Continuous photon pulse traveling along ray path
  if (progress >= 1 && outRayDrawn) {
    const pulseLen = 3
    const p = (currentTime % pulseLen) / pulseLen
    if (p < 0.5) {
      const [px, py] = lerpXY(incStartX, incStartY, midX, midY, p * 2)
      drawPhotonPulse(ctx, px, py)
    } else {
      const [px, py] = lerpXY(midX, midY, refEndX, refEndY, (p - 0.5) * 2)
      drawPhotonPulse(ctx, px, py)
    }
  }

  // Medium labels
  ctx.font = 'bold 12px system-ui'
  ctx.fillStyle = isDark ? C.textDark : C.text
  ctx.textAlign = 'center'
  ctx.fillText(`n₁ = ${n1.toFixed(2)}`, midX * 0.5, 30)
  ctx.fillText(`n₂ = ${n2.toFixed(2)}`, midX * 1.5, 30)

  // Formula
  if (opts.activeLayers.values !== false) {
    ctx.fillStyle = isDark ? '#E2E8F0' : '#1E293B'
    ctx.font = 'bold 13px system-ui'
    ctx.textAlign = 'center'
    ctx.fillText('n₁ sin θ₁ = n₂ sin θ₂', cw / 2, ch - 30)
  }

  drawOpticsLegend(ctx, cw, opts.params.opticsType ?? 0, isDark, lang)
}

// ===== TAB 1: LENSES =====

function renderLens(
  ctx: CanvasRenderingContext2D,
  cw: number, ch: number,
  opts: OpticsRenderOptions,
) {
  const { params, isDark, currentTime } = opts
  const u = params.objectDist ?? -30
  const f = params.focalLength ?? 15
  const objHeight = params.objectHeight ?? 10
  const lang = opts.lang ?? 'en'

  if (opts.activeLayers.grid !== false) drawLabGrid(ctx, cw, ch, isDark)

  const midX = cw / 2
  const midY = ch / 2

  const v = lensImageDistance(u, f)
  const m = v !== null && v !== Infinity && v !== -Infinity ? lensMagnification(v, u) : 0

  const absU = Math.abs(u)
  const absF = Math.abs(f)
  const absV = v !== null && Number.isFinite(v) ? Math.abs(v) : 0
  const maxExtent = Math.max(absU, absV, absF * 2, 30)
  const scale = (cw * 0.4) / maxExtent

  // Optical axis
  ctx.strokeStyle = isDark ? C.normalDark : C.opticalAxis
  ctx.lineWidth = 1
  ctx.setLineDash([4, 4])
  ctx.beginPath()
  ctx.moveTo(20, midY)
  ctx.lineTo(cw - 20, midY)
  ctx.stroke()
  ctx.setLineDash([])

  // Lens
  const lensH = ch * 0.6
  const isConvex = f > 0
  ctx.strokeStyle = isDark ? C.lensDark : C.lens
  ctx.lineWidth = 3
  ctx.beginPath()
  if (isConvex) {
    ctx.moveTo(midX, midY - lensH / 2)
    ctx.quadraticCurveTo(midX + 15, midY, midX, midY + lensH / 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(midX, midY - lensH / 2)
    ctx.quadraticCurveTo(midX - 15, midY, midX, midY + lensH / 2)
    ctx.stroke()
  } else {
    ctx.moveTo(midX, midY - lensH / 2)
    ctx.quadraticCurveTo(midX - 12, midY, midX, midY + lensH / 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(midX, midY - lensH / 2)
    ctx.quadraticCurveTo(midX + 12, midY, midX, midY + lensH / 2)
    ctx.stroke()
  }

  // Arrowheads on lens
  const triSize = 6
  ctx.fillStyle = isDark ? C.lensDark : C.lens
  // Top
  ctx.beginPath()
  ctx.moveTo(midX, midY - lensH / 2)
  ctx.lineTo(midX - triSize, midY - lensH / 2 + triSize * 1.5)
  ctx.lineTo(midX + triSize, midY - lensH / 2 + triSize * 1.5)
  ctx.closePath()
  ctx.fill()
  // Bottom
  ctx.beginPath()
  ctx.moveTo(midX, midY + lensH / 2)
  ctx.lineTo(midX - triSize, midY + lensH / 2 - triSize * 1.5)
  ctx.lineTo(midX + triSize, midY + lensH / 2 - triSize * 1.5)
  ctx.closePath()
  ctx.fill()

  // Focal points
  const fScreenDist = absF * scale
  ctx.fillStyle = C.focalPoint
  const fpLeft = midX - fScreenDist
  const fpRight = midX + fScreenDist
  const fp2Left = midX - fScreenDist * 2
  const fp2Right = midX + fScreenDist * 2

  drawFocalDot(ctx, fpLeft, midY, 'F', isDark)
  drawFocalDot(ctx, fpRight, midY, 'F', isDark)
  if (fScreenDist * 2 < cw * 0.45) {
    drawFocalDot(ctx, fp2Left, midY, '2F', isDark)
    drawFocalDot(ctx, fp2Right, midY, '2F', isDark)
  }

  // Object arrow (green, on left side)
  const objScreenX = midX + u * scale // u is negative, so object is left
  const objScreenH = objHeight * scale * 0.5
  const focalXs = [fpLeft, fpRight]
  if (fScreenDist * 2 < cw * 0.45) { focalXs.push(fp2Left, fp2Right) }
  drawObjectArrow(ctx, objScreenX, midY, objScreenH, C.objectArrow, lang === 'hi' ? 'वस्तु' : 'Object', cw, focalXs)

  // Image
  if (v !== null && Number.isFinite(v) && Math.abs(v) < maxExtent * 3) {
    const imgScreenX = midX + v * scale
    const imgScreenH = objScreenH * m
    const isVirtual = v < 0

    // Animated image appearance - slower
    const imgProgress = Math.min(currentTime * 0.15, 1)
    const animImgH = imgScreenH * imgProgress

    drawImageArrow(ctx, imgScreenX, midY, animImgH, isVirtual ? C.imageArrowVirtual : C.imageArrow, isVirtual, lang === 'hi' ? 'प्रतिबिम्ब' : 'Image', cw, focalXs)

    if (opts.activeLayers.rays !== false && imgProgress > 0.15) {
      drawPrincipalRays(ctx, midX, midY, objScreenX, objScreenH, imgScreenX, animImgH, fpLeft, fpRight, isConvex, isVirtual, cw, isDark)
    }

    // Continuous photon pulse along ray 1 (parallel → through F)
    if (imgProgress >= 1) {
      const pulseLen = 3.5
      const p = (currentTime % pulseLen) / pulseLen
      if (p < 0.5) {
        const [px, py] = lerpXY(objScreenX, midY - objScreenH, midX, midY - objScreenH, p * 2)
        drawPhotonPulse(ctx, px, py)
      } else {
        const [px, py] = lerpXY(midX, midY - objScreenH, imgScreenX, midY - imgScreenH, (p - 0.5) * 2)
        drawPhotonPulse(ctx, px, py)
      }
    }
  } else if (v === Infinity) {
    // Image at infinity - rays are parallel after lens
    if (opts.activeLayers.rays !== false) {
      ctx.strokeStyle = C.refractedRay
      ctx.lineWidth = 1.5
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(midX, midY - objScreenH)
      ctx.lineTo(cw - 20, midY - objScreenH)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(midX, midY)
      ctx.lineTo(cw - 20, midY)
      ctx.stroke()
      ctx.setLineDash([])
    }
  }

  // Values display
  if (opts.activeLayers.values !== false) {
    ctx.fillStyle = isDark ? '#E2E8F0' : '#1E293B'
    ctx.font = 'bold 13px system-ui'
    ctx.textAlign = 'center'
    ctx.fillText('1/v - 1/u = 1/f', cw / 2, ch - 30)

    ctx.font = '11px system-ui'
    const vStr = v === null ? '---' : v === Infinity ? '∞' : `${v.toFixed(1)} cm`
    const mStr = m === 0 ? '---' : `${m.toFixed(2)}x`
    ctx.fillText(`u = ${u.toFixed(0)} cm | f = ${f > 0 ? '+' : ''}${f.toFixed(0)} cm | v = ${vStr} | m = ${mStr}`, cw / 2, ch - 12)
  }

  drawOpticsLegend(ctx, cw, 1, isDark, lang)
}

// ===== TAB 2: TOTAL INTERNAL REFLECTION =====

function renderTIR(
  ctx: CanvasRenderingContext2D,
  cw: number, ch: number,
  opts: OpticsRenderOptions,
) {
  const { params, isDark, currentTime } = opts
  const n1 = params.n1 ?? 1.5
  const n2 = params.n2 ?? 1.0
  const theta1 = params.theta1 ?? 30
  const lang = opts.lang ?? 'en'

  if (opts.activeLayers.grid !== false) drawLabGrid(ctx, cw, ch, isDark)

  const midX = cw / 2
  const midY = ch / 2
  const rayLen = Math.min(cw, ch) * 0.38

  // Medium backgrounds - denser medium on bottom
  ctx.fillStyle = isDark ? C.medium2Dark : C.medium2
  ctx.fillRect(0, midY, cw, ch - midY)
  ctx.fillStyle = isDark ? C.medium1Dark : C.medium1
  ctx.fillRect(0, 0, cw, midY)

  // Interface line (horizontal)
  ctx.strokeStyle = isDark ? C.interfaceDark : C.interface
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, midY)
  ctx.lineTo(cw, midY)
  ctx.stroke()

  // Normal line (vertical, dashed)
  ctx.strokeStyle = isDark ? C.normalDark : C.normal
  ctx.lineWidth = 1
  ctx.setLineDash([6, 4])
  ctx.beginPath()
  ctx.moveTo(midX, midY - rayLen * 0.8)
  ctx.lineTo(midX, midY + rayLen * 0.8)
  ctx.stroke()
  ctx.setLineDash([])

  ctx.fillStyle = isDark ? C.textDark : C.text
  ctx.font = '11px system-ui'
  ctx.textAlign = 'center'
  ctx.fillText(t('optics.normal', lang), midX + 40, midY - rayLen * 0.65)

  const theta1Rad = theta1 * Math.PI / 180
  const crit = criticalAngle(n1, n2)
  const theta2 = snellsLaw(n1, n2, theta1)
  const isTIR = theta2 === null

  const progress = Math.min(currentTime * 0.25, 1)

  // Incident ray: from bottom-left to point of incidence
  const incStartX = midX - rayLen * Math.sin(theta1Rad)
  const incStartY = midY + rayLen * Math.cos(theta1Rad)

  const animIncX = incStartX + (midX - incStartX) * progress
  const animIncY = incStartY + (midY - incStartY) * progress

  ctx.strokeStyle = C.incidentRay
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.moveTo(incStartX, incStartY)
  ctx.lineTo(animIncX, animIncY)
  ctx.stroke()
  drawArrowHead(ctx, incStartX, incStartY, animIncX, animIncY, C.incidentRay, 10)

  let outEndX = midX
  let outEndY = midY
  let allDrawn = false

  if (progress > 0.35) {
    const refProgress = Math.min((currentTime * 0.25 - 0.35) / 0.65, 1)

    if (!isTIR && theta2 !== null) {
      const theta2Rad = theta2 * Math.PI / 180
      const refEndX = midX + rayLen * Math.sin(theta2Rad)
      const refEndY = midY - rayLen * Math.cos(theta2Rad)
      outEndX = refEndX
      outEndY = refEndY

      const animRefX = midX + (refEndX - midX) * Math.max(0, refProgress)
      const animRefY = midY + (refEndY - midY) * Math.max(0, refProgress)

      ctx.strokeStyle = C.refractedRay
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.moveTo(midX, midY)
      ctx.lineTo(animRefX, animRefY)
      ctx.stroke()
      if (refProgress > 0.1) drawArrowHead(ctx, midX, midY, animRefX, animRefY, C.refractedRay, 10)
    }

    const reflEndX = midX + rayLen * Math.sin(theta1Rad)
    const reflEndY = midY + rayLen * Math.cos(theta1Rad)

    const reflAlpha = isTIR ? 1 : Math.max(0, (theta1 - (crit ?? 90) * 0.5) / ((crit ?? 90) * 0.5))
    if (reflAlpha > 0.05) {
      if (isTIR) { outEndX = reflEndX; outEndY = reflEndY }
      const animReflX = midX + (reflEndX - midX) * Math.max(0, refProgress)
      const animReflY = midY + (reflEndY - midY) * Math.max(0, refProgress)

      ctx.globalAlpha = isTIR ? 1 : reflAlpha * 0.5
      ctx.strokeStyle = C.reflectedRay
      ctx.lineWidth = isTIR ? 2.5 : 1.5
      ctx.beginPath()
      ctx.moveTo(midX, midY)
      ctx.lineTo(animReflX, animReflY)
      ctx.stroke()
      if (refProgress > 0.1) drawArrowHead(ctx, midX, midY, animReflX, animReflY, C.reflectedRay, 10)
      ctx.globalAlpha = 1
    }
    allDrawn = refProgress >= 1
  }

  // Continuous photon pulse
  if (progress >= 1 && allDrawn) {
    const pulseLen = 3
    const p = (currentTime % pulseLen) / pulseLen
    if (p < 0.5) {
      const [px, py] = lerpXY(incStartX, incStartY, midX, midY, p * 2)
      drawPhotonPulse(ctx, px, py)
    } else {
      const [px, py] = lerpXY(midX, midY, outEndX, outEndY, (p - 0.5) * 2)
      drawPhotonPulse(ctx, px, py)
    }
  }

  // Critical angle arc
  if (crit !== null && opts.activeLayers.angles !== false) {
    const critRad = crit * Math.PI / 180
    ctx.strokeStyle = C.criticalArc
    ctx.lineWidth = 1.5
    ctx.setLineDash([3, 3])
    ctx.beginPath()
    ctx.arc(midX, midY, 55, Math.PI / 2 - critRad, Math.PI / 2, true)
    ctx.stroke()
    ctx.setLineDash([])

    ctx.fillStyle = C.criticalArc
    ctx.font = '10px system-ui'
    ctx.textAlign = 'left'
    ctx.fillText(`θc=${crit.toFixed(1)}°`, midX + 60, midY + 20)
  }

  // Incident angle arc
  if (opts.activeLayers.angles !== false) {
    const arcR = 40
    ctx.strokeStyle = C.angleArc
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(midX, midY, arcR, Math.PI / 2, Math.PI / 2 - theta1Rad, true)
    ctx.stroke()
    ctx.fillStyle = C.angleArc
    ctx.font = '11px system-ui'
    ctx.textAlign = 'right'
    ctx.fillText(`θ₁=${theta1.toFixed(1)}°`, midX - arcR - 5, midY + 20)
  }

  // Medium labels
  ctx.font = 'bold 12px system-ui'
  ctx.fillStyle = isDark ? C.textDark : C.text
  ctx.textAlign = 'left'
  ctx.fillText(`n₂ = ${n2.toFixed(2)} (${lang === 'hi' ? 'विरल' : 'rarer'})`, 20, 30)
  ctx.fillText(`n₁ = ${n1.toFixed(2)} (${lang === 'hi' ? 'सघन' : 'denser'})`, 20, ch - 15)

  // TIR indicator
  if (isTIR) {
    ctx.fillStyle = C.reflectedRay
    ctx.font = 'bold 14px system-ui'
    ctx.textAlign = 'center'
    ctx.fillText(lang === 'hi' ? 'पूर्ण आंतरिक परावर्तन!' : 'Total Internal Reflection!', midX, 60)
  }

  if (opts.activeLayers.values !== false) {
    ctx.fillStyle = isDark ? '#E2E8F0' : '#1E293B'
    ctx.font = 'bold 13px system-ui'
    ctx.textAlign = 'center'
    ctx.fillText('θc = sin⁻¹(n₂/n₁)', cw / 2, ch - 30)
  }

  drawOpticsLegend(ctx, cw, 2, isDark, lang)
}

// ===== HELPERS =====

function drawArrowHead(
  ctx: CanvasRenderingContext2D,
  fromX: number, fromY: number,
  toX: number, toY: number,
  color: string, size: number,
) {
  const angle = Math.atan2(toY - fromY, toX - fromX)
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(toX, toY)
  ctx.lineTo(
    toX - size * Math.cos(angle - Math.PI / 6),
    toY - size * Math.sin(angle - Math.PI / 6),
  )
  ctx.lineTo(
    toX - size * Math.cos(angle + Math.PI / 6),
    toY - size * Math.sin(angle + Math.PI / 6),
  )
  ctx.closePath()
  ctx.fill()
}

function drawAngleArc(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number,
  startAngle: number, endAngle: number,
  color: string, label: string, isDark: boolean,
) {
  ctx.strokeStyle = color
  ctx.lineWidth = 1.5
  ctx.beginPath()
  if (startAngle > endAngle) {
    ctx.arc(cx, cy, r, endAngle, startAngle)
  } else {
    ctx.arc(cx, cy, r, startAngle, endAngle)
  }
  ctx.stroke()

  const midAngle = (startAngle + endAngle) / 2
  const labelX = cx + (r + 15) * Math.cos(midAngle)
  const labelY = cy + (r + 15) * Math.sin(midAngle)
  ctx.fillStyle = isDark ? '#E2E8F0' : '#1E293B'
  ctx.font = '10px system-ui'
  ctx.textAlign = 'center'
  ctx.fillText(label, labelX, labelY)
}

function drawFocalDot(ctx: CanvasRenderingContext2D, x: number, y: number, label: string, isDark: boolean) {
  ctx.fillStyle = C.focalPoint
  ctx.beginPath()
  ctx.arc(x, y, 4, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = isDark ? C.textDark : C.text
  ctx.font = 'bold 10px system-ui'
  ctx.textAlign = 'center'
  ctx.fillText(label, x, y + 16)
}

function drawObjectArrow(
  ctx: CanvasRenderingContext2D, x: number, y: number, h: number,
  color: string, label: string, cw: number, focalXs: number[],
) {
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = 3

  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x, y - h)
  ctx.stroke()

  // Arrowhead
  ctx.beginPath()
  ctx.moveTo(x, y - h)
  ctx.lineTo(x - 5, y - h + 10)
  ctx.lineTo(x + 5, y - h + 10)
  ctx.closePath()
  ctx.fill()

  const nearFocal = focalXs.some(fx => Math.abs(x - fx) < 25)
  const labelY = nearFocal ? y + 30 : y + 14
  ctx.font = 'bold 10px system-ui'
  if (x < 80) ctx.textAlign = 'left'
  else if (x > cw - 80) ctx.textAlign = 'right'
  else ctx.textAlign = 'center'
  ctx.fillText(label, x, labelY)
}

function drawImageArrow(
  ctx: CanvasRenderingContext2D, x: number, y: number, h: number,
  color: string, isVirtual: boolean, label: string, cw: number, focalXs: number[],
) {
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = isVirtual ? 2 : 3

  if (isVirtual) ctx.setLineDash([4, 4])
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x, y - h)
  ctx.stroke()
  if (isVirtual) ctx.setLineDash([])

  // Arrowhead
  const dir = h > 0 ? 1 : -1
  ctx.beginPath()
  ctx.moveTo(x, y - h)
  ctx.lineTo(x - 5, y - h + 10 * dir)
  ctx.lineTo(x + 5, y - h + 10 * dir)
  ctx.closePath()
  ctx.fill()

  const nearFocal = focalXs.some(fx => Math.abs(x - fx) < 25)
  const labelY = nearFocal ? y + 30 : y + 14
  const natureLabel = isVirtual ? `${label} (${h > 0 ? 'Virtual, Erect' : 'Virtual'})` : `${label} (Real)`
  ctx.font = 'bold 10px system-ui'
  const tw = ctx.measureText(natureLabel).width
  if (x - tw / 2 < 10) ctx.textAlign = 'left'
  else if (x + tw / 2 > cw - 10) ctx.textAlign = 'right'
  else ctx.textAlign = 'center'
  ctx.fillText(natureLabel, x, labelY)
}

function drawPrincipalRays(
  ctx: CanvasRenderingContext2D,
  lensX: number, lensY: number,
  objX: number, objH: number,
  imgX: number, imgH: number,
  fpLeft: number, fpRight: number,
  isConvex: boolean, isVirtual: boolean,
  cw: number, isDark: boolean,
) {
  const objTop = lensY - objH
  const imgTop = lensY - imgH

  ctx.lineWidth = 1.2
  ctx.globalAlpha = 0.7

  // Ray 1: Parallel to axis → through/from focal point
  ctx.strokeStyle = '#EF4444'
  ctx.beginPath()
  ctx.moveTo(objX, objTop)
  ctx.lineTo(lensX, objTop)
  ctx.stroke()

  if (isVirtual) {
    const dx = lensX - imgX
    const dy = objTop - imgTop
    const edgeX = cw - 20
    const edgeY = objTop + (dy / dx) * (edgeX - lensX)
    ctx.beginPath()
    ctx.moveTo(lensX, objTop)
    ctx.lineTo(edgeX, edgeY)
    ctx.stroke()
    ctx.setLineDash([4, 3])
    ctx.beginPath()
    ctx.moveTo(lensX, objTop)
    ctx.lineTo(imgX, imgTop)
    ctx.stroke()
    ctx.setLineDash([])
  } else {
    ctx.beginPath()
    ctx.moveTo(lensX, objTop)
    ctx.lineTo(imgX, imgTop)
    ctx.stroke()
  }

  // Ray 2: Through center of lens (undeviated)
  ctx.strokeStyle = '#059669'
  if (isVirtual) {
    const dx = lensX - objX
    const dy = lensY - objTop
    const edgeX = cw - 20
    const edgeY = objTop + (dy / dx) * (edgeX - objX)
    ctx.beginPath()
    ctx.moveTo(objX, objTop)
    ctx.lineTo(edgeX, edgeY)
    ctx.stroke()
    ctx.setLineDash([4, 3])
    ctx.beginPath()
    ctx.moveTo(lensX, lensY)
    ctx.lineTo(imgX, imgTop)
    ctx.stroke()
    ctx.setLineDash([])
  } else {
    ctx.beginPath()
    ctx.moveTo(objX, objTop)
    ctx.lineTo(imgX, imgTop)
    ctx.stroke()
  }

  // Ray 3: Through/toward focal point
  ctx.strokeStyle = '#8B5CF6'
  if (isConvex && !isVirtual) {
    ctx.beginPath()
    ctx.moveTo(objX, objTop)
    ctx.lineTo(lensX, imgTop)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(lensX, imgTop)
    ctx.lineTo(imgX, imgTop)
    ctx.stroke()
  } else if (!isConvex) {
    const slopeToF = (lensY - objTop) / (fpRight - objX)
    const yAtLens = objTop + slopeToF * (lensX - objX)
    ctx.beginPath()
    ctx.moveTo(objX, objTop)
    ctx.lineTo(lensX, yAtLens)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(lensX, yAtLens)
    ctx.lineTo(cw - 20, yAtLens)
    ctx.stroke()
    ctx.setLineDash([4, 3])
    ctx.beginPath()
    ctx.moveTo(lensX, yAtLens)
    ctx.lineTo(imgX, yAtLens)
    ctx.stroke()
    ctx.setLineDash([])
  }

  ctx.globalAlpha = 1
  ctx.setLineDash([])
}

function drawPhotonPulse(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const r = 6
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, r)
  gradient.addColorStop(0, 'rgba(255, 255, 220, 0.95)')
  gradient.addColorStop(0.4, 'rgba(255, 220, 100, 0.6)')
  gradient.addColorStop(1, 'rgba(255, 200, 50, 0)')
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
}

function lerpXY(x0: number, y0: number, x1: number, y1: number, t: number) {
  return [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t] as const
}

function drawOpticsLegend(ctx: CanvasRenderingContext2D, cw: number, opticsType: number, isDark: boolean, lang: Lang) {
  const x = cw - 10
  const startY = 20
  ctx.textAlign = 'right'
  ctx.font = '10px system-ui'
  const items: Array<[string, string]> = []

  if (opticsType === 0 || opticsType === 3) {
    items.push([C.incidentRay, t('optics.incidentRay', lang)])
    items.push([C.refractedRay, t('optics.refractedRay', lang)])
    items.push([C.normal, t('optics.normal', lang)])
  } else if (opticsType === 1) {
    items.push([C.objectArrow, t('optics.object', lang)])
    items.push([C.imageArrow, t('optics.image', lang)])
    items.push([C.focalPoint, t('optics.focalPoint', lang)])
    items.push([C.lens, t('optics.lens', lang)])
  } else {
    items.push([C.incidentRay, t('optics.incidentRay', lang)])
    items.push([C.refractedRay, t('optics.refractedRay', lang)])
    items.push([C.reflectedRay, t('optics.reflectedRay', lang)])
    items.push([C.criticalArc, t('optics.criticalAngle', lang)])
  }

  for (let i = 0; i < items.length; i++) {
    const y = startY + i * 18
    const tw = ctx.measureText(items[i][1]).width
    ctx.fillStyle = items[i][0]
    ctx.fillRect(x - tw - 18, y - 4, 12, 3)
    ctx.fillStyle = isDark ? C.textDark : C.text
    ctx.fillText(items[i][1], x, y)
  }
}
