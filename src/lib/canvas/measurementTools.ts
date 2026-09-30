import type { RulerState, ProtractorState } from '@/store/toolStore'

const TOOL_COLOR = '#D97706'
const TOOL_DARK = '#92400E'
const HANDLE_RADIUS = 8

export function drawRuler(
  ctx: CanvasRenderingContext2D,
  ruler: RulerState,
  toSX: (x: number) => number,
  toSY: (y: number) => number,
  scale: number,
  isDark: boolean
) {
  const sx1 = toSX(ruler.x1)
  const sy1 = toSY(ruler.y1)
  const sx2 = toSX(ruler.x2)
  const sy2 = toSY(ruler.y2)

  const dx = sx2 - sx1
  const dy = sy2 - sy1
  const screenLen = Math.sqrt(dx * dx + dy * dy)
  if (screenLen < 2) return

  const angle = Math.atan2(dy, dx)
  const perpX = -Math.sin(angle)
  const perpY = Math.cos(angle)
  const halfW = 15

  // Body: rounded rectangle along the ruler line
  ctx.save()
  ctx.globalAlpha = 0.5
  ctx.fillStyle = TOOL_COLOR
  ctx.beginPath()
  ctx.moveTo(sx1 + perpX * halfW, sy1 + perpY * halfW)
  ctx.lineTo(sx2 + perpX * halfW, sy2 + perpY * halfW)
  ctx.lineTo(sx2 - perpX * halfW, sy2 - perpY * halfW)
  ctx.lineTo(sx1 - perpX * halfW, sy1 - perpY * halfW)
  ctx.closePath()
  ctx.fill()
  ctx.globalAlpha = 1

  // Border
  ctx.strokeStyle = TOOL_COLOR
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Distance in meters
  const physDx = ruler.x2 - ruler.x1
  const physDy = ruler.y2 - ruler.y1
  const distance = Math.sqrt(physDx * physDx + physDy * physDy)

  const numTicks = Math.floor(distance)

  ctx.strokeStyle = TOOL_DARK
  ctx.fillStyle = TOOL_DARK
  ctx.font = 'bold 10px Inter, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  for (let m = 0; m <= numTicks; m++) {
    const frac = m / distance
    const tx = sx1 + dx * frac
    const ty = sy1 + dy * frac

    const is5m = m % 5 === 0
    const tickLen = is5m ? 14 : 8
    ctx.lineWidth = is5m ? 1.5 : 0.8
    ctx.beginPath()
    ctx.moveTo(tx - perpX * tickLen, ty - perpY * tickLen)
    ctx.lineTo(tx + perpX * 2, ty + perpY * 2)
    ctx.stroke()

    if (is5m && m > 0) {
      const labelX = tx + perpX * (tickLen + 6)
      const labelY = ty + perpY * (tickLen + 6)
      ctx.save()
      ctx.translate(labelX, labelY)
      ctx.rotate(angle)
      ctx.fillText(`${m}`, 0, 0)
      ctx.restore()
    }
  }

  // Distance readout badge centered on ruler
  const midX = (sx1 + sx2) / 2
  const midY = (sy1 + sy2) / 2
  const label = `${distance.toFixed(2)} m`
  ctx.font = 'bold 12px Inter, system-ui, sans-serif'
  const textW = ctx.measureText(label).width

  ctx.save()
  ctx.translate(midX, midY)
  let displayAngle = angle
  if (displayAngle > Math.PI / 2) displayAngle -= Math.PI
  if (displayAngle < -Math.PI / 2) displayAngle += Math.PI
  ctx.rotate(displayAngle)

  ctx.fillStyle = isDark ? 'rgba(15,23,42,0.9)' : 'rgba(55,65,81,0.9)'
  ctx.beginPath()
  ctx.roundRect(-textW / 2 - 6, -10, textW + 12, 20, 4)
  ctx.fill()
  ctx.fillStyle = '#FFFFFF'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, 0, 0)
  ctx.restore()

  // Drag handles at each end
  drawHandle(ctx, sx1, sy1, isDark)
  drawHandle(ctx, sx2, sy2, isDark)
  ctx.restore()
}

