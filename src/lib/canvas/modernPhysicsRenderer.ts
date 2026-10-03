import type { CanvasBounds, GhostTrail, CanvasBackground } from '@/lib/physics/types'
import { type Lang } from '@/lib/i18n'
import {
  photonEnergy_eV,
  maxKE_eV,
  bohrEnergy,

  transitionEnergy,
  transitionWavelength,
  decayConstant,
  nucleiRemaining,

} from '@/lib/physics/modernPhysics'
import type { RulerState, ProtractorState } from '@/store/toolStore'
import { drawRuler, drawProtractor } from './measurementTools'

interface ModernPhysicsRenderOptions {
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
  photon: '#F59E0B',
  electron: '#3B82F6',
  metal: '#6B7280',
  metalDark: '#94A3B8',
  nucleus: '#EF4444',
  orbit: '#3B82F6',
  orbitDark: '#60A5FA',
  electronDot: '#10B981',
  electronDotDark: '#34D399',
  energyLevel: '#8B5CF6',
  energyLevelDark: '#A78BFA',
  transitionArrow: '#F59E0B',
  decayCurve: '#3B82F6',
  decayCurveDark: '#60A5FA',
  decayedNuclei: '#9CA3AF',
  grid: '#E5E7EB',
  gridDark: '#1E293B',
  text: '#1F2937',
  textDark: '#E2E8F0',
  bg: '#FAFAFA',
  bgDark: '#0F172A',
  lyman: '#7C3AED',
  balmer: '#EF4444',
  paschen: '#F97316',
}

function wavelengthToColor(wl_nm: number): string {
  if (wl_nm < 380) return '#7C3AED' // UV - purple
  if (wl_nm < 440) return `hsl(${270 - (wl_nm - 380) / 60 * 30}, 90%, 55%)` // violet-blue
  if (wl_nm < 490) return `hsl(${240 - (wl_nm - 440) / 50 * 60}, 90%, 50%)` // blue-cyan
  if (wl_nm < 510) return `hsl(${180 - (wl_nm - 490) / 20 * 60}, 85%, 45%)` // cyan-green
  if (wl_nm < 580) return `hsl(${120 - (wl_nm - 510) / 70 * 60}, 85%, 45%)` // green-yellow
  if (wl_nm < 645) return `hsl(${60 - (wl_nm - 580) / 65 * 30}, 90%, 50%)` // yellow-orange
  if (wl_nm < 780) return `hsl(${30 - (wl_nm - 645) / 135 * 30}, 95%, 45%)` // orange-red
  return '#DC2626' // IR - dark red
}

