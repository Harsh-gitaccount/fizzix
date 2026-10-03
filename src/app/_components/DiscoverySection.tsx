'use client'

import { useState, useEffect } from 'react'

const DEG = Math.PI / 180
const V0 = 20
const G = 9.81

const SVG_W = 600
const SVG_H = 320
const GROUND_Y = 280
const PLOT_L = 50
const PLOT_R = 570
const PLOT_W = PLOT_R - PLOT_L
const PLOT_H = GROUND_Y - 20
const WORLD_W = 42
const WORLD_H = 17
const SX = PLOT_W / WORLD_W
const SY = PLOT_H / WORLD_H

function wx(x: number) { return PLOT_L + x * SX }
function wy(y: number) { return GROUND_Y - y * SY }

function calcTraj(angleDeg: number) {
  const rad = angleDeg * DEG
  const vx = V0 * Math.cos(rad)
  const vy0 = V0 * Math.sin(rad)
  const tFlight = (2 * vy0) / G
  const rangeM = vx * tFlight
  const maxH = (vy0 * vy0) / (2 * G)
  const steps = 50
  const pts: string[] = []
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * tFlight
    const x = vx * t
    const y = vy0 * t - 0.5 * G * t * t
    pts.push(`${wx(x).toFixed(1)},${wy(y).toFixed(1)}`)
  }
  return { rangeM, maxH, points: pts.join(' ') }
}

const ANGLE_A = 30
const ANGLE_B = 60

export function DiscoverySection() {
  const [revealed, setRevealed] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const trajA = calcTraj(ANGLE_A)
  const trajB = calcTraj(ANGLE_B)
  const rangeMatch = Math.abs(trajA.rangeM - trajB.rangeM) < 0.1

  useEffect(() => {
    const el = document.documentElement
    setIsDark(el.classList.contains('dark'))
    const observer = new MutationObserver(() => setIsDark(el.classList.contains('dark')))
    observer.observe(el, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  const ink = isDark ? '#E2E8F0' : '#1B2249'

  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 bg-fb-paper dark:bg-slate-900">
      <div className="max-w-3xl mx-auto">
        <p className="text-xs font-mono text-fb-dim dark:text-gray-500 tracking-widest uppercase mb-3 text-center">
          Discovery
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-fb-ink dark:text-gray-100 mb-3 tracking-tight font-serif">
          Can two different angles land at the same distance?
        </h2>
        <p className="text-center text-fb-muted dark:text-gray-400 text-sm sm:text-base mb-8 max-w-lg mx-auto leading-relaxed">
          Same speed, same gravity, no drag, launched and landing on flat ground. Try {ANGLE_A}&deg; and {ANGLE_B}&deg;.
        </p>

        {/* Comparison diagram */}
        <div className="mb-6 -mx-2 sm:mx-0">
          <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full h-auto" role="img" aria-label={`Comparison of ${ANGLE_A} degree and ${ANGLE_B} degree trajectories: both land at ${trajA.rangeM.toFixed(1)} m`}>
            {/* ground line */}
            <line x1={PLOT_L} y1={GROUND_Y} x2={PLOT_R} y2={GROUND_Y} stroke={ink} strokeWidth="0.5" opacity="0.15" />

            {/* 30 degree trajectory */}
            <polyline points={trajA.points} fill="none" stroke="#E8740C" strokeWidth="2" opacity="0.6" strokeLinecap="round" />
            <text x={wx(trajA.rangeM * 0.55)} y={wy(trajA.maxH) - 6} fill="#E8740C" fontSize="12" fontFamily="monospace" opacity="0.8" textAnchor="middle" fontWeight="500">
              {ANGLE_A}&deg;
            </text>

            {/* 60 degree trajectory */}
            <polyline points={trajB.points} fill="none" stroke="#3B82F6" strokeWidth="2" opacity="0.6" strokeLinecap="round" />
            <text x={wx(trajB.rangeM * 0.35)} y={wy(trajB.maxH) - 6} fill="#3B82F6" fontSize="12" fontFamily="monospace" opacity="0.8" textAnchor="middle" fontWeight="500">
              {ANGLE_B}&deg;
            </text>

            {/* launcher dot */}
            <circle cx={wx(0)} cy={wy(0)} r="5" fill={ink} opacity="0.6" />

            {/* landing point */}
            <circle cx={wx(trajA.rangeM)} cy={wy(0)} r="5" fill={ink} opacity="0.3" />
            <text x={wx(trajA.rangeM)} y={GROUND_Y + 18} fill={ink} fontSize="11" fontFamily="monospace" opacity="0.5" textAnchor="middle">
              {trajA.rangeM.toFixed(1)} m
            </text>
          </svg>
        </div>

        {/* Prediction + reveal */}
        <div className="max-w-lg mx-auto">
          <p className="text-sm text-fb-muted dark:text-gray-400 mb-3 leading-relaxed">
            <strong className="text-fb-ink dark:text-gray-100">Setup:</strong> V&#x2080; = {V0} m/s, g = {G} m/s&sup2;, no drag, flat ground.
          </p>
          <p className="text-sm text-fb-muted dark:text-gray-400 mb-4 leading-relaxed">
            <strong className="text-fb-ink dark:text-gray-100">Prediction:</strong> Will the {ANGLE_A}&deg; and {ANGLE_B}&deg; throws land at the same distance?
          </p>

          {!revealed ? (
            <button
              onClick={() => setRevealed(true)}
              className="text-sm font-medium text-white bg-fb-accent hover:bg-fb-accent-hover transition-colors px-4 py-2 rounded-md"
            >
              Show explanation
            </button>
          ) : (
            <div className="bg-fb-page dark:bg-slate-800 border border-fb-rule/60 dark:border-slate-700 rounded-lg p-4 text-sm text-fb-muted dark:text-gray-400 leading-relaxed space-y-2">
              <p>
                <strong className="text-fb-ink dark:text-gray-100">Observation:</strong>{' '}
                {rangeMatch
                  ? `Both land at ${trajA.rangeM.toFixed(1)} m - the same distance.`
                  : `30 degrees lands at ${trajA.rangeM.toFixed(1)} m, 60 degrees at ${trajB.rangeM.toFixed(1)} m.`}
              </p>
              <p>
                <strong className="text-fb-ink dark:text-gray-100">Why:</strong> Range = V&#x2080;&sup2; sin(2&#x3B8;) / g. Since sin(2 &times; 30&deg;) = sin(60&deg;) and sin(2 &times; 60&deg;) = sin(120&deg;), and sin(60&deg;) = sin(120&deg;), both angles produce the same range. Any pair of complementary angles (&#x3B8; and 90&deg; &#x2212; &#x3B8;) shares this symmetry.
              </p>
              <p>
                <strong className="text-fb-ink dark:text-gray-100">Assumptions:</strong> Equal launch and landing heights, fixed speed and gravity, no air drag. With drag or unequal heights, the symmetry breaks.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
