'use client'

import dynamic from 'next/dynamic'
import { useEffect } from 'react'
import TopBar from './TopBar'
import ControlPanel from './ControlPanel'
import DataTable from './DataTable'
import PlaybackBar from './PlaybackBar'
import TabBar from './TabBar'
import PresetStrip from './PresetStrip'
import LayerToggles from './LayerToggles'
import QuizPanel from '@/components/quiz/QuizPanel'
import ToastContainer from '@/components/ui/Toast'
import OfflineBanner from '@/components/ui/OfflineBanner'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useSoundEffects } from '@/hooks/useSoundEffects'
import { useServiceWorker } from '@/hooks/useServiceWorker'
import { useLangSync } from '@/hooks/useLangSync'
import { setupSyncListeners, syncQuizResults } from '@/lib/quiz/offlineStorage'
import { initSentry } from '@/lib/sentry'
import { t } from '@/lib/i18n'
import { useUIStore } from '@/store/uiStore'
import { useSimulationStore } from '@/store/simulationStore'
import { usePlaybackStore } from '@/store/playbackStore'
import { useUndoStore } from '@/store/undoStore'
import { useQuizStore } from '@/store/quizStore'
import { useTopic } from '@/simulations/TopicContext'

const Canvas2D = dynamic(() => import('./Canvas2D'), { ssr: false })
const Scene3DLongWave = dynamic(() => import('./Scene3DLongWave'), { ssr: false })
const Scene3DField = dynamic(() => import('./Scene3DField'), { ssr: false })
const Scene3DGas = dynamic(() => import('./Scene3DGas'), { ssr: false })

export default function SimulationPage() {
  const topic = useTopic()

  useKeyboardShortcuts(topic)
  useSoundEffects()
  useServiceWorker()
  useLangSync()

  useEffect(() => {
    initSentry()
    syncQuizResults()
    return setupSyncListeners()
  }, [])

  useEffect(() => {
    useSimulationStore.getState().initTopic(topic.defaultParams, topic.paramLimits)
    useUIStore.getState().setActiveTab(topic.defaultTab)
    useUIStore.getState().setActiveLayers(topic.defaultLayers)
    usePlaybackStore.getState().setCurrentTime(0)
    usePlaybackStore.getState().setPlaybackState('ready')
    useUndoStore.setState({ entries: [], pointer: -1 })
    useQuizStore.getState().resetQuiz()
    useSimulationStore.getState().setCompareMode(false)
    useSimulationStore.getState().clearGhostTrails()

    // Apply URL params after topic defaults so shared links override correctly
    const url = new URL(window.location.href)
    const sp = url.searchParams
    if (sp.size > 0) {
      const limits = topic.paramLimits ?? {}
      const parsed: Record<string, number> = {}
      let hasParam = false
      for (const key of Object.keys(limits)) {
        const val = sp.get(key)
        if (val !== null) {
          const n = Number(val)
          if (Number.isFinite(n)) {
            const [min, max] = limits[key]
            parsed[key] = Math.max(min, Math.min(max, n))
            hasParam = true
          }
        }
      }
      if (hasParam) {
        const { params, setParams } = useSimulationStore.getState()
        setParams({ ...params, ...parsed })
      }
      const tab = sp.get('tab')
      if (tab && topic.tabs.some((t: { id: string }) => t.id === tab)) {
        useUIStore.getState().setActiveTab(tab)
      }
      window.history.replaceState({}, '', url.pathname)
    }
  }, [topic])

  const activeTab = useUIStore((s) => s.activeTab)
  const simQuizMode = useUIStore((s) => s.simQuizMode)
  const panelTab = useUIStore((s) => s.panelTab)
  const setPanelTab = useUIStore((s) => s.setPanelTab)
  const showMeHint = useUIStore((s) => s.showMeHint)
  const clearShowMeHint = useUIStore((s) => s.clearShowMeHint)
  const setSimQuizMode = useUIStore((s) => s.setSimQuizMode)
  const lang = useUIStore((s) => s.lang)
  const setCompareMode = useSimulationStore((s) => s.setCompareMode)
  const clearGhostTrails = useSimulationStore((s) => s.clearGhostTrails)

  const exitShowMe = () => {
    clearShowMeHint()
    setCompareMode(false)
    clearGhostTrails()
    setSimQuizMode('quiz')
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-gray-50 dark:bg-slate-950">
      <a
        href="#control-panel"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-semibold"
      >
        Skip to simulation controls
      </a>

      <OfflineBanner />
      <TopBar />

      <div className="flex flex-col md:flex-row flex-1 min-h-0">
        <div className="flex-1 md:flex-[2] min-w-0 min-h-[200px] md:min-h-0 flex flex-col">
          {simQuizMode === 'sim' && !showMeHint && <TabBar />}
          {simQuizMode === 'sim' && !showMeHint && <PresetStrip />}
          {showMeHint && (
            <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-50 dark:bg-blue-900/30 border-b border-blue-200 dark:border-blue-800">
              <span className="text-blue-600 dark:text-blue-400 text-sm font-bold shrink-0">{t('hint.label', lang)}</span>
              <p className="text-xs text-blue-800 dark:text-blue-300 flex-1 leading-relaxed">{showMeHint}</p>
              <button
                onClick={exitShowMe}
                className="px-3 py-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 rounded hover:bg-blue-200 dark:hover:bg-blue-800/50 shrink-0"
              >
                {t('hint.backToQuiz', lang)}
              </button>
            </div>
          )}
          <div className="flex-1 min-h-[180px] md:min-h-0 relative">
            {activeTab === 'long-wave' ? (
              <Scene3DLongWave />
            ) : activeTab === 'field-3d' ? (
              <Scene3DField />
            ) : topic.slug === 'thermodynamics' ? (
              <Scene3DGas />
            ) : (
              <Canvas2D />
            )}
          </div>
        </div>

        <div id="control-panel" className="flex-1 md:flex-none w-full md:w-[320px] md:shrink-0 min-h-0 flex flex-col border-t md:border-t-0 border-gray-200 dark:border-slate-700">
          {simQuizMode === 'sim' ? (
            <>
              <div className="flex bg-gray-100 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700" role="tablist">
                <button
                  role="tab"
                  aria-selected={panelTab === 'params'}
                  onClick={() => setPanelTab('params')}
                  className={`flex-1 px-3 py-2 text-[11px] font-bold transition-colors ${
                    panelTab === 'params'
                      ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {t('panel.controls', lang)}
                </button>
                <button
                  role="tab"
                  aria-selected={panelTab === 'data'}
                  onClick={() => setPanelTab('data')}
                  className={`flex-1 px-3 py-2 text-[11px] font-bold transition-colors ${
                    panelTab === 'data'
                      ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {t('panel.dataTable', lang)}
                </button>
              </div>
              <div className="flex-1 min-h-0 flex flex-col">
                {panelTab === 'params' ? (
                  <>
                    <ControlPanel />
                    <LayerToggles />
                  </>
                ) : (
                  <DataTable />
                )}
              </div>
            </>
          ) : (
            <QuizPanel />
          )}
        </div>
      </div>

      <PlaybackBar />
      <ToastContainer />
    </div>
  )
}