function drawModernLegend(
  ctx: CanvasRenderingContext2D,
  cw: number,
  modernType: number,
  isDark: boolean,
  lang?: Lang,
) {
  const x = modernType === 1 ? cw * 0.62 : cw - 10
  const startY = 16
  ctx.textAlign = 'right'
  ctx.font = '10px Inter, system-ui, sans-serif'
  const textColor = isDark ? C.textDark : C.text

  type LegendItem = { color: string; label: string; shape: 'line' | 'circle' | 'rect' | 'wave' | 'dash' }
  const items: LegendItem[] = []

  if (modernType === 0 || modernType === 3) {
    items.push({ color: C.photon, label: lang === 'hi' ? 'फोटॉन' : 'Photon', shape: 'wave' })
    items.push({ color: C.electron, label: lang === 'hi' ? 'इलेक्ट्रॉन' : 'Electron', shape: 'circle' })
    items.push({ color: isDark ? C.metalDark : C.metal, label: lang === 'hi' ? 'धातु' : 'Metal', shape: 'rect' })
    items.push({ color: '#EF4444', label: lang === 'hi' ? 'कार्य फलन (φ)' : 'Work Function (φ)', shape: 'dash' })
  } else if (modernType === 1) {
    items.push({ color: isDark ? '#F87171' : C.nucleus, label: lang === 'hi' ? 'नाभिक' : 'Nucleus', shape: 'circle' })
    items.push({ color: isDark ? C.electronDotDark : C.electronDot, label: lang === 'hi' ? 'इलेक्ट्रॉन' : 'Electron', shape: 'circle' })
    items.push({ color: isDark ? C.orbitDark : C.orbit, label: lang === 'hi' ? 'कक्षाएँ' : 'Orbits', shape: 'line' })
    items.push({ color: C.transitionArrow, label: lang === 'hi' ? 'संक्रमण' : 'Transition', shape: 'line' })
    items.push({ color: isDark ? C.energyLevelDark : C.energyLevel, label: lang === 'hi' ? 'ऊर्जा स्तर' : 'Energy Levels', shape: 'dash' })
    items.push({ color: '#EF4444', label: lang === 'hi' ? 'उत्सर्जित फोटॉन' : 'Emitted Photon', shape: 'wave' })
  } else if (modernType === 2) {
    items.push({ color: isDark ? C.decayCurveDark : C.decayCurve, label: lang === 'hi' ? 'क्षय वक्र' : 'Decay Curve', shape: 'line' })
    items.push({ color: isDark ? '#60A5FA' : '#3B82F6', label: lang === 'hi' ? 'वर्तमान N' : 'Current N', shape: 'circle' })
    items.push({ color: isDark ? '#F87171' : C.nucleus, label: lang === 'hi' ? 'शेष नाभिक' : 'Remaining', shape: 'circle' })
    items.push({ color: C.decayedNuclei, label: lang === 'hi' ? 'क्षयित' : 'Decayed', shape: 'circle' })
    items.push({ color: '#F59E0B', label: lang === 'hi' ? 'अर्ध-आयु' : 'Half-life', shape: 'dash' })
  }

  for (let i = 0; i < items.length; i++) {
    const y = startY + i * 16
    const tw = ctx.measureText(items[i].label).width
    const ix = x - tw - 16

    ctx.fillStyle = items[i].color
    ctx.strokeStyle = items[i].color
    ctx.lineWidth = 2

    if (items[i].shape === 'line') {
      ctx.beginPath()
      ctx.moveTo(ix, y - 2)
      ctx.lineTo(ix + 12, y - 2)
      ctx.stroke()
    } else if (items[i].shape === 'circle') {
      ctx.beginPath()
      ctx.arc(ix + 6, y - 2, 4, 0, Math.PI * 2)
      ctx.fill()
    } else if (items[i].shape === 'rect') {
      ctx.fillRect(ix, y - 6, 12, 8)
    } else if (items[i].shape === 'wave') {
      ctx.beginPath()
      for (let wx = 0; wx <= 12; wx++) {
        const wy = Math.sin(wx * Math.PI / 3) * 3
        if (wx === 0) ctx.moveTo(ix + wx, y - 2 + wy)
        else ctx.lineTo(ix + wx, y - 2 + wy)
      }
      ctx.stroke()
    } else if (items[i].shape === 'dash') {
      ctx.setLineDash([3, 2])
      ctx.beginPath()
      ctx.moveTo(ix, y - 2)
      ctx.lineTo(ix + 12, y - 2)
      ctx.stroke()
      ctx.setLineDash([])
    }

    ctx.fillStyle = textColor
    ctx.fillText(items[i].label, x, y)
  }
}

export function renderModernPhysicsFrame(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  options: ModernPhysicsRenderOptions,
): void {
  const { params, currentTime, activeLayers, isDark, lang } = options
  const w = canvas.width
  const h = canvas.height
  const modernType = params.modernType ?? 0

  ctx.clearRect(0, 0, w, h)

  // Background
  if (isDark) {
    ctx.fillStyle = C.bgDark
  } else {
    const grad = ctx.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, '#E0F2FE')
    grad.addColorStop(1, C.bg)
    ctx.fillStyle = grad
  }
  ctx.fillRect(0, 0, w, h)

  if (modernType === 0) {
    renderPhotoelectric(ctx, w, h, params, currentTime, activeLayers, isDark, lang)
  } else if (modernType === 1) {
    renderBohrModel(ctx, w, h, params, currentTime, activeLayers, isDark, lang)
  } else if (modernType === 2) {
    renderDecay(ctx, w, h, params, currentTime, activeLayers, isDark, lang)
  } else {
    renderPhotoelectric(ctx, w, h, params, currentTime, activeLayers, isDark, lang)
  }

  drawModernLegend(ctx, w, modernType, isDark, lang)

  // Measurement tools
  if (options.tools?.ruler) {
    const b = options.bounds
    const bw = b.xMax - b.xMin
    const bh = b.yMax - b.yMin
    const sc = Math.min(w / bw, h / bh)
    const oX = w / 2 - (b.xMin + bw / 2) * sc
    const oY = h / 2 + (b.yMin + bh / 2) * sc
    drawRuler(ctx, options.tools.ruler, (x: number) => x * sc + oX, (y: number) => -y * sc + oY, sc, isDark)
  }
  if (options.tools?.protractor) {
    const b = options.bounds
    const bw = b.xMax - b.xMin
    const bh = b.yMax - b.yMin
    const sc = Math.min(w / bw, h / bh)
    const oX = w / 2 - (b.xMin + bw / 2) * sc
    const oY = h / 2 + (b.yMin + bh / 2) * sc
    drawProtractor(ctx, options.tools.protractor, (x: number) => x * sc + oX, (y: number) => -y * sc + oY, isDark)
  }
}

