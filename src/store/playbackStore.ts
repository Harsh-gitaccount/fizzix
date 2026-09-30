import { create } from 'zustand'

export type PlaybackState = 'ready' | 'playing' | 'paused' | 'landed'

interface PlaybackStore {
  playbackState: PlaybackState
  currentTime: number
  speedMultiplier: number
  pauseAtKeyPoints: boolean

  setPlaybackState: (state: PlaybackState) => void
  setCurrentTime: (t: number) => void
  setSpeedMultiplier: (s: number) => void
  setPauseAtKeyPoints: (v: boolean) => void
}

export const usePlaybackStore = create<PlaybackStore>((set) => ({
  playbackState: 'ready',
  currentTime: 0,
  speedMultiplier: 1,
  pauseAtKeyPoints: false,

  setPlaybackState: (playbackState) => set({ playbackState }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setSpeedMultiplier: (speedMultiplier) => set({ speedMultiplier }),
  setPauseAtKeyPoints: (pauseAtKeyPoints) => set({ pauseAtKeyPoints }),
}))
