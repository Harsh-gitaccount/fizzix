'use client'

import { useUIStore } from '@/store/uiStore'
import { useSimulationStore } from '@/store/simulationStore'
import { useTopic } from '@/simulations/TopicContext'
import { t } from '@/lib/i18n'
import { trackEvent } from '@/lib/analytics'

const TOOLS: Array<{ key: 'ruler' | 'protractor'; tKey: string; icon: string }> = [
  { key: 'ruler', tKey: 'tool.ruler', icon: '\u{1F4CF}' },
  { key: 'protractor', tKey: 'tool.protractor', icon: '\u{1F4D0}' },
]

export default function LayerToggles() {
  const topic = useTopic()
  const activeLayers = useUIStore((s) => s.activeLayers)
  const toggleLayer = useUIStore((s) => s.toggleLayer)
  const activeTools = useUIStore((s) => s.activeTools)
  const toggleTool = useUIStore((s) => s.toggleTool)
  const lang = useUIStore((s) => s.lang)
  const shmType = useSimulationStore((s) => s.params.shmType ?? 0)

  const visibleLayers = topic.layerDefs.filter((layer) => {
    if (topic.slug !== 'shm') return true
    // Angle layer only makes sense for pendulum
    if (layer.key === 'components' && shmType === 1) return false
    return true
  })

  return (
    <div className="px-4 py-2 border-t border-gray-200 dark:border-slate-700 space-y-2">
      <div>
        <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
          {t('layer.title', lang)}
        </span>
        <div className="flex flex-wrap gap-1">
          {visibleLayers.map((layer) => (
            <button
              key={layer.key}
              onClick={() => toggleLayer(layer.key)}
              aria-pressed={!!activeLayers[layer.key]}
              className={`px-2 py-1 text-[10px] font-semibold rounded border transition-colors ${
                activeLayers[layer.key]
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700'
                  : 'bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-slate-600'
              }`}
            >
              <span className="mr-1">{layer.icon}</span>
              {lang === 'hi' && layer.labelHi ? layer.labelHi : layer.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
          {t('tool.title', lang)}
        </span>
        <div className="flex flex-wrap gap-1">
          {TOOLS.map((tool) => (
            <button
              key={tool.key}
              onClick={() => { toggleTool(tool.key); trackEvent('Tool Used', { tool: tool.key }) }}
              aria-pressed={!!activeTools[tool.key]}
              className={`px-2 py-1 text-[10px] font-semibold rounded border transition-colors ${
                activeTools[tool.key]
                  ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-700'
                  : 'bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-slate-600'
              }`}
            >
              <span className="mr-1">{tool.icon}</span>
              {t(tool.tKey, lang)}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
