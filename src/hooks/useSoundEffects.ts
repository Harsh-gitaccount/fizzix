'use client'

import { useEffect, useRef } from 'react'
import { usePlaybackStore } from '@/store/playbackStore'
import { useUIStore } from '@/store/uiStore'
import { playSound } from '@/lib/sound/engine'

export function useSoundEffects() {
  const playbackState = usePlaybackStore((s) => s.playbackState)
  const soundEnabled = useUIStore((s) => s.soundEnabled)
  const prevState = useRef(playbackState)

  useEffect(() => {
    if (!soundEnabled) {
      prevState.current = playbackState
      return
    }

    const prev = prevState.current
    prevState.current = playbackState

    if (prev === playbackState) return

    if (playbackState === 'playing' && (prev === 'ready' || prev === 'landed')) {
      playSound('launch')
    } else if (playbackState === 'landed') {
      playSound('land')
    } else if (playbackState === 'paused' && prev === 'playing') {
      playSound('peak')
    }
  }, [playbackState, soundEnabled])
}
