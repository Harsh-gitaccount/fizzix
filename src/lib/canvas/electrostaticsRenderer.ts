import type { CanvasBounds, GhostTrail, CanvasBackground } from '@/lib/physics/types'
import { t, type Lang } from '@/lib/i18n'
import {
  coulombForce,
  electricFieldAt,
  traceFieldLine,
  ohmsCurrent,
  seriesResistance,
  parallelResistance,
  electricPower,
  type PointCharge,
} from '@/lib/physics/electrostatics'
import type { RulerState, ProtractorState } from '@/store/toolStore'
import { drawRuler, drawProtractor } from './measurementTools'

interface ElecRenderOptions {
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
  positive: '#EF4444',
  negative: '#3B82F6',
  forceAttr: '#F59E0B',
  forceRep: '#EF4444',
  fieldLine: '#8B5CF6',
  fieldLineDark: '#A78BFA',
  wire: '#374151',
  wireDark: '#9CA3AF',
  battery: '#F59E0B',
  batteryDark: '#FBBF24',
  resistor: '#8B5CF6',
  resistorDark: '#A78BFA',
  currentDot: '#F59E0B',
  text: '#374151',
  textDark: '#D1D5DB',
  bgLight: '#FAFAFA',
  bgDark: '#0F172A',
  gridLight: '#E5E7EB',
  gridDark: '#1E293B',
}

// ===== MAIN ENTRY =====

