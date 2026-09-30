'use client'

import { useState, useRef, useEffect } from 'react'
import { usePlaybackStore } from '@/store/playbackStore'
import { useSimulationStore } from '@/store/simulationStore'
import { useUIStore } from '@/store/uiStore'
import { useSimReset } from '@/hooks/useSimActions'
import { useTopic } from '@/simulations/TopicContext'
import { playSound } from '@/lib/sound/engine'
import { showToast } from '@/components/ui/Toast'
import { t } from '@/lib/i18n'
import { trackEvent } from '@/lib/analytics'

const SPEEDS = [0.1, 0.25, 0.5, 1, 2, 4]

export default function PlaybackBar() {
  const topic = useTopic()
  const playbackState = usePlaybackStore((s) => s.playbackState)
  const currentTime = usePlaybackStore((s) => s.currentTime)
  const speedMultiplier = usePlaybackStore((s) => s.speedMultiplier)
  const pauseAtKeyPoints = usePlaybackStore((s) => s.pauseAtKeyPoints)
  const setPlaybackState = usePlaybackStore((s) => s.setPlaybackState)
  const setCurrentTime = usePlaybackStore((s) => s.setCurrentTime)
  const setSpeedMultiplier = usePlaybackStore((s) => s.setSpeedMultiplier)
  const setPauseAtKeyPoints = usePlaybackStore((s) => s.setPauseAtKeyPoints)
  const soundEnabled = useUIStore((s) => s.soundEnabled)
  const toggleSound = useUIStore((s) => s.toggleSound)
  const lang = useUIStore((s) => s.lang)
  const ghostTrails = useSimulationStore((s) => s.ghostTrails)
  const clearGhostTrails = useSimulationStore((s) => s.clearGhostTrails)
  const params = useSimulationStore((s) => s.params)
  const reset = useSimReset()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const tof = topic.timeOfFlight(params)

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const handlePlayPause = () => {
    if (playbackState === 'playing') {
      setPlaybackState('paused')
    } else if (playbackState === 'landed') {
      setCurrentTime(0)
      setPlaybackState('playing')
    } else {
      setPlaybackState('playing')
      if (playbackState === 'ready') {
        trackEvent('Sim Start', { topic: topic.slug })
      }
    }
  }

  const handleReset = () => {
    reset()
    if (soundEnabled) playSound('reset')
  }

  const handleStepBack = () => {
    const newT = Math.max(0, currentTime - 1 / 60)
    setCurrentTime(newT)
    if (playbackState === 'playing') setPlaybackState('paused')
  }

  const handleStepForward = () => {
    const newT = Math.min(tof, currentTime + 1 / 60)
    setCurrentTime(newT)
    if (newT >= tof) setPlaybackState('landed')
    else if (playbackState === 'playing') setPlaybackState('paused')
  }

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = parseFloat(e.target.value)
    setCurrentTime(t)
    if (playbackState === 'playing') setPlaybackState('paused')
    if (t >= tof) setPlaybackState('landed')
    else if (t <= 0) setPlaybackState('ready')
    else setPlaybackState('paused')
  }

  const playIcon =
    playbackState === 'playing'
      ? '⏸' // pause
      : playbackState === 'landed'
        ? '↻' // replay
        : '▶' // play

  return (
    <div
      className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700"
      data-playback-state={playbackState}
    >
      {/* Step Back */}
      <button
        onClick={handleStepBack}
        className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-400"
        aria-label="Step back"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M3 3h2v10H3V3zm10 0L7 8l6 5V3z" />
        </svg>
      </button>

      {/* Play/Pause */}
      <button
        onClick={handlePlayPause}
        className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 text-white text-lg"
        aria-label={playbackState === 'playing' ? 'Pause' : 'Play'}
      >
        {playIcon}
      </button>

      {/* Step Forward */}
      <button
        onClick={handleStepForward}
        className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-400"
        aria-label="Step forward"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M11 3h2v10h-2V3zM3 3l6 5-6 5V3z" />
        </svg>
      </button>

      {/* Reset */}
      <button
        onClick={handleReset}
        className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-400"
        aria-label="Reset"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 2a6 6 0 100 12A6 6 0 008 2zm0 1.5a4.5 4.5 0 110 9 4.5 4.5 0 010-9zM5 8h6v1.5H5V8z" />
        </svg>
      </button>

      {/* Speed */}
      <select
        value={speedMultiplier}
        onChange={(e) => setSpeedMultiplier(parseFloat(e.target.value))}
        className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded text-gray-700 dark:text-gray-300"
        aria-label="Playback speed"
      >
        {SPEEDS.map((s) => (
          <option key={s} value={s}>
            {s}x
          </option>
        ))}
      </select>

      {/* Time Scrubber */}
      <div className="flex-1 flex items-center gap-2">
        <input
          type="range"
          min={0}
          max={tof || 1}
          step={0.001}
          value={currentTime}
          onChange={handleScrub}
          className="flex-1 h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
          aria-label="Time scrubber"
        />
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 tabular-nums w-16 text-right">
          {currentTime.toFixed(2)}s / {tof.toFixed(2)}s
        </span>
      </div>

      {/* Overflow Menu */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-400"
          aria-label="More options"
          aria-expanded={menuOpen}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="8" cy="3" r="1.5" />
            <circle cx="8" cy="8" r="1.5" />
            <circle cx="8" cy="13" r="1.5" />
          </svg>
        </button>
        {menuOpen && (
          <div className="absolute bottom-full right-0 mb-2 w-52 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg py-1 z-50">
            <button
              onClick={toggleSound}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300"
            >
              <span className="w-5 text-center">{soundEnabled ? '🔊' : '🔇'}</span>
              <span>{soundEnabled ? t('play.soundOn', lang) : t('play.soundOff', lang)}</span>
            </button>
            {(topic.slug === 'projectile-motion' || topic.slug === 'shm') && (
              <button
                onClick={() => setPauseAtKeyPoints(!pauseAtKeyPoints)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300"
              >
                <span className="w-5 text-center">{pauseAtKeyPoints ? '✓' : ' '}</span>
                <span>{t('play.pausePeak', lang)}</span>
              </button>
            )}
            {topic.slug === 'projectile-motion' && (
              <button
                onClick={() => {
                  if (ghostTrails.length === 0) {
                    showToast(t('play.noTrails', lang))
                  } else {
                    clearGhostTrails()
                    showToast(t('play.trailsCleared', lang), '✓')
                  }
                  setMenuOpen(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300"
              >
                <span className="w-5 text-center">✕</span>
                <span>{t('play.clearTrails', lang)}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
