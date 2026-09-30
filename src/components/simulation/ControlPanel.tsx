'use client'

import { useState } from 'react'
import { useSimulationStore } from '@/store/simulationStore'
import { usePlaybackStore } from '@/store/playbackStore'
import { useUIStore } from '@/store/uiStore'
import { useParamChangeWithUndo } from '@/hooks/useSimActions'
import { useTopic } from '@/simulations/TopicContext'
import { t, tOr } from '@/lib/i18n'
import type { ParamDef } from '@/simulations/types'

function ParamHelp({ def, lang }: { def: ParamDef; lang: 'en' | 'hi' }) {
  const [open, setOpen] = useState(false)
  const text = lang === 'hi' && def.helpHi ? def.helpHi : def.help

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        aria-label={`What is ${def.symbol}?`}
        className="w-3.5 h-3.5 rounded-full bg-gray-200 dark:bg-slate-700 text-[8px] font-bold text-gray-500 dark:text-gray-400 hover:bg-blue-100 dark:hover:bg-blue-900 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center justify-center leading-none"
      >
        ?
      </button>
      {open && (
        <span className="absolute left-5 top-1/2 -translate-y-1/2 z-50 w-48 px-2.5 py-1.5 text-[10px] leading-tight bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-md shadow-lg whitespace-normal">
          <span className="font-semibold">{def.symbol}</span> — {text}
        </span>
      )}
    </span>
  )
}

export default function ControlPanel() {
  const topic = useTopic()
  const params = useSimulationStore((s) => s.params)
  const compareMode = useSimulationStore((s) => s.compareMode)
  const paramsB = useSimulationStore((s) => s.paramsB)
  const currentTime = usePlaybackStore((s) => s.currentTime)
  const changeParam = useParamChangeWithUndo()
  const lang = useUIStore((s) => s.lang)

  const state = topic.stateAtTime(params, currentTime)
  const derived = topic.derivedValues(params, state)

  const tofB = compareMode ? topic.timeOfFlight(paramsB) : 0
  const tB = compareMode ? Math.min(currentTime, tofB) : 0
  const stateB = compareMode ? topic.stateAtTime(paramsB, tB) : null
  const derivedB = stateB ? topic.derivedValues(paramsB, stateB) : null

  const v0 = params.v0 ?? 0
  const showUnitWarning = topic.slug === 'projectile-motion' && v0 > 30

  const flagText = (label: string) =>
    tOr('flag.' + label.toLowerCase().replace(/ /g, '_'), lang, label)

  const visibleParamDefs = topic.paramDefs.filter((def) => {
    if (topic.slug === 'shm') {
      const shmType = params.shmType ?? 0
      if (shmType === 0) {
        return ['length', 'theta0', 'g', 'damping'].includes(def.key)
      }
      return ['k', 'mass', 'amplitude', 'damping'].includes(def.key)
    }
    if (topic.slug === 'electrostatics') {
      const elecType = params.elecType ?? 0
      if (elecType <= 1) {
        return ['q1', 'q2', 'distance'].includes(def.key)
      }
      if (elecType === 2) {
        return ['voltage', 'r1'].includes(def.key)
      }
      return ['voltage', 'r1', 'r2'].includes(def.key)
    }
    if (topic.slug === 'optics') {
      const opticsType = params.opticsType ?? 0
      if (opticsType === 1) {
        return ['objectDist', 'focalLength', 'objectHeight'].includes(def.key)
      }
      if (opticsType === 3) return true
      return ['n1', 'n2', 'theta1'].includes(def.key)
    }
    if (topic.slug === 'thermodynamics') {
      const thermoType = params.thermoType ?? 0
      if (thermoType === 0) {
        return ['temperature', 'moles', 'volume', 'molarMass'].includes(def.key)
      }
      if (thermoType === 1) {
        return ['temperature', 'moles', 'molarMass', 'pistonPos'].includes(def.key)
      }
      if (thermoType === 2) {
        return ['temperature', 'molarMass', 'numSmall'].includes(def.key)
      }
      return true
    }
    if (topic.slug === 'modern-physics') {
      const modernType = params.modernType ?? 0
      if (modernType === 0) {
        return ['wavelength', 'workFunction', 'intensity'].includes(def.key)
      }
      if (modernType === 1) {
        return ['orbitN', 'transitionFrom', 'transitionTo'].includes(def.key)
      }
      if (modernType === 2) {
        return ['halfLife', 'N0'].includes(def.key)
      }
      return true
    }
    return true
  })

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-l-0 md:border-l border-gray-200 dark:border-slate-700 overflow-y-auto">
      <div className="p-4 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
          {t('ctrl.parameters', lang)}
        </h3>
        {visibleParamDefs.map((def) => (
          <div key={def.key}>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 w-10 justify-end">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {def.symbol}
                </span>
                <ParamHelp def={def} lang={lang} />
              </span>
              <input
                type="range"
                min={def.min}
                max={def.max}
                step={def.step}
                value={params[def.key] ?? topic.defaultParams[def.key] ?? def.min}
                onChange={(e) => changeParam(def.key, parseFloat(e.target.value))}
                className="flex-1 h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <span className="w-20 text-right text-sm font-medium text-gray-600 dark:text-gray-400 tabular-nums">
                {(params[def.key] ?? topic.defaultParams[def.key] ?? 0).toFixed(def.step < 0.1 ? 2 : 1)} {def.unit}
              </span>
            </div>
            {def.key === 'v0' && showUnitWarning && (
              <p className="ml-9 mt-1 text-[10px] text-amber-600 dark:text-amber-400">
                {t('unit.warning', lang)
                  .replace('{value}', v0.toFixed(0))
                  .replace('{converted}', (v0 / 3.6).toFixed(1))}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-slate-700 space-y-1">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
            {t('ctrl.values', lang)}
          </h3>
          {compareMode && derivedB && (
            <div className="flex gap-3 text-[10px] font-bold">
              <span className="text-red-500">A</span>
              <span className="text-orange-500">B</span>
            </div>
          )}
        </div>
        {Object.entries(derived).map(([key, pv]) => (
          <div
            key={key}
            className="flex justify-between text-sm text-gray-600 dark:text-gray-400"
          >
            <span className="truncate mr-2">{tOr('val.' + key, lang, pv.label)}</span>
            {compareMode && derivedB ? (
              <span className="font-medium tabular-nums whitespace-nowrap">
                <span className="text-red-500">{Number.isNaN(pv.value) ? '—' : (pv.unit === '' && pv.symbol === '') ? flagText(pv.label) : pv.value.toFixed(2)}</span>
                <span className="mx-0.5 text-gray-300 dark:text-slate-600">|</span>
                <span className="text-orange-500">{derivedB[key] ? (Number.isNaN(derivedB[key].value) ? '—' : (derivedB[key].unit === '' && derivedB[key].symbol === '') ? flagText(derivedB[key].label) : derivedB[key].value.toFixed(2)) : '—'}</span>
                <span className="ml-1 text-gray-500">{pv.unit}</span>
              </span>
            ) : (
              <span className="font-medium tabular-nums">
                {Number.isNaN(pv.value) ? '—' : (pv.unit === '' && pv.symbol === '') ? flagText(pv.label) : `${pv.value.toFixed(2)} ${pv.unit}`}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
