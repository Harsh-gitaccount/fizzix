'use client'

import { useCallback } from 'react'
import { useUIStore } from '@/store/uiStore'
import { useSimulationStore } from '@/store/simulationStore'
import { usePlaybackStore } from '@/store/playbackStore'
import { useTopic } from '@/simulations/TopicContext'
import { t } from '@/lib/i18n'

export default function TabBar() {
  const topic = useTopic()
  const activeTab = useUIStore((s) => s.activeTab)
  const setActiveTab = useUIStore((s) => s.setActiveTab)
  const lang = useUIStore((s) => s.lang)

  const setParams = useSimulationStore((s) => s.setParams)
  const params = useSimulationStore((s) => s.params)
  const setCurrentTime = usePlaybackStore((s) => s.setCurrentTime)
  const setPlaybackState = usePlaybackStore((s) => s.setPlaybackState)

  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId)
    setCurrentTime(0)
    setPlaybackState('ready')

    if (topic.slug === 'shm') {
      if (tabId === 'pendulum') {
        setParams({ ...topic.defaultParams, ...params, shmType: 0 })
      } else if (tabId === 'spring' || tabId === 'long-wave') {
        setParams({ ...topic.defaultParams, ...params, shmType: 1 })
      }
    }

    if (topic.slug === 'electrostatics') {
      const typeMap: Record<string, number> = { 'charges': 0, 'field-lines': 1, 'simple-circuit': 2, 'series-parallel': 3, 'field-3d': 1 }
      const elecType = typeMap[tabId] ?? 0
      setParams({ ...topic.defaultParams, ...params, elecType })
    }

    if (topic.slug === 'optics') {
      const typeMap: Record<string, number> = { 'refraction': 0, 'lenses': 1, 'tir': 2, 'free-play': 3 }
      const opticsType = typeMap[tabId] ?? 0
      const tirDefaults: Record<string, number> = opticsType === 2 ? { n1: 1.5, n2: 1.0, theta1: 30 } : {}
      setParams({ ...topic.defaultParams, ...params, ...tirDefaults, opticsType })
    }

    if (topic.slug === 'thermodynamics') {
      const typeMap: Record<string, number> = { 'gas': 0, 'piston': 1, 'brownian': 2, 'free-play': 3 }
      const thermoType = typeMap[tabId] ?? 0
      setParams({ ...topic.defaultParams, ...params, thermoType })
    }

    if (topic.slug === 'modern-physics') {
      const typeMap: Record<string, number> = { 'photoelectric': 0, 'bohr': 1, 'decay': 2, 'free-play': 3 }
      const modernType = typeMap[tabId] ?? 0
      setParams({ ...topic.defaultParams, ...params, modernType })
    }
  }, [topic.slug, topic.defaultParams, params, setActiveTab, setCurrentTime, setPlaybackState, setParams])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const tabs = topic.tabs
    const idx = tabs.findIndex((tab) => tab.id === activeTab)
    let next = -1
    if (e.key === 'ArrowRight') next = (idx + 1) % tabs.length
    else if (e.key === 'ArrowLeft') next = (idx - 1 + tabs.length) % tabs.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = tabs.length - 1
    if (next >= 0) {
      e.preventDefault()
      handleTabChange(tabs[next].id)
      const el = document.getElementById(`tab-${tabs[next].id}`)
      el?.focus()
    }
  }, [topic.tabs, activeTab, handleTabChange])

  return (
    <div role="tablist" className="flex border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 shrink-0" onKeyDown={handleKeyDown}>
      {topic.tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          id={`tab-${tab.id}`}
          aria-selected={activeTab === tab.id}
          aria-controls={`tabpanel-${tab.id}`}
          tabIndex={activeTab === tab.id ? 0 : -1}
          onClick={() => handleTabChange(tab.id)}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors ${
            activeTab === tab.id
              ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
              : 'text-gray-400 dark:text-gray-500 border-transparent hover:text-gray-600 dark:hover:text-gray-400'
          }`}
        >
          {t(tab.labelKey, lang)}
        </button>
      ))}
    </div>
  )
}
