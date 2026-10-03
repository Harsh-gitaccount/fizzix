'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'

const DEG = Math.PI / 180
const V0 = 20
const G = 9.81

const SVG_W = 640
const SVG_H = 320
const GROUND_Y = 260
const PLOT_L = 60
const PLOT_R = 620
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
  const tFlight = (vy0 + Math.sqrt(vy0 * vy0)) / G
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

export function HeroExperiment() {
  const [angle, setAngle] = useState(45)
  const [animProgress, setAnimProgress] = useState<number | null>(null)
  const [reducedMotion, setReducedMotion] = useState(false)
  const rafRef = useRef<number>(0)
  const startRef = useRef<number>(0)

  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
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
  const armLen = 28
  const armEndX = launcherX + armLen * Math.cos(-traj.rad)
  const armEndY = launcherY + armLen * Math.sin(-traj.rad)

  const angleArcD = (() => {
    const r = 20
    const startX = launcherX + r
    const startY = launcherY
    const endX = launcherX + r * Math.cos(-traj.rad)
    const endY = launcherY + r * Math.sin(-traj.rad)
    return `M ${startX},${startY} A ${r},${r} 0 0,0 ${endX},${endY}`
  })()

  const angleLabelX = launcherX + 30 * Math.cos(-traj.rad / 2)
  const angleLabelY = launcherY + 30 * Math.sin(-traj.rad / 2)

  return (
    <div className="relative">
      <div className="rounded-xl border border-white/[0.06] bg-atlas-surface/50 overflow-hidden">
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="w-full h-auto"
          role="img"
          aria-label={`Projectile motion experiment: ${angle}° launch angle, ${traj.rangeM.toFixed(1)}m range, ${traj.maxH.toFixed(1)}m max height`}
        >
          <defs>
            <radialGradient id="hero-glow" cx="30%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
            </radialGradient>
          </defs>

          <rect width={SVG_W} height={SVG_H} fill="url(#hero-glow)" />

          {/* ground line */}
          <line x1={PLOT_L - 10} y1={GROUND_Y} x2={PLOT_R + 10} y2={GROUND_Y} stroke="white" strokeWidth="1" opacity="0.1" />

          {/* trajectory path */}
          <polyline points={traj.points} fill="none" stroke="#3B82F6" strokeWidth="2" opacity="0.6" strokeLinecap="round" strokeLinejoin="round" />

          {/* sampled dots */}
          {[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1].map((frac, i) => {
            const t = frac * traj.tFlight
            const pos = calcPositionAtTime(angle, t)
            return <circle key={i} cx={pos.x} cy={pos.y} r="1.5" fill="#3B82F6" opacity={0.2} />
          })}

          {/* max height dashed line */}
          <line x1={apexPos.x} y1={apexPos.y} x2={apexPos.x} y2={GROUND_Y} stroke="#3B82F6" strokeWidth="0.8" opacity="0.2" strokeDasharray="4 3" />
          <text x={apexPos.x + 5} y={apexPos.y + (GROUND_Y - apexPos.y) / 2} fill="#3B82F6" fontSize="10" fontFamily="monospace" opacity="0.4">
            {traj.maxH.toFixed(1)}m
          </text>

          {/* range line */}
          <line x1={wx(0)} y1={GROUND_Y + 12} x2={wx(traj.rangeM)} y2={GROUND_Y + 12} stroke="#3B82F6" strokeWidth="0.8" opacity="0.25" />
          <line x1={wx(0)} y1={GROUND_Y + 8} x2={wx(0)} y2={GROUND_Y + 16} stroke="#3B82F6" strokeWidth="0.8" opacity="0.25" />
          <line x1={wx(traj.rangeM)} y1={GROUND_Y + 8} x2={wx(traj.rangeM)} y2={GROUND_Y + 16} stroke="#3B82F6" strokeWidth="0.8" opacity="0.25" />
          <text x={(wx(0) + wx(traj.rangeM)) / 2} y={GROUND_Y + 24} fill="#3B82F6" fontSize="10" fontFamily="monospace" opacity="0.4" textAnchor="middle">
            {traj.rangeM.toFixed(1)}m
          </text>

          {/* launcher */}
          <circle cx={launcherX} cy={launcherY} r="6" fill="#E8740C" opacity="0.9" />
          <circle cx={launcherX} cy={launcherY} r="10" fill="#E8740C" opacity="0.1" />
          <line x1={launcherX} y1={launcherY} x2={armEndX} y2={armEndY} stroke="#E8740C" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />

          {/* angle arc */}
          <path d={angleArcD} fill="none" stroke="#E8740C" strokeWidth="1" opacity="0.5" />
          <text x={angleLabelX} y={angleLabelY} fill="#E8740C" fontSize="11" fontFamily="monospace" opacity="0.7" textAnchor="middle" dominantBaseline="middle">
            {angle}°
          </text>

          {/* animated ball */}
          {ballPos && (
            <>
              <circle cx={ballPos.x} cy={ballPos.y} r="5" fill="#3B82F6" opacity="0.9" />
              <circle cx={ballPos.x} cy={ballPos.y} r="10" fill="#3B82F6" opacity="0.12" />
            </>
          )}
        </svg>

        {/* controls bar */}
        <div className="px-4 sm:px-5 py-3 border-t border-white/[0.06] bg-atlas-surface/80">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            {/* angle slider */}
            <div className="flex items-center gap-3 min-w-0">
              <label htmlFor="hero-angle" className="text-xs text-slate-400 whitespace-nowrap">
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
                className="experiment-slider w-28 sm:w-36"
                aria-valuemin={10}
                aria-valuemax={80}
                aria-valuenow={angle}
                aria-valuetext={`${angle} degrees`}
              />
              <span className="text-sm font-mono text-white/80 w-8 text-right tabular-nums">{angle}°</span>
            </div>

            {/* readouts */}
            <div className="flex items-center gap-4 text-xs">
              <div>
                <span className="text-slate-500">Range </span>
                <span className="font-mono text-white/70 tabular-nums">{traj.rangeM.toFixed(1)} m</span>
              </div>
              <div>
                <span className="text-slate-500">Height </span>
                <span className="font-mono text-white/70 tabular-nums">{traj.maxH.toFixed(1)} m</span>
              </div>
              <div>
                <span className="text-slate-500">Time </span>
                <span className="font-mono text-white/70 tabular-nums">{traj.tFlight.toFixed(2)} s</span>
              </div>
            </div>

            {/* actions */}
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={animate}
                className="text-xs font-medium text-atlas-accent hover:text-atlas-accent-light transition-colors px-3 py-1.5 rounded-md border border-atlas-accent/20 hover:border-atlas-accent/40"
                aria-label="Launch projectile"
              >
                Launch
              </button>
              <button
                onClick={() => { stopAnim(); setAngle(45) }}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-2 py-1.5"
                aria-label="Reset to 45 degrees"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        <Link
          href="/projectile-motion"
          className="text-xs text-atlas-accent/70 hover:text-atlas-accent transition-colors group inline-flex items-center gap-1"
        >
          Open full simulation
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5" aria-hidden="true">
            <path d="M4.5 2.5l3.5 3.5-3.5 3.5" />
          </svg>
        </Link>
      </div>
    </div>
  )
}