export function renderElecFrame(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  options: ElecRenderOptions,
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

  const elecType = options.params.elecType ?? 0

  if (elecType === 0) renderCharges(ctx, cw, ch, options)
  else if (elecType === 1) renderFieldLines(ctx, cw, ch, options)
  else if (elecType === 2) renderSimpleCircuit(ctx, cw, ch, options)
  else renderSeriesParallel(ctx, cw, ch, options)

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

export function computeElecBounds(
  params: Record<string, number>,
  _compareMode: boolean,
  _paramsB?: Record<string, number>,
  _ghosts?: GhostTrail[],
): CanvasBounds {
  const elecType = params.elecType ?? 0
  if (elecType <= 1) {
    const distance = params.distance ?? 0.5
    const pad = Math.max(distance * 0.5, 0.2)
    return {
      xMin: -pad,
      xMax: distance + pad,
      yMin: -(distance * 0.5 + pad),
      yMax: distance * 0.5 + pad,
      scale: 1,
    }
  }
  return { xMin: 0, xMax: 10, yMin: 0, yMax: 8, scale: 1 }
}

// ===== TAB 0: CHARGES =====

function renderCharges(
  ctx: CanvasRenderingContext2D,
  cw: number, ch: number,
  opts: ElecRenderOptions,
) {
  const { params, isDark, currentTime } = opts
  const q1 = params.q1 ?? 2
  const q2 = params.q2 ?? -2
  const distance = params.distance ?? 0.5
  const lang = opts.lang ?? 'en'

  const maxDist = 2
  const displayScale = (cw * 0.5) / maxDist
  const centerY = ch * 0.45
  const x1Screen = cw / 2 - (distance / 2) * displayScale
  const x2Screen = cw / 2 + (distance / 2) * displayScale

  if (opts.activeLayers.grid !== false) {
    drawLabGrid(ctx, cw, ch, isDark)
  }

  const force = coulombForce(q1, q2, distance)
  const isRepulsive = force > 0

  const pulse = 1 + 0.18 * Math.sin(currentTime * Math.PI * 2)

  if (opts.activeLayers.forceVectors !== false && q1 !== 0 && q2 !== 0) {
    const forceLen = Math.min(Math.abs(force) * 400, cw * 0.15) * pulse
    const fColor = isRepulsive ? C.forceRep : C.forceAttr
    if (isRepulsive) {
      drawArrow(ctx, x1Screen, centerY, x1Screen - forceLen, centerY, fColor, 3)
      drawArrow(ctx, x2Screen, centerY, x2Screen + forceLen, centerY, fColor, 3)
    } else {
      drawArrow(ctx, x1Screen, centerY, x1Screen + forceLen, centerY, fColor, 3)
      drawArrow(ctx, x2Screen, centerY, x2Screen - forceLen, centerY, fColor, 3)
    }
  }

  const chargeRadius = 24 + 3 * Math.sin(currentTime * Math.PI * 2)
  drawCharge(ctx, x1Screen, centerY, q1, chargeRadius, isDark)
  drawCharge(ctx, x2Screen, centerY, q2, chargeRadius, isDark)

  // Distance bracket
  ctx.strokeStyle = isDark ? '#94A3B8' : '#6B7280'
  ctx.lineWidth = 1
  const bracketY = centerY + 45
  ctx.beginPath()
  ctx.moveTo(x1Screen, bracketY - 5)
  ctx.lineTo(x1Screen, bracketY)
  ctx.lineTo(x2Screen, bracketY)
  ctx.lineTo(x2Screen, bracketY - 5)
  ctx.stroke()
  ctx.fillStyle = isDark ? C.textDark : C.text
  ctx.font = 'bold 11px system-ui'
  ctx.textAlign = 'center'
  ctx.fillText(`r = ${distance.toFixed(2)} m`, (x1Screen + x2Screen) / 2, bracketY + 14)

  if (opts.activeLayers.values !== false) {
    ctx.fillStyle = isDark ? '#E2E8F0' : '#1E293B'
    ctx.font = 'bold 13px system-ui'
    ctx.textAlign = 'center'
    ctx.fillText('F = kq₁q₂/r²', cw / 2, 30)

    ctx.font = '12px system-ui'
    const nature = isRepulsive ? (lang === 'hi' ? 'प्रतिकर्षण' : 'Repulsive') : (lang === 'hi' ? 'आकर्षण' : 'Attractive')
    ctx.fillStyle = isRepulsive ? C.forceRep : C.forceAttr
    ctx.fillText(`|F| = ${Math.abs(force).toFixed(4)} N (${nature})`, cw / 2, 50)
  }

  // Charge labels
  ctx.fillStyle = isDark ? C.textDark : C.text
  ctx.font = '11px system-ui'
  ctx.textAlign = 'center'
  ctx.fillText(`q₁ = ${q1 >= 0 ? '+' : ''}${q1.toFixed(1)} µC`, x1Screen, centerY - 35)
  ctx.fillText(`q₂ = ${q2 >= 0 ? '+' : ''}${q2.toFixed(1)} µC`, x2Screen, centerY - 35)

  drawElecLegend(ctx, cw, 0, opts.activeLayers, isDark, lang)
  drawElecLabels(ctx, cw, ch, params, isDark)
}

// ===== TAB 1: FIELD LINES =====

function renderFieldLines(
  ctx: CanvasRenderingContext2D,
  cw: number, ch: number,
  opts: ElecRenderOptions,
) {
  const { params, isDark, currentTime } = opts
  const q1 = params.q1 ?? 2
  const q2 = params.q2 ?? -2
  const distance = params.distance ?? 0.5
  const lang = opts.lang ?? 'en'

  const maxDist = 2
  const displayScale = (cw * 0.5) / maxDist
  const centerY = ch * 0.5
  const x1Screen = cw / 2 - (distance / 2) * displayScale
  const x2Screen = cw / 2 + (distance / 2) * displayScale

  if (opts.activeLayers.grid !== false) {
    drawLabGrid(ctx, cw, ch, isDark)
  }

  const allScreenPts: Array<Array<{ x: number; y: number }>> = []

  if (opts.activeLayers.fieldLines !== false) {
    const charges: PointCharge[] = [
      { q: q1, x: 0, y: 0 },
      { q: q2, x: distance, y: 0 },
    ]

    const physBounds = {
      xMin: -distance * 1.5,
      xMax: distance * 2.5,
      yMin: -distance * 1.5,
      yMax: distance * 1.5,
    }

    const stepSize = distance * 0.015
    const chargeRadius = distance * 0.04

    const lineColor = isDark ? C.fieldLineDark : C.fieldLine

    const drawFieldLinesFromCharge = (charge: PointCharge, numLines: number, dir: 1 | -1) => {
      const startR = distance * 0.06
      for (let i = 0; i < numLines; i++) {
        const angle = (2 * Math.PI * i) / numLines
        const sx = charge.x + startR * Math.cos(angle)
        const sy = charge.y + startR * Math.sin(angle)
        const pts = traceFieldLine(charges, sx, sy, dir, stepSize, physBounds, chargeRadius)
        if (pts.length < 2) continue

        const screenPts: Array<{ x: number; y: number }> = []
        ctx.beginPath()
        for (let j = 0; j < pts.length; j++) {
          const px = cw / 2 + (pts[j].x - distance / 2) * displayScale
          const py = centerY - pts[j].y * displayScale
          screenPts.push({ x: px, y: py })
          if (j === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        }
        ctx.strokeStyle = lineColor
        ctx.lineWidth = 1.5
        ctx.globalAlpha = 0.7
        ctx.stroke()
        ctx.globalAlpha = 1

        allScreenPts.push(screenPts)

        // Arrowhead at midpoint
        const mid = Math.floor(pts.length / 2)
        if (mid > 0 && mid < pts.length - 1) {
          const mx = screenPts[mid].x
          const my = screenPts[mid].y
          const nx = screenPts[mid + 1].x
          const ny = screenPts[mid + 1].y
          const a = Math.atan2(ny - my, nx - mx)
          drawArrowhead(ctx, mx, my, a, lineColor, 5)
        }
      }
    }

    const hasPositive = q1 > 0 || q2 > 0
    const c1: PointCharge = { q: q1, x: 0, y: 0 }
    const c2: PointCharge = { q: q2, x: distance, y: 0 }

    if (hasPositive) {
      if (q1 > 0) {
        const n = Math.min(Math.ceil(Math.abs(q1) * 4), 16)
        drawFieldLinesFromCharge(c1, n, 1)
      }
      if (q2 > 0) {
        const n = Math.min(Math.ceil(Math.abs(q2) * 4), 16)
        drawFieldLinesFromCharge(c2, n, 1)
      }
    } else {
      if (q1 < 0) {
        const n = Math.min(Math.ceil(Math.abs(q1) * 4), 16)
        drawFieldLinesFromCharge(c1, n, -1)
      }
      if (q2 < 0) {
        const n = Math.min(Math.ceil(Math.abs(q2) * 4), 16)
        drawFieldLinesFromCharge(c2, n, -1)
      }
    }

    // Animated dots flowing along field lines
    if (currentTime > 0) {
      const dotColor = isDark ? '#E9D5FF' : '#7C3AED'
      for (const line of allScreenPts) {
        if (line.length < 4) continue
        const segs: number[] = []
        let totalLen = 0
        for (let k = 1; k < line.length; k++) {
          const dx = line[k].x - line[k - 1].x
          const dy = line[k].y - line[k - 1].y
          const seg = Math.sqrt(dx * dx + dy * dy)
          segs.push(seg)
          totalLen += seg
        }
        if (totalLen < 20) continue
        const numDots = Math.max(2, Math.floor(totalLen / 60))
        const phase = (currentTime * 40) % totalLen
        for (let d = 0; d < numDots; d++) {
          let pos = (phase + (d / numDots) * totalLen) % totalLen
          let acc = 0
          for (let s = 0; s < segs.length; s++) {
            if (acc + segs[s] >= pos) {
              const frac = (pos - acc) / segs[s]
              const px = line[s].x + frac * (line[s + 1].x - line[s].x)
              const py = line[s].y + frac * (line[s + 1].y - line[s].y)
              ctx.beginPath()
              ctx.arc(px, py, 3, 0, Math.PI * 2)
              ctx.fillStyle = dotColor
              ctx.globalAlpha = 0.85
              ctx.fill()
              ctx.globalAlpha = 1
              break
            }
            acc += segs[s]
          }
        }
      }
    }
  }

  drawCharge(ctx, x1Screen, centerY, q1, 20, isDark)
  drawCharge(ctx, x2Screen, centerY, q2, 20, isDark)

  ctx.fillStyle = isDark ? C.textDark : C.text
  ctx.font = '11px system-ui'
  ctx.textAlign = 'center'
  ctx.fillText(`q₁ = ${q1 >= 0 ? '+' : ''}${q1.toFixed(1)} µC`, x1Screen, centerY - 30)
  ctx.fillText(`q₂ = ${q2 >= 0 ? '+' : ''}${q2.toFixed(1)} µC`, x2Screen, centerY - 30)

  if (opts.activeLayers.values !== false) {
    const force = coulombForce(q1, q2, distance)
    ctx.fillStyle = isDark ? '#E2E8F0' : '#1E293B'
    ctx.font = 'bold 12px system-ui'
    ctx.textAlign = 'center'
    ctx.fillText(`|F| = ${Math.abs(force).toFixed(4)} N`, cw / 2, 28)
  }

  drawElecLegend(ctx, cw, 1, opts.activeLayers, isDark, lang)
}

// ===== TAB 2: SIMPLE CIRCUIT =====

function renderSimpleCircuit(
  ctx: CanvasRenderingContext2D,
  cw: number, ch: number,
  opts: ElecRenderOptions,
) {
  const { params, currentTime, isDark } = opts
  const voltage = params.voltage ?? 9
  const r1 = params.r1 ?? 100
  const lang = opts.lang ?? 'en'
  const current = ohmsCurrent(voltage, r1)
  const pow = electricPower(voltage, current)

  if (opts.activeLayers.grid !== false) {
    drawLabGrid(ctx, cw, ch, isDark)
  }

  const mx = cw * 0.18
  const my = ch * 0.2
  const rw = cw - 2 * mx
  const rh = ch * 0.5

  const left = mx
  const right = mx + rw
  const top = my
  const bottom = my + rh

  const wireColor = isDark ? C.wireDark : C.wire

  // Left wire
  ctx.beginPath()
  ctx.moveTo(left, top)
  ctx.lineTo(left, bottom)
  ctx.strokeStyle = wireColor
  ctx.lineWidth = 2.5
  ctx.stroke()

  // Right wire
  ctx.beginPath()
  ctx.moveTo(right, top)
  ctx.lineTo(right, bottom)
  ctx.strokeStyle = wireColor
  ctx.lineWidth = 2.5
  ctx.stroke()

  // Top wire segments (with resistor gap)
  const resW = Math.min(rw * 0.4, 120)
  const resMid = (left + right) / 2
  ctx.beginPath()
  ctx.moveTo(left, top)
  ctx.lineTo(resMid - resW / 2, top)
  ctx.strokeStyle = wireColor
  ctx.lineWidth = 2.5
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(resMid + resW / 2, top)
  ctx.lineTo(right, top)
  ctx.stroke()

  // Bottom wire segments (with battery gap)
  const batW = 40
  const batMid = (left + right) / 2
  ctx.beginPath()
  ctx.moveTo(left, bottom)
  ctx.lineTo(batMid - batW / 2 - 5, bottom)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(batMid + batW / 2 + 5, bottom)
  ctx.lineTo(right, bottom)
  ctx.stroke()

  drawResistorSymbol(ctx, resMid - resW / 2, top, resW, isDark)
  drawBatterySymbol(ctx, batMid, bottom, voltage, isDark)

  // Labels
  ctx.fillStyle = isDark ? C.textDark : C.text
  ctx.font = 'bold 12px system-ui'
  ctx.textAlign = 'center'
  ctx.fillText(`R = ${r1.toFixed(0)} Ω`, resMid, top - 15)
  ctx.fillText(`V = ${voltage.toFixed(1)} V`, batMid, bottom + 35)

  // Animated current dots
  if (opts.activeLayers.currentDots !== false && current > 0) {
    const path = [
      { x: batMid + batW / 2 + 5, y: bottom },
      { x: right, y: bottom },
      { x: right, y: top },
      { x: resMid + resW / 2, y: top },
      { x: resMid - resW / 2, y: top },
      { x: left, y: top },
      { x: left, y: bottom },
      { x: batMid - batW / 2 - 5, y: bottom },
    ]
    const speed = Math.min(current * 5, 3)
    drawCurrentDots(ctx, path, currentTime, speed, isDark)
  }

  // Current direction arrow
  ctx.fillStyle = isDark ? '#FDE68A' : '#D97706'
  ctx.font = 'bold 11px system-ui'
  ctx.textAlign = 'center'
  ctx.fillText(`I = ${current.toFixed(4)} A`, cw / 2, top + rh / 2)
  drawArrow(ctx, right - 20, top + rh * 0.3, right - 20, top + rh * 0.5, isDark ? '#FDE68A' : '#D97706', 2)

  if (opts.activeLayers.values !== false) {
    ctx.fillStyle = isDark ? '#E2E8F0' : '#1E293B'
    ctx.font = 'bold 13px system-ui'
    ctx.textAlign = 'center'
    ctx.fillText('V = IR', cw / 2, ch - 50)
    ctx.font = '11px system-ui'
    ctx.fillText(`P = ${pow.toFixed(3)} W`, cw / 2, ch - 32)
  }

  drawElecLegend(ctx, cw, 2, opts.activeLayers, isDark, lang)
}

// ===== TAB 3: SERIES VS PARALLEL =====

function renderSeriesParallel(
  ctx: CanvasRenderingContext2D,
  cw: number, ch: number,
  opts: ElecRenderOptions,
) {
  const { params, currentTime, isDark } = opts
  const voltage = params.voltage ?? 9
  const r1 = params.r1 ?? 100
  const r2 = params.r2 ?? 200
  const lang = opts.lang ?? 'en'

  const rSer = seriesResistance(r1, r2)
  const rPar = parallelResistance(r1, r2)
  const iSer = ohmsCurrent(voltage, rSer)
  const iPar = ohmsCurrent(voltage, rPar)

  if (opts.activeLayers.grid !== false) {
    drawLabGrid(ctx, cw, ch, isDark)
  }

  const halfH = ch / 2 - 10

  // ===== SERIES (top half) =====
  ctx.save()
  ctx.beginPath()
  ctx.rect(0, 0, cw, halfH)
  ctx.clip()

  const sLabel = lang === 'hi' ? 'श्रेणी (SERIES)' : 'SERIES'
  ctx.fillStyle = isDark ? '#93C5FD' : '#2563EB'
  ctx.font = 'bold 12px system-ui'
  ctx.textAlign = 'left'
  ctx.fillText(sLabel, 12, 20)

  const sMx = cw * 0.12
  const sTop = 35
  const sBottom = halfH - 25
  const sLeft = sMx
  const sRight = cw - sMx
  const sW = sRight - sLeft

  const wireCol = isDark ? C.wireDark : C.wire

  // Wires
  ctx.strokeStyle = wireCol
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(sLeft, sTop)
  ctx.lineTo(sLeft, sBottom)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(sRight, sTop)
  ctx.lineTo(sRight, sBottom)
  ctx.stroke()

  // Two resistors in series on top
  const resLen = sW * 0.22
  const gap = sW * 0.06
  const r1Start = (sLeft + sRight) / 2 - resLen - gap / 2
  const r2Start = (sLeft + sRight) / 2 + gap / 2

  ctx.beginPath()
  ctx.moveTo(sLeft, sTop)
  ctx.lineTo(r1Start, sTop)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(r1Start + resLen, sTop)
  ctx.lineTo(r2Start, sTop)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(r2Start + resLen, sTop)
  ctx.lineTo(sRight, sTop)
  ctx.stroke()

  drawResistorSymbol(ctx, r1Start, sTop, resLen, isDark)
  drawResistorSymbol(ctx, r2Start, sTop, resLen, isDark)

  // Battery on bottom
  const batW = 30
  const batMidS = (sLeft + sRight) / 2
  ctx.beginPath()
  ctx.moveTo(sLeft, sBottom)
  ctx.lineTo(batMidS - batW / 2 - 5, sBottom)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(batMidS + batW / 2 + 5, sBottom)
  ctx.lineTo(sRight, sBottom)
  ctx.stroke()
  drawBatterySymbol(ctx, batMidS, sBottom, voltage, isDark)

  // Labels
  ctx.fillStyle = isDark ? C.textDark : C.text
  ctx.font = '10px system-ui'
  ctx.textAlign = 'center'
  ctx.fillText(`R₁=${r1.toFixed(0)}Ω`, r1Start + resLen / 2, sTop - 12)
  ctx.fillText(`R₂=${r2.toFixed(0)}Ω`, r2Start + resLen / 2, sTop - 12)

  ctx.font = 'bold 11px system-ui'
  ctx.fillStyle = isDark ? '#93C5FD' : '#2563EB'
  ctx.fillText(`R = ${rSer.toFixed(0)} Ω   I = ${iSer.toFixed(4)} A`, cw / 2, (sTop + sBottom) / 2 + 5)

  if (opts.activeLayers.currentDots !== false && iSer > 0) {
    const path = [
      { x: batMidS + batW / 2 + 5, y: sBottom },
      { x: sRight, y: sBottom },
      { x: sRight, y: sTop },
      { x: r2Start + resLen, y: sTop },
      { x: r2Start, y: sTop },
      { x: r1Start + resLen, y: sTop },
      { x: r1Start, y: sTop },
      { x: sLeft, y: sTop },
      { x: sLeft, y: sBottom },
      { x: batMidS - batW / 2 - 5, y: sBottom },
    ]
    drawCurrentDots(ctx, path, currentTime, Math.min(iSer * 10, 2), isDark)
  }

  ctx.restore()

  // Divider
  ctx.strokeStyle = isDark ? '#334155' : '#CBD5E1'
  ctx.lineWidth = 1
  ctx.setLineDash([4, 4])
  ctx.beginPath()
  ctx.moveTo(20, halfH)
  ctx.lineTo(cw - 20, halfH)
  ctx.stroke()
  ctx.setLineDash([])

  // ===== PARALLEL (bottom half) =====
  ctx.save()
  ctx.beginPath()
  ctx.rect(0, halfH, cw, halfH + 20)
  ctx.clip()

  const pLabel = lang === 'hi' ? 'समानांतर (PARALLEL)' : 'PARALLEL'
  ctx.fillStyle = isDark ? '#86EFAC' : '#16A34A'
  ctx.font = 'bold 12px system-ui'
  ctx.textAlign = 'left'
  ctx.fillText(pLabel, 12, halfH + 20)

  const pTop = halfH + 32
  const pBottom = ch - 20
  const pMid = (pTop + pBottom) / 2
  const pLeft = sMx
  const pRight = cw - sMx

  // Junction points
  const jLeft = pLeft + sW * 0.2
  const jRight = pRight - sW * 0.2
  const branchGap = Math.min((pBottom - pTop) * 0.3, 25)

  // Left and right wires
  ctx.strokeStyle = wireCol
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(pLeft, pMid)
  ctx.lineTo(jLeft, pMid)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(jRight, pMid)
  ctx.lineTo(pRight, pMid)
  ctx.stroke()

  // Branch wires - top branch (R1)
  ctx.beginPath()
  ctx.moveTo(jLeft, pMid)
  ctx.lineTo(jLeft, pMid - branchGap)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(jRight, pMid)
  ctx.lineTo(jRight, pMid - branchGap)
  ctx.stroke()

  // Branch wires - bottom branch (R2)
  ctx.beginPath()
  ctx.moveTo(jLeft, pMid)
  ctx.lineTo(jLeft, pMid + branchGap)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(jRight, pMid)
  ctx.lineTo(jRight, pMid + branchGap)
  ctx.stroke()

  // Resistors in branches
  const branchResW = (jRight - jLeft) * 0.5
  const branchResMid = (jLeft + jRight) / 2

  // Top branch resistor
  ctx.beginPath()
  ctx.moveTo(jLeft, pMid - branchGap)
  ctx.lineTo(branchResMid - branchResW / 2, pMid - branchGap)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(branchResMid + branchResW / 2, pMid - branchGap)
  ctx.lineTo(jRight, pMid - branchGap)
  ctx.stroke()
  drawResistorSymbol(ctx, branchResMid - branchResW / 2, pMid - branchGap, branchResW, isDark)

  // Bottom branch resistor
  ctx.beginPath()
  ctx.moveTo(jLeft, pMid + branchGap)
  ctx.lineTo(branchResMid - branchResW / 2, pMid + branchGap)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(branchResMid + branchResW / 2, pMid + branchGap)
  ctx.lineTo(jRight, pMid + branchGap)
  ctx.stroke()
  drawResistorSymbol(ctx, branchResMid - branchResW / 2, pMid + branchGap, branchResW, isDark)

  // Battery on left side
  const batYP = pMid
  ctx.beginPath()
  ctx.moveTo(pLeft, pMid - 15)
  ctx.lineTo(pLeft, pMid + 15)
  ctx.stroke()
  drawBatterySymbolVert(ctx, pLeft, batYP, voltage, isDark)

  // Labels
  ctx.fillStyle = isDark ? C.textDark : C.text
  ctx.font = '10px system-ui'
  ctx.textAlign = 'center'
  ctx.fillText(`R₁=${r1.toFixed(0)}Ω`, branchResMid, pMid - branchGap - 12)
  ctx.fillText(`R₂=${r2.toFixed(0)}Ω`, branchResMid, pMid + branchGap - 12)

  ctx.font = 'bold 11px system-ui'
  ctx.fillStyle = isDark ? '#86EFAC' : '#16A34A'
  ctx.textAlign = 'right'
  ctx.fillText(`R = ${rPar.toFixed(1)} Ω   I = ${iPar.toFixed(4)} A`, pRight, pBottom - 2)

  if (opts.activeLayers.currentDots !== false && iPar > 0) {
    const path1 = [
      { x: jLeft, y: pMid },
      { x: jLeft, y: pMid - branchGap },
      { x: branchResMid - branchResW / 2, y: pMid - branchGap },
      { x: branchResMid + branchResW / 2, y: pMid - branchGap },
      { x: jRight, y: pMid - branchGap },
      { x: jRight, y: pMid },
    ]
    const path2 = [
      { x: jLeft, y: pMid },
      { x: jLeft, y: pMid + branchGap },
      { x: branchResMid - branchResW / 2, y: pMid + branchGap },
      { x: branchResMid + branchResW / 2, y: pMid + branchGap },
      { x: jRight, y: pMid + branchGap },
      { x: jRight, y: pMid },
    ]
    const i1 = ohmsCurrent(voltage, r1)
    const i2 = ohmsCurrent(voltage, r2)
    drawCurrentDots(ctx, path1, currentTime, Math.min(i1 * 10, 2), isDark)
    drawCurrentDots(ctx, path2, currentTime, Math.min(i2 * 10, 2), isDark)
  }

  ctx.restore()

  drawElecLegend(ctx, cw, 3, opts.activeLayers, isDark, lang)
}

// ===== DRAWING HELPERS =====

function drawCharge(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  q: number, radius: number,
  isDark: boolean,
) {
  if (q === 0) {
    ctx.beginPath()
    ctx.arc(x, y, radius * 0.6, 0, Math.PI * 2)
    ctx.fillStyle = isDark ? '#475569' : '#CBD5E1'
    ctx.fill()
    ctx.strokeStyle = isDark ? '#64748B' : '#94A3B8'
    ctx.lineWidth = 1.5
    ctx.stroke()
    return
  }

  const color = q > 0 ? C.positive : C.negative
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  const grad = ctx.createRadialGradient(x - 3, y - 3, 1, x, y, radius)
  grad.addColorStop(0, '#FFFFFF')
  grad.addColorStop(0.3, color)
  grad.addColorStop(1, darken(color, 0.3))
  ctx.fillStyle = grad
  ctx.fill()
  ctx.strokeStyle = darken(color, 0.4)
  ctx.lineWidth = 2
  ctx.stroke()

  // + or - sign
  ctx.strokeStyle = '#FFFFFF'
  ctx.lineWidth = 2.5
  ctx.lineCap = 'round'
  const s = radius * 0.45
  ctx.beginPath()
  ctx.moveTo(x - s, y)
  ctx.lineTo(x + s, y)
  ctx.stroke()
  if (q > 0) {
    ctx.beginPath()
    ctx.moveTo(x, y - s)
    ctx.lineTo(x, y + s)
    ctx.stroke()
  }
  ctx.lineCap = 'butt'
}

function drawResistorSymbol(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  width: number,
  isDark: boolean,
) {
  const zigzags = 6
  const amp = 8
  const segW = width / (zigzags * 2)

  ctx.beginPath()
  ctx.moveTo(x, y)
  for (let i = 0; i < zigzags * 2; i++) {
    const nx = x + (i + 1) * segW
    const ny = y + (i % 2 === 0 ? -amp : amp)
    ctx.lineTo(nx, ny)
  }
  ctx.lineTo(x + width, y)
  ctx.strokeStyle = isDark ? C.resistorDark : C.resistor
  ctx.lineWidth = 2.5
  ctx.stroke()
}

function drawBatterySymbol(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  voltage: number,
  isDark: boolean,
) {
  const color = isDark ? C.batteryDark : C.battery
  // Long line (positive)
  ctx.beginPath()
  ctx.moveTo(cx + 8, cy - 14)
  ctx.lineTo(cx + 8, cy + 14)
  ctx.strokeStyle = color
  ctx.lineWidth = 3
  ctx.stroke()
  // Short line (negative)
  ctx.beginPath()
  ctx.moveTo(cx - 8, cy - 8)
  ctx.lineTo(cx - 8, cy + 8)
  ctx.strokeStyle = color
  ctx.lineWidth = 3
  ctx.stroke()
  // + and - labels
  ctx.fillStyle = isDark ? C.textDark : C.text
  ctx.font = 'bold 10px system-ui'
  ctx.textAlign = 'center'
  ctx.fillText('+', cx + 8, cy - 18)
  ctx.fillText('–', cx - 8, cy - 12)
}

function drawBatterySymbolVert(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  voltage: number,
  isDark: boolean,
) {
  const color = isDark ? C.batteryDark : C.battery
  ctx.beginPath()
  ctx.moveTo(cx - 14, cy - 8)
  ctx.lineTo(cx + 14, cy - 8)
  ctx.strokeStyle = color
  ctx.lineWidth = 3
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(cx - 8, cy + 8)
  ctx.lineTo(cx + 8, cy + 8)
  ctx.strokeStyle = color
  ctx.lineWidth = 3
  ctx.stroke()
  ctx.fillStyle = isDark ? C.textDark : C.text
  ctx.font = 'bold 9px system-ui'
  ctx.textAlign = 'center'
  ctx.fillText('+', cx, cy - 14)
  ctx.fillText(`${voltage.toFixed(0)}V`, cx - 22, cy + 3)
}

function drawCurrentDots(
  ctx: CanvasRenderingContext2D,
  path: Array<{ x: number; y: number }>,
  time: number,
  speed: number,
  isDark: boolean,
) {
  let totalLen = 0
  const segs: number[] = []
  for (let i = 1; i < path.length; i++) {
    const dx = path[i].x - path[i - 1].x
    const dy = path[i].y - path[i - 1].y
    const len = Math.sqrt(dx * dx + dy * dy)
    segs.push(len)
    totalLen += len
  }
  if (totalLen < 1) return

  const numDots = Math.max(4, Math.floor(totalLen / 40))
  const phase = (time * speed * 50) % totalLen

  for (let i = 0; i < numDots; i++) {
    let pos = (phase + (i / numDots) * totalLen) % totalLen
    let acc = 0
    for (let s = 0; s < segs.length; s++) {
      if (acc + segs[s] >= pos) {
        const frac = (pos - acc) / segs[s]
        const dx = path[s + 1].x - path[s].x
        const dy = path[s + 1].y - path[s].y
        const dotX = path[s].x + dx * frac
        const dotY = path[s].y + dy * frac

        ctx.beginPath()
        ctx.arc(dotX, dotY, 3.5, 0, Math.PI * 2)
        ctx.fillStyle = isDark ? '#FBBF24' : C.currentDot
        ctx.fill()
        break
      }
      acc += segs[s]
    }
  }
}

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
  const headLen = Math.min(10, len * 0.3)
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
  size: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + size * Math.cos(angle), y + size * Math.sin(angle))
  ctx.lineTo(x - size * Math.cos(angle - 0.5), y - size * Math.sin(angle - 0.5))
  ctx.lineTo(x - size * Math.cos(angle + 0.5), y - size * Math.sin(angle + 0.5))
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
}

