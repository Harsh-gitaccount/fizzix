'use client'

import { useEffect } from 'react'
import { usePlaybackStore } from '@/store/playbackStore'
import { useUIStore } from '@/store/uiStore'
import { useUndoStore } from '@/store/undoStore'
import { useSimulationStore } from '@/store/simulationStore'
import type { SimulationModule } from '@/simulations/types'

export function useKeyboardShortcuts(topic: SimulationModule) {
  useEffect(() => {
    const tabs = topic.tabs.map(tab => tab.id)

    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') return
      if (target.isContentEditable) return

      const { playbackState, currentTime, speedMultiplier, setPlaybackState, setCurrentTime, setSpeedMultiplier } = usePlaybackStore.getState()
      const { setActiveTab } = useUIStore.getState()
      const { params, compareMode, paramsB } = useSimulationStore.getState()

      switch (e.code) {
        case 'Space': {
          if (target.tagName === 'BUTTON') return
          e.preventDefault()
          if (playbackState === 'playing') {
            setPlaybackState('paused')
          } else if (playbackState === 'landed') {
            setCurrentTime(0)
            setPlaybackState('playing')
          } else {
            setPlaybackState('playing')
          }
          break
        }
        case 'Escape': {
          e.preventDefault()
          setCurrentTime(0)
          setPlaybackState('ready')
          break
        }
        case 'Digit1':
        case 'Digit2':
        case 'Digit3':
        case 'Digit4': {
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault()
            const idx = parseInt(e.code.slice(5)) - 1
            if (idx >= 0 && idx < tabs.length) {
              setActiveTab(tabs[idx])
            }
          }
          break
        }
        case 'Equal':
        case 'NumpadAdd': {
          e.preventDefault()
          const speeds = [0.1, 0.25, 0.5, 1, 2, 4]
          const curIdx = speeds.indexOf(speedMultiplier)
          if (curIdx < speeds.length - 1) {
            setSpeedMultiplier(speeds[curIdx + 1])
          }
          break
        }
        case 'Minus':
        case 'NumpadSubtract': {
          e.preventDefault()
          const speeds = [0.1, 0.25, 0.5, 1, 2, 4]
          const curIdx = speeds.indexOf(speedMultiplier)
          if (curIdx > 0) {
            setSpeedMultiplier(speeds[curIdx - 1])
          }
          break
        }
        case 'KeyZ': {
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            if (e.shiftKey) {
              const entry = useUndoStore.getState().redo()
              if (entry) {
                useSimulationStore.getState().setParams(entry.params)
                setCurrentTime(0)
                setPlaybackState('ready')
              }
            } else {
              const entry = useUndoStore.getState().undo()
              if (entry) {
                useSimulationStore.getState().setParams(entry.params)
                setCurrentTime(0)
                setPlaybackState('ready')
              }
            }
          }
          break
        }
        case 'ArrowLeft': {
          e.preventDefault()
          const step = e.shiftKey ? 0.5 : 1 / 60
          const newT = Math.max(0, currentTime - step)
          setCurrentTime(newT)
          if (playbackState === 'playing') setPlaybackState('paused')
          break
        }
        case 'F11': {
          e.preventDefault()
          if (document.fullscreenElement) {
            document.exitFullscreen()
          } else {
            document.documentElement.requestFullscreen()
          }
          break
        }
        case 'ArrowRight': {
          e.preventDefault()
          const tofA = topic.timeOfFlight(params)
          const tof = compareMode ? Math.max(tofA, topic.timeOfFlight(paramsB)) : tofA
          const step = e.shiftKey ? 0.5 : 1 / 60
          const newT = Math.min(tof, currentTime + step)
          setCurrentTime(newT)
          if (newT >= tof) setPlaybackState('landed')
          else if (playbackState === 'playing') setPlaybackState('paused')
          break
        }
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [topic])
}
