'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'

const DEG = Math.PI / 180
const V0 = 20
const G = 9.81

const SVG_W = 720
const SVG_H = 400
const GROUND_Y = 330
const PLOT_L = 60
const PLOT_R = 700
const PLOT_T = 30
const PLOT_W = PLOT_R - PLOT_L
const PLOT_H = GROUND_Y - PLOT_T

const WORLD_W = 45
const WORLD_H = 22
const SX = PLOT_W / WORLD_W
const SY = PLOT_H / WORLD_H

function wx(x: number) { return PLOT_L + x * SX }
function wy(y: number) { return GROUND_Y - y * SY }

function calcTrajectory(angleDeg: number) {
  const rad = angleDeg * DEG
  const vx = V0 * Math.cos(rad)
  const vy0 = V0 * Math.sin(rad)
  const tFlight = (2 * vy0) / G
  const rangeM = vx * tFlight
  const maxH = (vy0 * vy0) / (2 * G)

  const steps = 60
  const points: string[] = []
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * tFlight
    const x = vx * t
    const y = vy0 * t - 0.5 * G * t * t
    points.push(`${wx(x).toFixed(1)},${wy(y).toFixed(1)}`)
  }

  return { vx, vy0, tFlight, rangeM, maxH, points: points.join(' '), rad }
}

function calcPositionAtTime(angleDeg: number, t: number) {
  const rad = angleDeg * DEG
  const vx = V0 * Math.cos(rad)
  const vy0 = V0 * Math.sin(rad)
  const x = vx * t
  const y = vy0 * t - 0.5 * G * t * t
  return { x: wx(x), y: wy(Math.max(0, y)) }
}

const ANIM_DURATION = 2000