function renderPhotoelectric(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  params: Record<string, number>,
  currentTime: number,
  layers: Record<string, boolean>,
  isDark: boolean,
  lang?: Lang,
) {
  const wavelength = params.wavelength ?? 400
  const phi = params.workFunction ?? 2.14
  const intensity = params.intensity ?? 50
  const ke = maxKE_eV(wavelength, phi)
  const emitting = ke > 0
  const photonColor = wavelengthToColor(wavelength)

  const metalX = w * 0.55
  const metalTop = h * 0.15
  const metalBottom = h * 0.85
  const metalW = w * 0.06

  // Metal plate
  ctx.fillStyle = isDark ? '#475569' : '#94A3B8'
  ctx.fillRect(metalX, metalTop, metalW, metalBottom - metalTop)
  ctx.strokeStyle = isDark ? '#64748B' : '#6B7280'
  ctx.lineWidth = 2
  ctx.strokeRect(metalX, metalTop, metalW, metalBottom - metalTop)

  // Metal label
  const metalNames: Record<number, string> = {
    2.14: 'Cs', 2.30: 'K', 2.75: 'Na', 2.90: 'Ca',
    3.63: 'Zn', 4.28: 'Ag', 4.65: 'Cu', 4.50: 'Fe', 5.65: 'Pt', 4.08: 'Al',
  }
  const metalName = metalNames[phi] ?? ''
  ctx.fillStyle = isDark ? C.textDark : C.text
  ctx.font = 'bold 13px Inter, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(metalName, metalX + metalW / 2, metalBottom + 18)
  ctx.font = '11px Inter, system-ui, sans-serif'
  ctx.fillText(`φ = ${phi} eV`, metalX + metalW / 2, metalBottom + 34)

  // Incoming photons (wavy lines from left)
  const numPhotons = Math.max(2, Math.min(8, Math.round(intensity / 15)))
  const period = 2
  const tNorm = currentTime % period
  const photonPhase = Math.min(tNorm / 1.0, 1.0)

  for (let i = 0; i < numPhotons; i++) {
    const yFrac = (i + 1) / (numPhotons + 1)
    const py = metalTop + (metalBottom - metalTop) * yFrac
    const startX = w * 0.05
    const endX = metalX - 5

    const photonX = startX + (endX - startX) * photonPhase

    if (photonPhase < 1.0) {
      // Draw wavy photon line
      ctx.strokeStyle = photonColor
      ctx.lineWidth = 2.5
      ctx.beginPath()
      const waveLen = 15
      const amp = 6
      for (let px = photonX - 30; px <= photonX; px += 2) {
        if (px < startX) continue
        const wy = py + amp * Math.sin((px - photonX) * Math.PI * 2 / waveLen)
        if (px === Math.max(photonX - 30, startX)) {
          ctx.moveTo(px, wy)
        } else {
          ctx.lineTo(px, wy)
        }
      }
      ctx.stroke()

      // Photon dot
      ctx.beginPath()
      ctx.arc(photonX, py, 5, 0, Math.PI * 2)
      ctx.fillStyle = photonColor
      ctx.fill()
    }
  }

  // Ejected electrons (right side of metal)
  if (emitting && tNorm >= 1.0) {
    const electronPhase = (tNorm - 1.0) / 1.0
    const speed = ke / 3 // visual scale
    for (let i = 0; i < Math.min(numPhotons, 5); i++) {
      const yFrac = (i + 1) / (Math.min(numPhotons, 5) + 1)
      const ey = metalTop + (metalBottom - metalTop) * yFrac
      const ex = metalX + metalW + 10 + electronPhase * w * 0.25 * speed
      const eyOff = ey + (Math.random() - 0.5) * 20 * electronPhase

      // Electron trail
      ctx.strokeStyle = isDark ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.2)'
      ctx.lineWidth = 1
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.moveTo(metalX + metalW, ey)
      ctx.lineTo(ex, eyOff)
      ctx.stroke()
      ctx.setLineDash([])

      // Electron dot
      ctx.beginPath()
      ctx.arc(ex, eyOff, 4, 0, Math.PI * 2)
      ctx.fillStyle = isDark ? '#60A5FA' : '#3B82F6'
      ctx.fill()
      ctx.strokeStyle = isDark ? '#93C5FD' : '#1D4ED8'
      ctx.lineWidth = 1
      ctx.stroke()

      // Minus sign
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 7px Inter, system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('−', ex, eyOff + 2.5)
    }
  }

  // No emission indicator
  if (!emitting && tNorm >= 1.0) {
    ctx.fillStyle = isDark ? '#F87171' : '#DC2626'
    ctx.font = 'bold 14px Inter, system-ui, sans-serif'
    ctx.textAlign = 'center'
    const label = lang === 'hi' ? 'कोई उत्सर्जन नहीं!' : 'No Emission!'
    ctx.fillText(label, metalX + metalW + w * 0.12, h * 0.5)
    ctx.font = '11px Inter, system-ui, sans-serif'
    ctx.fillStyle = isDark ? '#94A3B8' : '#6B7280'
    const sub = lang === 'hi' ? `फोटॉन ऊर्जा < कार्य फलन` : `Photon Energy < Work Function`
    ctx.fillText(sub, metalX + metalW + w * 0.12, h * 0.5 + 18)
  }

  // Energy bar diagram (bottom left)
  if (layers.energyBars !== false) {
    const barX = w * 0.05
    const barY = h * 0.15
    const barW = w * 0.18
    const barH = h * 0.7
    const Eph = photonEnergy_eV(wavelength)
    const maxE = Math.max(Eph, phi) * 1.2

    // Background
    ctx.fillStyle = isDark ? 'rgba(15,23,42,0.8)' : 'rgba(255,255,255,0.85)'
    ctx.strokeStyle = isDark ? '#334155' : '#D1D5DB'
    ctx.lineWidth = 1
    roundRect(ctx, barX - 5, barY - 25, barW + 10, barH + 45, 8)
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle = isDark ? C.textDark : C.text
    ctx.font = 'bold 10px Inter, system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(lang === 'hi' ? 'ऊर्जा' : 'Energy (eV)', barX + barW / 2, barY - 10)

    // Photon energy bar
    const phBarH = (Eph / maxE) * barH
    ctx.fillStyle = photonColor
    ctx.globalAlpha = 0.7
    ctx.fillRect(barX, barY + barH - phBarH, barW * 0.4, phBarH)
    ctx.globalAlpha = 1

    // Work function line
    const phiY = barY + barH - (phi / maxE) * barH
    ctx.strokeStyle = isDark ? '#F87171' : '#DC2626'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 3])
    ctx.beginPath()
    ctx.moveTo(barX, phiY)
    ctx.lineTo(barX + barW, phiY)
    ctx.stroke()
    ctx.setLineDash([])

    // Labels
    ctx.font = '10px Inter, system-ui, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillStyle = photonColor
    ctx.fillText(`E = ${Eph.toFixed(2)}`, barX + barW * 0.45, barY + barH - phBarH + 12)
    ctx.fillStyle = isDark ? '#F87171' : '#DC2626'
    ctx.fillText(`φ = ${phi.toFixed(2)}`, barX + barW * 0.45, phiY - 4)

    if (ke > 0) {
      const keBarH = (ke / maxE) * barH
      ctx.fillStyle = isDark ? '#60A5FA' : '#3B82F6'
      ctx.globalAlpha = 0.5
      ctx.fillRect(barX + barW * 0.5, barY + barH - phBarH, barW * 0.4, keBarH)
      ctx.globalAlpha = 1
      ctx.fillStyle = isDark ? '#60A5FA' : '#3B82F6'
      ctx.font = '10px Inter, system-ui, sans-serif'
      ctx.fillText(`KE = ${ke.toFixed(2)}`, barX + barW * 0.45, barY + barH - phBarH + 26)
    }
  }

  // Wavelength color indicator
  ctx.fillStyle = photonColor
  ctx.fillRect(w * 0.05, h - 30, 60, 12)
  ctx.fillStyle = isDark ? C.textDark : C.text
  ctx.font = '10px Inter, system-ui, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(`λ = ${wavelength} nm`, w * 0.05 + 65, h - 20)
}

