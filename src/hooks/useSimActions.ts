'use client'

import { useCallback } from 'react'
import { useSimulationStore } from '@/store/simulationStore'
import { usePlaybackStore } from '@/store/playbackStore'
import { useUndoStore } from '@/store/undoStore'

export function useParamChange() {
  const setParam = useSimulationStore((s) => s.setParam)
  const setPlaybackState = usePlaybackStore((s) => s.setPlaybackState)
  const setCurrentTime = usePlaybackStore((s) => s.setCurrentTime)

  return useCallback(
    (key: string, value: number) => {
      setParam(key, value)
      setPlaybackState('ready')
      setCurrentTime(0)
    },
    [setParam, setPlaybackState, setCurrentTime]
  )
}

export function useSimReset() {
  const setPlaybackState = usePlaybackStore((s) => s.setPlaybackState)
  const setCurrentTime = usePlaybackStore((s) => s.setCurrentTime)
  const clearGhostTrails = useSimulationStore((s) => s.clearGhostTrails)

  return useCallback(() => {
    setPlaybackState('ready')
    setCurrentTime(0)
    clearGhostTrails()
  }, [clearGhostTrails, setPlaybackState, setCurrentTime])
}

export function useParamChangeWithUndo() {
  const params = useSimulationStore((s) => s.params)
  const push = useUndoStore((s) => s.push)
  const entries = useUndoStore((s) => s.entries)
  const changeParam = useParamChange()

  return useCallback(
    (key: string, value: number) => {
      if (entries.length === 0) {
        push({ params: { ...params }, label: 'initial' })
      }
      changeParam(key, value)
      const newParams = { ...params, [key]: value }
      push({ params: newParams, label: `${key} = ${value}` })
    },
    [params, push, entries.length, changeParam]
  )
}