function drawLabGrid(ctx: CanvasRenderingContext2D, cw: number, ch: number, isDark: boolean) {
  const spacing = 40
  ctx.strokeStyle = isDark ? C.gridDark : C.gridLight
  ctx.lineWidth = 0.5
  for (let x = spacing; x < cw; x += spacing) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, ch)
    ctx.stroke()
  }
  for (let y = spacing; y < ch; y += spacing) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(cw, y)
    ctx.stroke()
  }
}

function drawElecLabels(
  ctx: CanvasRenderingContext2D,
  cw: number, ch: number,
  params: Record<string, number>,
  isDark: boolean,
) {
  const q1 = params.q1 ?? 2
  const q2 = params.q2 ?? -2
  const d = params.distance ?? 0.5
  const force = coulombForce(q1, q2, d)

  ctx.fillStyle = isDark ? C.textDark : C.text
  ctx.font = 'bold 11px system-ui'
  ctx.textAlign = 'left'
  const x = 12
  let y = ch - 64
  const lh = 16
  ctx.fillText(`q₁ = ${q1 >= 0 ? '+' : ''}${q1.toFixed(1)} µC`, x, y); y += lh
  ctx.fillText(`q₂ = ${q2 >= 0 ? '+' : ''}${q2.toFixed(1)} µC`, x, y); y += lh
  ctx.fillText(`r = ${d.toFixed(2)} m`, x, y); y += lh
  ctx.fillText(`F = ${force.toFixed(4)} N`, x, y)
}

