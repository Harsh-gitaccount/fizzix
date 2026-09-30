'use client'

import { useEffect } from 'react'
import { useSimulationStore } from '@/store/simulationStore'
import { useUIStore } from '@/store/uiStore'

export function useURLParams() {
  useEffect(() => {
    const url = new URL(window.location.href)
    const sp = url.searchParams
    if (sp.size === 0) return

    const CLAMP: Record<string, [number, number]> = {
      v0: [0, 100],
      theta: [-90, 90],
      g: [0.1, 25],
      y0: [0, 50],
      drag: [0, 1],
    }
    const parsed: Record<string, number> = {}
    let hasParam = false

    for (const key of Object.keys(CLAMP)) {
      const val = sp.get(key)
      if (val !== null) {
        const n = Number(val)
        if (Number.isFinite(n)) {
          const [min, max] = CLAMP[key]
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
    if (tab) {
      useUIStore.getState().setActiveTab(tab)
    }

    window.history.replaceState({}, '', url.pathname)
  }, [])
}