function renderBohrModel(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  params: Record<string, number>,
  currentTime: number,
  layers: Record<string, boolean>,
  isDark: boolean,
  lang?: Lang,
) {
  const Z = params.atomicZ ?? 1
  const currentN = params.orbitN ?? 1
  const nFrom = params.transitionFrom ?? 3
  const nTo = params.transitionTo ?? 2
  const maxN = Math.max(currentN, nFrom, 4)

  // Atom view (left 60% of canvas)
  const atomCx = w * 0.32
  const atomCy = h * 0.5
  const maxOrbitR = Math.min(w * 0.28, h * 0.42)
  const rScale = maxOrbitR / (maxN * maxN)

  // Draw orbits
  for (let n = 1; n <= maxN; n++) {
    const r = n * n * rScale
    ctx.beginPath()
    ctx.arc(atomCx, atomCy, r, 0, Math.PI * 2)
    ctx.strokeStyle = isDark ? 'rgba(96,165,250,0.25)' : 'rgba(59,130,246,0.2)'
    ctx.lineWidth = n === currentN ? 2.5 : 1
    if (n === currentN) {
      ctx.strokeStyle = isDark ? C.orbitDark : C.orbit
    }
    ctx.stroke()

    // Orbit label
    ctx.fillStyle = isDark ? '#64748B' : '#9CA3AF'
    ctx.font = '10px Inter, system-ui, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`n=${n}`, atomCx + r + 5, atomCy - 3)
  }

  // Nucleus
  const nucleusR = Math.max(6, 4 + Z * 2)
  const grad = ctx.createRadialGradient(atomCx - 2, atomCy - 2, 0, atomCx, atomCy, nucleusR)
  grad.addColorStop(0, '#FCA5A5')
  grad.addColorStop(1, C.nucleus)
  ctx.beginPath()
  ctx.arc(atomCx, atomCy, nucleusR, 0, Math.PI * 2)
  ctx.fillStyle = grad
  ctx.fill()
  ctx.strokeStyle = '#B91C1C'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Z label on nucleus
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 9px Inter, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(Z === 1 ? 'H' : `Z=${Z}`, atomCx, atomCy + 3)

  // Electron on current orbit
  const orbitR = currentN * currentN * rScale
  const speed = 2.18e6 / currentN // relative speed
  const angularV = speed / (currentN * 1e6) * 3 // visual speed scaling
  const angle = (currentTime * angularV) % (Math.PI * 2)
  const eX = atomCx + orbitR * Math.cos(angle)
  const eY = atomCy + orbitR * Math.sin(angle)

  // Electron glow
  ctx.beginPath()
  ctx.arc(eX, eY, 10, 0, Math.PI * 2)
  ctx.fillStyle = isDark ? 'rgba(52,211,153,0.2)' : 'rgba(16,185,129,0.15)'
  ctx.fill()

  // Electron dot
  ctx.beginPath()
  ctx.arc(eX, eY, 5, 0, Math.PI * 2)
  ctx.fillStyle = isDark ? C.electronDotDark : C.electronDot
  ctx.fill()
  ctx.strokeStyle = isDark ? '#6EE7B7' : '#059669'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Minus sign on electron
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 7px Inter, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('e⁻', eX, eY + 2.5)

  // Transition arrow (if showing transition)
  if (layers.transition !== false && nFrom > nTo) {
    const r1 = nFrom * nFrom * rScale
    const r2 = nTo * nTo * rScale
    const tAngle = Math.PI * 0.75 // fixed position for clarity

    const fromX = atomCx + r1 * Math.cos(tAngle)
    const fromY = atomCy + r1 * Math.sin(tAngle)
    const toX = atomCx + r2 * Math.cos(tAngle)
    const toY = atomCy + r2 * Math.sin(tAngle)

    // Arrow
    ctx.strokeStyle = C.transitionArrow
    ctx.lineWidth = 2
    ctx.setLineDash([4, 3])
    ctx.beginPath()
    ctx.moveTo(fromX, fromY)
    ctx.lineTo(toX, toY)
    ctx.stroke()
    ctx.setLineDash([])

    // Arrowhead
    const dx = toX - fromX
    const dy = toY - fromY
    const len = Math.sqrt(dx * dx + dy * dy)
    const ux = dx / len
    const uy = dy / len
    ctx.beginPath()
    ctx.moveTo(toX, toY)
    ctx.lineTo(toX - ux * 8 - uy * 5, toY - uy * 8 + ux * 5)
    ctx.lineTo(toX - ux * 8 + uy * 5, toY - uy * 8 - ux * 5)
    ctx.closePath()
    ctx.fillStyle = C.transitionArrow
    ctx.fill()

    // Photon emission wavy line
    const wl = transitionWavelength(nFrom, nTo, Z)
    const photonClr = wl < 780 && wl > 100 ? wavelengthToColor(wl) : C.transitionArrow
    const midX = (fromX + toX) / 2 - 30
    const midY = (fromY + toY) / 2

    ctx.strokeStyle = photonClr
    ctx.lineWidth = 2
    ctx.beginPath()
    for (let px = 0; px <= 40; px += 2) {
      const wy = midY + 6 * Math.sin(px * Math.PI * 2 / 12)
      if (px === 0) ctx.moveTo(midX - 20 + px, wy)
      else ctx.lineTo(midX - 20 + px, wy)
    }
    ctx.stroke()

    // Label
    ctx.fillStyle = photonClr
    ctx.font = '10px Inter, system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`λ = ${wl.toFixed(0)} nm`, midX, midY - 15)
  }

  // Energy level diagram (right 35% of canvas)
  if (layers.energyLevels !== false) {
    const elX = w * 0.66
    const elW = w * 0.28
    const elTop = h * 0.1
    const elBottom = h * 0.85
    const elH = elBottom - elTop

    // Background
    ctx.fillStyle = isDark ? 'rgba(15,23,42,0.7)' : 'rgba(255,255,255,0.8)'
    ctx.strokeStyle = isDark ? '#334155' : '#D1D5DB'
    ctx.lineWidth = 1
    roundRect(ctx, elX - 10, elTop - 25, elW + 20, elH + 45, 8)
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle = isDark ? C.textDark : C.text
    ctx.font = 'bold 11px Inter, system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(lang === 'hi' ? 'ऊर्जा स्तर' : 'Energy Levels', elX + elW / 2, elTop - 8)

    // E=0 line at top
    const e0Y = elTop + 10
    ctx.strokeStyle = isDark ? '#475569' : '#9CA3AF'
    ctx.lineWidth = 1
    ctx.setLineDash([3, 3])
    ctx.beginPath()
    ctx.moveTo(elX, e0Y)
    ctx.lineTo(elX + elW, e0Y)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = isDark ? '#64748B' : '#9CA3AF'
    ctx.font = '9px Inter, system-ui, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText('E = 0', elX - 4, e0Y + 3)

    // Draw energy levels
    const E1 = Math.abs(bohrEnergy(1, Z))
    for (let n = 1; n <= Math.max(maxN, 4); n++) {
      const En = bohrEnergy(n, Z)
      const yFrac = Math.abs(En) / E1
      const ly = e0Y + yFrac * (elH - 30)

      const isActive = n === currentN
      ctx.strokeStyle = isActive
        ? (isDark ? C.energyLevelDark : C.energyLevel)
        : (isDark ? 'rgba(148,163,184,0.4)' : 'rgba(107,114,128,0.3)')
      ctx.lineWidth = isActive ? 3 : 1.5
      ctx.beginPath()
      ctx.moveTo(elX + 15, ly)
      ctx.lineTo(elX + elW - 15, ly)
      ctx.stroke()

      // Label
      ctx.fillStyle = isActive
        ? (isDark ? C.energyLevelDark : C.energyLevel)
        : (isDark ? '#94A3B8' : '#6B7280')
      ctx.font = isActive ? 'bold 10px Inter, system-ui, sans-serif' : '10px Inter, system-ui, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(`n=${n}`, elX + elW - 10, ly - 4)
      ctx.textAlign = 'right'
      ctx.fillText(`${En.toFixed(2)} eV`, elX + 12, ly - 4)
    }

    // Transition arrow on energy diagram
    if (layers.transition !== false && nFrom > nTo && nFrom <= Math.max(maxN, 4)) {
      const eFrom = bohrEnergy(nFrom, Z)
      const eTo = bohrEnergy(nTo, Z)
      const yFrom = e0Y + (Math.abs(eFrom) / E1) * (elH - 30)
      const yTo = e0Y + (Math.abs(eTo) / E1) * (elH - 30)
      const arrowX = elX + elW / 2

      ctx.strokeStyle = C.transitionArrow
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(arrowX, yFrom)
      ctx.lineTo(arrowX, yTo)
      ctx.stroke()

      // Arrowhead
      ctx.beginPath()
      ctx.moveTo(arrowX, yTo)
      ctx.lineTo(arrowX - 5, yTo - 8)
      ctx.lineTo(arrowX + 5, yTo - 8)
      ctx.closePath()
      ctx.fillStyle = C.transitionArrow
      ctx.fill()

      const dE = transitionEnergy(nFrom, nTo, Z)
      ctx.fillStyle = C.transitionArrow
      ctx.font = '10px Inter, system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`ΔE = ${dE.toFixed(2)} eV`, arrowX, (yFrom + yTo) / 2 - 6)
    }
  }

  // Bohr model caveat
  ctx.fillStyle = isDark ? '#F59E0B' : '#D97706'
  ctx.font = 'italic 10px Inter, system-ui, sans-serif'
  ctx.textAlign = 'center'
  const caveat = lang === 'hi'
    ? 'बोहर मॉडल सरलीकृत है। वास्तविक इलेक्ट्रॉन कक्षा नहीं, ऑर्बिटल में हैं।'
    : 'Bohr model is simplified. Real electrons occupy orbitals, not orbits.'
  ctx.fillText(caveat, w * 0.5, h - 10)
}