export function FieldbookStage({ serifClass }: { serifClass: string }) {
  const [angle, setAngle] = useState(45)
  const [animProgress, setAnimProgress] = useState<number | null>(null)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const rafRef = useRef<number>(0)
  const startRef = useRef<number>(0)

  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    const el = document.documentElement
    setIsDark(el.classList.contains('dark'))
    const observer = new MutationObserver(() => setIsDark(el.classList.contains('dark')))
    observer.observe(el, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  const traj = calcTrajectory(angle)

  const stopAnim = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = 0
    setAnimProgress(null)
  }, [])

  const animate = useCallback(() => {
    if (reducedMotion) return
    stopAnim()
    startRef.current = performance.now()

    function tick(now: number) {
      const elapsed = now - startRef.current
      const p = Math.min(elapsed / ANIM_DURATION, 1)
      setAnimProgress(p)
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        rafRef.current = 0
      }
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [reducedMotion, stopAnim])

  useEffect(() => {
    animate()
    return stopAnim
  }, [angle, animate, stopAnim])

  useEffect(() => {
    const onVis = () => {
      if (document.hidden && rafRef.current) stopAnim()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [stopAnim])

  const handleAngle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAngle(Number(e.target.value))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault()
      setAngle(a => Math.max(10, a - 1))
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault()
      setAngle(a => Math.min(80, a + 1))
    }
  }

  const ballT = animProgress !== null ? animProgress * traj.tFlight : null
  const ballPos = ballT !== null
    ? calcPositionAtTime(angle, ballT)
    : reducedMotion
      ? (() => {
          const tPeak = traj.vy0 / G
          return calcPositionAtTime(angle, tPeak)
        })()
      : null

  const apexPos = calcPositionAtTime(angle, traj.vy0 / G)

  const launcherX = wx(0)
  const launcherY = wy(0)
  const armLen = 36
  const armEndX = launcherX + armLen * Math.cos(-traj.rad)
  const armEndY = launcherY + armLen * Math.sin(-traj.rad)

  const angleArcD = (() => {
    const r = 24
    const startX = launcherX + r
    const startY = launcherY
    const endX = launcherX + r * Math.cos(-traj.rad)
    const endY = launcherY + r * Math.sin(-traj.rad)
    return `M ${startX},${startY} A ${r},${r} 0 0,0 ${endX},${endY}`
  })()

  const angleLabelX = launcherX + 38 * Math.cos(-traj.rad / 2)
  const angleLabelY = launcherY + 38 * Math.sin(-traj.rad / 2)

  const ink = isDark ? '#E2E8F0' : '#1B2249'
  const accent = '#E8740C'

  return (
    <section className="relative" id="experiment">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Title area */}
        <div className="pt-20 sm:pt-24 pb-6 sm:pb-8">
          <p className="text-xs font-mono text-fb-dim dark:text-gray-500 tracking-widest uppercase mb-3">
            Experiment 01 &mdash; Projectile Motion
          </p>
          <h1 className="mb-3">
            <span className={`block text-3xl sm:text-4xl lg:text-5xl font-bold text-fb-ink dark:text-gray-100 leading-[1.1] tracking-tight ${serifClass}`}>
              Physics, in your hands.
            </span>
          </h1>
          <p className="text-base sm:text-lg text-fb-muted dark:text-gray-400 leading-relaxed max-w-lg">
            Drag the angle. Watch the ball. Read the numbers. Free interactive simulations for Class 6&ndash;12.
          </p>
        </div>

        {/* The experiment diagram */}
        <div className="relative -mx-2 sm:mx-0">
          <svg
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            className="w-full h-auto"
            role="img"
            aria-label={`Projectile motion experiment: ${angle} degree launch angle, ${traj.rangeM.toFixed(1)}m range, ${traj.maxH.toFixed(1)}m max height`}
          >
            {/* subtle grid lines */}
            {Array.from({ length: 6 }, (_, i) => {
              const y = GROUND_Y - (i * PLOT_H) / 5
              return (
                <line key={`h${i}`} x1={PLOT_L} y1={y} x2={PLOT_R} y2={y}
                  stroke={ink} strokeWidth="0.5" opacity={i === 0 ? 0.2 : 0.06} />
              )
            })}
            {Array.from({ length: 10 }, (_, i) => {
              const x = PLOT_L + (i * PLOT_W) / 9
              return (
                <line key={`v${i}`} x1={x} y1={PLOT_T} x2={x} y2={GROUND_Y}
                  stroke={ink} strokeWidth="0.5" opacity="0.04" />
              )
            })}

            {/* axis labels */}
            <text x={PLOT_L - 6} y={GROUND_Y + 4} fill={ink} fontSize="10" fontFamily="monospace" opacity="0.3" textAnchor="end">0</text>
            <text x={PLOT_R + 4} y={GROUND_Y + 4} fill={ink} fontSize="10" fontFamily="monospace" opacity="0.3">{WORLD_W}m</text>
            <text x={PLOT_L - 6} y={PLOT_T + 4} fill={ink} fontSize="10" fontFamily="monospace" opacity="0.3" textAnchor="end">{WORLD_H}m</text>

            {/* trajectory path */}
            <polyline points={traj.points} fill="none" stroke={ink} strokeWidth="2.5" opacity="0.45" strokeLinecap="round" strokeLinejoin="round" />

            {/* sampled dots */}
            {[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1].map((frac, i) => {
              const t = frac * traj.tFlight
              const pos = calcPositionAtTime(angle, t)
              return <circle key={i} cx={pos.x} cy={pos.y} r="2.5" fill={ink} opacity={0.12} />
            })}

            {/* max height annotation */}
            <line x1={apexPos.x} y1={apexPos.y} x2={apexPos.x} y2={GROUND_Y} stroke={accent} strokeWidth="1" opacity="0.3" strokeDasharray="4 3" />
            <text x={apexPos.x + 8} y={apexPos.y + (GROUND_Y - apexPos.y) / 2} fill={accent} fontSize="12" fontFamily="monospace" opacity="0.7" fontWeight="500">
              {traj.maxH.toFixed(1)} m
            </text>

            {/* range annotation */}
            <line x1={wx(0)} y1={GROUND_Y + 16} x2={wx(traj.rangeM)} y2={GROUND_Y + 16} stroke={ink} strokeWidth="1" opacity="0.25" />
            <line x1={wx(0)} y1={GROUND_Y + 10} x2={wx(0)} y2={GROUND_Y + 22} stroke={ink} strokeWidth="1" opacity="0.25" />
            <line x1={wx(traj.rangeM)} y1={GROUND_Y + 10} x2={wx(traj.rangeM)} y2={GROUND_Y + 22} stroke={ink} strokeWidth="1" opacity="0.25" />
            <text x={(wx(0) + wx(traj.rangeM)) / 2} y={GROUND_Y + 34} fill={ink} fontSize="12" fontFamily="monospace" opacity="0.45" textAnchor="middle" fontWeight="500">
              {traj.rangeM.toFixed(1)} m
            </text>

            {/* launcher */}
            <circle cx={launcherX} cy={launcherY} r="7" fill={accent} opacity="0.9" />
            <circle cx={launcherX} cy={launcherY} r="13" fill={accent} opacity="0.08" />
            <line x1={launcherX} y1={launcherY} x2={armEndX} y2={armEndY} stroke={accent} strokeWidth="3" strokeLinecap="round" opacity="0.7" />

            {/* angle arc + label */}
            <path d={angleArcD} fill="none" stroke={accent} strokeWidth="1.2" opacity="0.5" />
            <text x={angleLabelX} y={angleLabelY} fill={accent} fontSize="13" fontFamily="monospace" opacity="0.8" textAnchor="middle" dominantBaseline="middle" fontWeight="600">
              {angle}&deg;
            </text>

            {/* animated ball */}
            {ballPos && (
              <>
                <circle cx={ballPos.x} cy={ballPos.y} r="7" fill={ink} opacity="0.85" />
                <circle cx={ballPos.x} cy={ballPos.y} r="13" fill={ink} opacity="0.08" />
              </>
            )}
          </svg>
        </div>

        {/* Instrument strip */}
        <div className="mt-3 py-4 border-t border-b border-fb-rule/60 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            {/* angle control */}
            <div className="flex items-center gap-3 min-w-0">
              <label htmlFor="hero-angle" className="text-xs font-medium text-fb-muted dark:text-gray-400 whitespace-nowrap">
                Launch angle
              </label>
              <input
                id="hero-angle"
                type="range"
                min={10}
                max={80}
                step={1}
                value={angle}
                onChange={handleAngle}
                onKeyDown={handleKeyDown}
                className="fieldbook-slider w-28 sm:w-40"
                aria-valuemin={10}
                aria-valuemax={80}
                aria-valuenow={angle}
                aria-valuetext={`${angle} degrees`}
              />
              <span className="text-sm font-mono text-fb-ink dark:text-gray-100 w-8 text-right tabular-nums">{angle}&deg;</span>
            </div>

            {/* readouts */}
            <div className="flex items-center gap-5 text-xs">
              <div>
                <span className="text-fb-dim dark:text-gray-500 font-medium">Range </span>
                <span className="font-mono text-fb-ink dark:text-gray-100 tabular-nums">{traj.rangeM.toFixed(1)} m</span>
              </div>
              <div>
                <span className="text-fb-dim dark:text-gray-500 font-medium">Height </span>
                <span className="font-mono text-fb-ink dark:text-gray-100 tabular-nums">{traj.maxH.toFixed(1)} m</span>
              </div>
              <div>
                <span className="text-fb-dim dark:text-gray-500 font-medium">Time </span>
                <span className="font-mono text-fb-ink dark:text-gray-100 tabular-nums">{traj.tFlight.toFixed(2)} s</span>
              </div>
            </div>

            {/* actions */}
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={animate}
                className="text-xs font-medium text-white bg-fb-accent hover:bg-fb-accent-hover transition-colors px-3.5 py-1.5 rounded-md"
                aria-label="Launch projectile"
              >
                Launch
              </button>
              <button
                onClick={() => { stopAnim(); setAngle(45) }}
                className="text-xs text-fb-dim dark:text-gray-500 hover:text-fb-ink dark:hover:text-gray-200 transition-colors px-2 py-1.5"
                aria-label="Reset to 45 degrees"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Model disclosure */}
        <div className="mt-2 flex items-center justify-between">
          <p className="text-[11px] text-fb-dim dark:text-gray-500">
            V&#x2080; = {V0} m/s &middot; g = {G} m/s&sup2; &middot; no drag
          </p>
          <Link
            href="/projectile-motion"
            className="text-xs font-medium text-fb-accent hover:text-fb-accent-hover transition-colors inline-flex items-center gap-1 group"
          >
            Open full simulation
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5" aria-hidden="true">
              <path d="M4.5 2.5l3.5 3.5-3.5 3.5" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}