function drawElecLegend(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  elecType: number,
  activeLayers: Record<string, boolean>,
  isDark: boolean,
  lang: Lang,
) {
  type Entry = { color: string; label: string; type: 'circle' | 'line' | 'dash' | 'rect' }
  const entries: Entry[] = []

  if (elecType <= 1) {
    entries.push({ color: C.positive, label: lang === 'hi' ? 'धन आवेश (+)' : 'Positive (+)', type: 'circle' })
    entries.push({ color: C.negative, label: lang === 'hi' ? 'ऋण आवेश (–)' : 'Negative (–)', type: 'circle' })
    if (elecType === 0 && activeLayers.forceVectors !== false) {
      entries.push({ color: C.forceAttr, label: lang === 'hi' ? 'बल' : 'Force', type: 'line' })
    }
    if (elecType === 1 && activeLayers.fieldLines !== false) {
      entries.push({ color: isDark ? C.fieldLineDark : C.fieldLine, label: lang === 'hi' ? 'क्षेत्र रेखाएँ' : 'Field Lines', type: 'line' })
    }
  } else {
    entries.push({ color: isDark ? C.batteryDark : C.battery, label: lang === 'hi' ? 'बैटरी' : 'Battery', type: 'rect' })
    entries.push({ color: isDark ? C.resistorDark : C.resistor, label: lang === 'hi' ? 'प्रतिरोध' : 'Resistor', type: 'line' })
    if (activeLayers.currentDots !== false) {
      entries.push({ color: C.currentDot, label: lang === 'hi' ? 'धारा प्रवाह' : 'Current Flow', type: 'circle' })
    }
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
  ctx.textBaseline = 'alphabetic'
}

function darken(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgb(${Math.round(r * (1 - amount))},${Math.round(g * (1 - amount))},${Math.round(b * (1 - amount))})`
}