function renderDecay(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  params: Record<string, number>,
  currentTime: number,
  layers: Record<string, boolean>,
  isDark: boolean,
  lang?: Lang,
) {
  const halfLife = params.halfLife ?? 1
  const N0 = params.N0 ?? 1000
  const lambda = decayConstant(halfLife)
  const tMax = halfLife * 5

  // Graph area
  const gLeft = w * 0.12
  const gRight = w * 0.62
  const gTop = h * 0.1
  const gBottom = h * 0.85
  const gW = gRight - gLeft
  const gH = gBottom - gTop

  // Axes
  ctx.strokeStyle = isDark ? '#94A3B8' : '#6B7280'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(gLeft, gTop)
  ctx.lineTo(gLeft, gBottom)
  ctx.lineTo(gRight, gBottom)
  ctx.stroke()

  // Axis labels
  ctx.fillStyle = isDark ? C.textDark : C.text
  ctx.font = 'bold 12px Inter, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(lang === 'hi' ? 'शेष नाभिक N(t)' : 'Nuclei Remaining N(t)', gLeft + gW / 2, gTop - 15)

  ctx.save()
  ctx.translate(gLeft - 35, gTop + gH / 2)
  ctx.rotate(-Math.PI / 2)
  ctx.font = '11px Inter, system-ui, sans-serif'
  ctx.fillText('N', 0, 0)
  ctx.restore()

  ctx.font = '11px Inter, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(lang === 'hi' ? 'समय t' : 'Time t', gLeft + gW / 2, gBottom + 30)

  // Grid lines and labels
  ctx.strokeStyle = isDark ? C.gridDark : C.grid
  ctx.lineWidth = 0.5
  ctx.font = '9px Inter, system-ui, sans-serif'
  ctx.fillStyle = isDark ? '#64748B' : '#9CA3AF'

  // Y-axis ticks
  for (let frac = 0; frac <= 1; frac += 0.25) {
    const y = gBottom - frac * gH
    ctx.beginPath()
    ctx.moveTo(gLeft, y)
    ctx.lineTo(gRight, y)
    ctx.stroke()
    ctx.textAlign = 'right'
    ctx.fillText(`${Math.round(frac * N0)}`, gLeft - 5, y + 3)
  }

  // X-axis ticks (half-lives)
  for (let hl = 0; hl <= 5; hl++) {
    const x = gLeft + (hl / 5) * gW
    ctx.beginPath()
    ctx.moveTo(x, gTop)
    ctx.lineTo(x, gBottom)
    ctx.stroke()
    ctx.textAlign = 'center'
    ctx.fillText(`${hl}T½`, x, gBottom + 14)
  }

  // Decay curve
  ctx.strokeStyle = isDark ? C.decayCurveDark : C.decayCurve
  ctx.lineWidth = 2.5
  ctx.beginPath()
  const steps = 200
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * tMax
    if (t > currentTime) break
    const N = nucleiRemaining(N0, lambda, t)
    const x = gLeft + (t / tMax) * gW
    const y = gBottom - (N / N0) * gH
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()

  // Full curve as ghost
  ctx.strokeStyle = isDark ? 'rgba(96,165,250,0.2)' : 'rgba(59,130,246,0.15)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * tMax
    const N = nucleiRemaining(N0, lambda, t)
    const x = gLeft + (t / tMax) * gW
    const y = gBottom - (N / N0) * gH
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()

  // Current position dot
  const curN = nucleiRemaining(N0, lambda, Math.min(currentTime, tMax))
  const dotX = gLeft + (Math.min(currentTime, tMax) / tMax) * gW
  const dotY = gBottom - (curN / N0) * gH
  ctx.beginPath()
  ctx.arc(dotX, dotY, 6, 0, Math.PI * 2)
  ctx.fillStyle = isDark ? '#60A5FA' : '#3B82F6'
  ctx.fill()
  ctx.strokeStyle = isDark ? '#93C5FD' : '#1D4ED8'
  ctx.lineWidth = 2
  ctx.stroke()

  // Current value label
  ctx.fillStyle = isDark ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.85)'
  roundRect(ctx, dotX + 10, dotY - 22, 85, 18, 4)
  ctx.fill()
  ctx.fillStyle = isDark ? C.textDark : C.text
  ctx.font = '10px Inter, system-ui, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(`N = ${Math.round(curN)}`, dotX + 14, dotY - 8)

  // Half-life markers (horizontal dashed lines)
  if (layers.halfLifeMarkers !== false) {
    ctx.setLineDash([4, 4])
    ctx.lineWidth = 1
    const hlFracs = [0.5, 0.25, 0.125, 0.0625]
    const hlColors = ['#EF4444', '#F97316', '#F59E0B', '#84CC16']
    for (let i = 0; i < hlFracs.length; i++) {
      const y = gBottom - hlFracs[i] * gH
      const x = gLeft + ((i + 1) / 5) * gW
      ctx.strokeStyle = isDark ? hlColors[i] + '60' : hlColors[i] + '40'
      ctx.beginPath()
      ctx.moveTo(gLeft, y)
      ctx.lineTo(x, y)
      ctx.lineTo(x, gBottom)
      ctx.stroke()
    }
    ctx.setLineDash([])
  }

  // Nuclei visualization (right side)
  const vizX = w * 0.67
  const vizY = h * 0.1
  const vizW = w * 0.3
  const vizH = h * 0.8
  const cols = 10
  const rows = 10
  const total = cols * rows
  const remaining = Math.round((curN / N0) * total)

  ctx.fillStyle = isDark ? 'rgba(15,23,42,0.6)' : 'rgba(255,255,255,0.7)'
  roundRect(ctx, vizX - 5, vizY - 20, vizW + 10, vizH + 35, 8)
  ctx.fill()

  ctx.fillStyle = isDark ? C.textDark : C.text
  ctx.font = 'bold 10px Inter, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(lang === 'hi' ? 'नाभिक' : 'Nuclei', vizX + vizW / 2, vizY - 5)

  const cellW = vizW / cols
  const cellH = vizH / rows
  const dotR = Math.min(cellW, cellH) * 0.3

  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < cols; col++) {
      const idx = r * cols + col
      const cx = vizX + col * cellW + cellW / 2
      const cy = vizY + r * cellH + cellH / 2

      ctx.beginPath()
      ctx.arc(cx, cy, dotR, 0, Math.PI * 2)

      if (idx < remaining) {
        ctx.fillStyle = isDark ? '#F87171' : C.nucleus
      } else {
        ctx.fillStyle = isDark ? '#334155' : '#D1D5DB'
      }
      ctx.fill()
    }
  }

  // Legend
  ctx.font = '9px Inter, system-ui, sans-serif'
  ctx.textAlign = 'left'
  ctx.beginPath()
  ctx.arc(vizX + 5, vizY + vizH + 14, 4, 0, Math.PI * 2)
  ctx.fillStyle = isDark ? '#F87171' : C.nucleus
  ctx.fill()
  ctx.fillStyle = isDark ? '#94A3B8' : '#6B7280'
  ctx.fillText(lang === 'hi' ? 'शेष' : 'Remaining', vizX + 14, vizY + vizH + 17)

  ctx.beginPath()
  ctx.arc(vizX + vizW / 2 + 5, vizY + vizH + 14, 4, 0, Math.PI * 2)
  ctx.fillStyle = isDark ? '#334155' : '#D1D5DB'
  ctx.fill()
  ctx.fillStyle = isDark ? '#94A3B8' : '#6B7280'
  ctx.fillText(lang === 'hi' ? 'क्षयित' : 'Decayed', vizX + vizW / 2 + 14, vizY + vizH + 17)
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

export function computeModernPhysicsBounds(
  params: Record<string, number>,
  _compareMode: boolean,
  _paramsB?: Record<string, number>,
  _ghosts?: GhostTrail[],
): CanvasBounds {
  const modernType = params.modernType ?? 0
  if (modernType === 0) {
    return { xMin: 0, xMax: 10, yMin: 0, yMax: 8, scale: 1 }
  }
  if (modernType === 1) {
    const n = Math.max(params.orbitN ?? 1, params.transitionFrom ?? 3)
    const s = n * n + 2
    return { xMin: -s, xMax: s, yMin: -s, yMax: s, scale: 1 }
  }
  if (modernType === 2) {
    const N0 = params.N0 ?? 1000
    const halfLife = params.halfLife ?? 1
    return { xMin: 0, xMax: halfLife * 5, yMin: 0, yMax: N0, scale: 1 }
  }
  return { xMin: 0, xMax: 10, yMin: 0, yMax: 8, scale: 1 }
}