export function drawProtractor(
  ctx: CanvasRenderingContext2D,
  protractor: ProtractorState,
  toSX: (x: number) => number,
  toSY: (y: number) => number,
  isDark: boolean
) {
  const cx = toSX(protractor.cx)
  const cy = toSY(protractor.cy)
  const radius = 80

  ctx.save()

  // Semicircle fill
  ctx.globalAlpha = 0.4
  ctx.fillStyle = TOOL_COLOR
  ctx.beginPath()
  ctx.arc(cx, cy, radius, -Math.PI, 0)
  ctx.closePath()
  ctx.fill()
  ctx.globalAlpha = 1

  // Semicircle border
  ctx.strokeStyle = TOOL_COLOR
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(cx, cy, radius, -Math.PI, 0)
  ctx.closePath()
  ctx.stroke()

  // Baseline
  ctx.beginPath()
  ctx.moveTo(cx - radius, cy)
  ctx.lineTo(cx + radius, cy)
  ctx.stroke()

  // Degree markings
  ctx.strokeStyle = TOOL_DARK
  ctx.fillStyle = TOOL_DARK
  ctx.font = 'bold 9px Inter, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  for (let deg = 0; deg <= 180; deg += 10) {
    const rad = -deg * Math.PI / 180
    const isLabeled = deg % 30 === 0
    const innerR = isLabeled ? radius - 14 : radius - 8
    const outerR = radius

    const ix = cx + innerR * Math.cos(rad)
    const iy = cy + innerR * Math.sin(rad)
    const ox = cx + outerR * Math.cos(rad)
    const oy = cy + outerR * Math.sin(rad)

    ctx.lineWidth = isLabeled ? 1.5 : 0.8
    ctx.beginPath()
    ctx.moveTo(ix, iy)
    ctx.lineTo(ox, oy)
    ctx.stroke()

    if (isLabeled) {
      const labelR = radius - 20
      const lx = cx + labelR * Math.cos(rad)
      const ly = cy + labelR * Math.sin(rad)
      ctx.fillText(`${deg}°`, lx, ly)
    }
  }

  // Reference arm (0 degrees, along positive x)
  ctx.strokeStyle = 'rgba(146, 64, 14, 0.5)'
  ctx.lineWidth = 1
  ctx.setLineDash([4, 4])
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.lineTo(cx + radius, cy)
  ctx.stroke()
  ctx.setLineDash([])

  // Measured arm
  const armRad = -protractor.armAngle * Math.PI / 180
  const armEndX = cx + radius * Math.cos(armRad)
  const armEndY = cy + radius * Math.sin(armRad)

  ctx.strokeStyle = TOOL_COLOR
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.lineTo(armEndX, armEndY)
  ctx.stroke()

  // Angle arc
  ctx.strokeStyle = TOOL_COLOR
  ctx.lineWidth = 2
  ctx.beginPath()
  const arcR = 25
  ctx.arc(cx, cy, arcR, armRad, 0)
  ctx.stroke()

  // Angle readout
  const readoutAngle = armRad / 2
  const readoutR = arcR + 14
  const rx = cx + readoutR * Math.cos(readoutAngle)
  const ry = cy + readoutR * Math.sin(readoutAngle)
  const angleLabel = `${protractor.armAngle.toFixed(0)}°`
  ctx.font = 'bold 12px Inter, system-ui, sans-serif'
  const tw = ctx.measureText(angleLabel).width

  ctx.fillStyle = isDark ? 'rgba(15,23,42,0.9)' : 'rgba(55,65,81,0.9)'
  ctx.beginPath()
  ctx.roundRect(rx - tw / 2 - 4, ry - 9, tw + 8, 18, 4)
  ctx.fill()
  ctx.fillStyle = '#FFFFFF'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(angleLabel, rx, ry)

  // Center pivot handle
  ctx.fillStyle = TOOL_COLOR
  ctx.beginPath()
  ctx.arc(cx, cy, 6, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = isDark ? '#0F172A' : '#FFFFFF'
  ctx.beginPath()
  ctx.arc(cx, cy, 3, 0, Math.PI * 2)
  ctx.fill()

  // Arm end handle
  drawHandle(ctx, armEndX, armEndY, isDark)

  ctx.restore()
}

function drawHandle(ctx: CanvasRenderingContext2D, x: number, y: number, isDark: boolean) {
  ctx.fillStyle = TOOL_COLOR
  ctx.beginPath()
  ctx.arc(x, y, HANDLE_RADIUS, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = isDark ? '#0F172A' : '#FFFFFF'
  ctx.beginPath()
  ctx.arc(x, y, 4, 0, Math.PI * 2)
  ctx.fill()
}

// Hit testing helpers
export function hitTestRulerHandle(
  mx: number, my: number,
  ruler: RulerState,
  toSX: (x: number) => number,
  toSY: (y: number) => number
): 'start' | 'end' | 'body' | null {
  const sx1 = toSX(ruler.x1)
  const sy1 = toSY(ruler.y1)
  const sx2 = toSX(ruler.x2)
  const sy2 = toSY(ruler.y2)

  if (dist(mx, my, sx1, sy1) <= HANDLE_RADIUS + 4) return 'start'
  if (dist(mx, my, sx2, sy2) <= HANDLE_RADIUS + 4) return 'end'

  // Body hit test: point-to-segment distance
  const d = pointToSegmentDist(mx, my, sx1, sy1, sx2, sy2)
  if (d <= 18) return 'body'

  return null
}

export function hitTestProtractorHandle(
  mx: number, my: number,
  protractor: ProtractorState,
  toSX: (x: number) => number,
  toSY: (y: number) => number
): 'center' | 'arm' | null {
  const cx = toSX(protractor.cx)
  const cy = toSY(protractor.cy)
  const radius = 80
  const armRad = -protractor.armAngle * Math.PI / 180
  const armEndX = cx + radius * Math.cos(armRad)
  const armEndY = cy + radius * Math.sin(armRad)

  if (dist(mx, my, armEndX, armEndY) <= HANDLE_RADIUS + 4) return 'arm'
  if (dist(mx, my, cx, cy) <= HANDLE_RADIUS + 4) return 'center'

  return null
}

function dist(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
}

function pointToSegmentDist(
  px: number, py: number,
  x1: number, y1: number,
  x2: number, y2: number
): number {
  const dx = x2 - x1
  const dy = y2 - y1
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) return dist(px, py, x1, y1)
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq
  t = Math.max(0, Math.min(1, t))
  return dist(px, py, x1 + t * dx, y1 + t * dy)
}
