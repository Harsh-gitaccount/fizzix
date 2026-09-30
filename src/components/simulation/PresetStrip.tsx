'use client'

import { useState, useCallback } from 'react'
import { useSimulationStore } from '@/store/simulationStore'
import { usePlaybackStore } from '@/store/playbackStore'
import { useUIStore } from '@/store/uiStore'
import { useTopic } from '@/simulations/TopicContext'
import { generateGhostTrails } from '@/simulations/projectile-motion/presets'
import { t } from '@/lib/i18n'
import { trackEvent } from '@/lib/analytics'

export default function PresetStrip() {
  const topic = useTopic()
  const [activePreset, setActivePreset] = useState<string | null>(null)
  const setParams = useSimulationStore((s) => s.setParams)
  const setParam = useSimulationStore((s) => s.setParam)
  const clearGhostTrails = useSimulationStore((s) => s.clearGhostTrails)
  const addGhostTrail = useSimulationStore((s) => s.addGhostTrail)
  const setCompareMode = useSimulationStore((s) => s.setCompareMode)
  const setCanvasBackground = useSimulationStore((s) => s.setCanvasBackground)
  const setPlaybackState = usePlaybackStore((s) => s.setPlaybackState)
  const setCurrentTime = usePlaybackStore((s) => s.setCurrentTime)
  const setActiveTab = useUIStore((s) => s.setActiveTab)
  const setActiveLayers = useUIStore((s) => s.setActiveLayers)
  const activeTab = useUIStore((s) => s.activeTab)
  const lang = useUIStore((s) => s.lang)

  const visiblePresets = (() => {
    if (activeTab === 'free-play') return topic.presets
    return topic.presets.filter((p) => p.defaultTab === activeTab)
  })()

  const loadPreset = useCallback(
    (presetId: string) => {
      const preset = topic.presets.find((p) => p.id === presetId)
      if (!preset) return

      clearGhostTrails()
      setParams({ ...topic.defaultParams, ...preset.params })
      setPlaybackState('ready')
      setCurrentTime(0)
      setActiveTab(preset.defaultTab)

      const layers: Record<string, boolean> = {}
      for (const def of topic.layerDefs) layers[def.key] = false
      for (const l of preset.defaultLayers) layers[l] = true
      if (preset.defaultTab === 'vectors') {
        layers.velocity = true
        layers.acceleration = true
      }
      setActiveLayers(layers)

      setCanvasBackground(preset.canvasBackground)
      setCompareMode(!!preset.compareParams)
      if (preset.compareParams) {
        useSimulationStore.setState({ paramsB: { ...preset.compareParams } })
      }

      if (preset.specialMode === 'ghost-trails' && topic.slug === 'projectile-motion') {
        const ghosts = generateGhostTrails(preset.params)
        ghosts.forEach((g) => addGhostTrail(g))
      }

      setActivePreset(presetId)
      trackEvent('Preset Used', { preset: presetId, topic: topic.slug })
    },
    [
      topic,
      clearGhostTrails,
      setParams,
      setPlaybackState,
      setCurrentTime,
      setActiveTab,
      setActiveLayers,
      setCompareMode,
      setCanvasBackground,
      addGhostTrail,
    ]
  )

  return (
    <div className="flex items-center gap-1.5 flex-wrap px-2 py-1">
      {visiblePresets.map((preset) => (
        <button
          key={preset.id}
          onClick={() => loadPreset(preset.id)}
          title={preset.hookQuestion}
          className={`preset-pill shrink-0 px-3 py-1 text-[11px] font-semibold rounded-full border transition-all ${
            activePreset === preset.id
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500'
          }`}
        >
          {t('preset.' + preset.id, lang)}
        </button>
      ))}
    </div>
  )
}
