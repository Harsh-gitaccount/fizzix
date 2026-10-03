'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useUIStore } from '@/store/uiStore'
import { useSimulationStore } from '@/store/simulationStore'
import { useTopic } from '@/simulations/TopicContext'
import { captureScreenshot, copyShareURL } from '@/lib/share'
import { t } from '@/lib/i18n'
import { trackEvent } from '@/lib/analytics'
import ThemeToggle from '@/components/ui/ThemeToggle'
import BetaBadge from '@/components/ui/BetaBadge'
import { useTheme } from '@/hooks/useTheme'

export default function TopBar() {
  const topic = useTopic()
  const simQuizMode = useUIStore((s) => s.simQuizMode)
  const setSimQuizMode = useUIStore((s) => s.setSimQuizMode)
  const showMeHint = useUIStore((s) => s.showMeHint)
  const clearShowMeHint = useUIStore((s) => s.clearShowMeHint)
  const soundEnabled = useUIStore((s) => s.soundEnabled)
  const activeTab = useUIStore((s) => s.activeTab)
  const lang = useUIStore((s) => s.lang)
  const setLang = useUIStore((s) => s.setLang)
  const params = useSimulationStore((s) => s.params)
  const setCompareMode = useSimulationStore((s) => s.setCompareMode)
  const clearGhostTrails = useSimulationStore((s) => s.clearGhostTrails)
  const { isDark, toggle: toggleTheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

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

  const cleanupShowMe = () => {
    if (showMeHint) {
      clearShowMeHint()
      setCompareMode(false)
      clearGhostTrails()
    }
  }

  const handleScreenshot = () => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null
    captureScreenshot(canvas, soundEnabled)
    trackEvent('Screenshot', { topic: topic.slug })
    setMenuOpen(false)
  }

  const handleShare = () => {
    copyShareURL(params, activeTab)
    trackEvent('Share Link', { topic: topic.slug })
    setMenuOpen(false)
  }

  const handleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      document.documentElement.requestFullscreen()
    }
    setMenuOpen(false)
  }

  const handleLangToggle = () => {
    setLang(lang === 'en' ? 'hi' : 'en')
    setMenuOpen(false)
  }

  const iconBtn = 'w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-gray-400'
  const menuItem = 'w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300'

  return (
    <div className="flex items-center justify-between px-3 md:px-4 h-12 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 shrink-0">
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        <Link href="/" className="text-lg hover:opacity-75 transition-opacity shrink-0" title="Home">
          &#x269B;
        </Link>
        <h1 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
          {t('topic.' + topic.slug, lang)}
        </h1>
      </div>
      <div className="flex items-center gap-1 md:gap-2 shrink-0">
        {/* Sim / Quiz toggle */}
        <div className="flex bg-gray-100 dark:bg-slate-800 rounded-lg p-0.5" role="tablist">
          <button
            role="tab"
            aria-selected={simQuizMode === 'sim'}
            onClick={() => { cleanupShowMe(); setSimQuizMode('sim') }}
            className={`px-2 md:px-3 py-1 text-[11px] font-bold rounded-md transition-colors ${
              simQuizMode === 'sim'
                ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {t('mode.sim', lang)}
          </button>
          <button
            role="tab"
            aria-selected={simQuizMode === 'quiz'}
            onClick={() => { cleanupShowMe(); setSimQuizMode('quiz') }}
            className={`px-2 md:px-3 py-1 text-[11px] font-bold rounded-md transition-colors ${
              simQuizMode === 'quiz'
                ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {t('mode.quiz', lang)}
          </button>
        </div>

        {/* Desktop: inline action buttons */}
        <div className="hidden md:flex items-center gap-2">
          <div className="w-px h-5 bg-gray-200 dark:bg-slate-700" />
          <button onClick={handleScreenshot} className={iconBtn} aria-label="Screenshot" title="Screenshot">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="4" width="12" height="9" rx="1.5" />
              <circle cx="8" cy="8.5" r="2.5" />
              <path d="M5.5 4V3a.5.5 0 01.5-.5h4a.5.5 0 01.5.5v1" />
            </svg>
          </button>
          <button onClick={handleShare} className={iconBtn} aria-label="Copy share link" title="Share">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 9.5l4-3M10 3.5a2 2 0 110 4 2 2 0 010-4zM6 8.5a2 2 0 110 4 2 2 0 010-4z" />
            </svg>
          </button>
          <button onClick={handleFullscreen} className={iconBtn} aria-label="Fullscreen" title="Fullscreen (F11)">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 6V3a1 1 0 011-1h3M10 2h3a1 1 0 011 1v3M14 10v3a1 1 0 01-1 1h-3M6 14H3a1 1 0 01-1-1v-3" />
            </svg>
          </button>
          <button
            onClick={handleLangToggle}
            className="px-2 py-1 text-[11px] font-bold rounded border border-gray-200 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-400"
            title={lang === 'en' ? 'हिंदी में बदलें' : 'Switch to English'}
            aria-label={lang === 'en' ? 'Switch to Hindi' : 'Switch to English'}
          >
            {lang === 'en' ? 'हिं' : 'En'}
          </button>
          <ThemeToggle className={iconBtn} />
        </div>

        {/* Mobile: overflow menu for secondary actions */}
        <div className="relative md:hidden" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={iconBtn}
            aria-label="More actions"
            aria-expanded={menuOpen}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="8" cy="3" r="1.5" />
              <circle cx="8" cy="8" r="1.5" />
              <circle cx="8" cy="13" r="1.5" />
            </svg>
          </button>
          {menuOpen && (
            <div className="absolute top-full right-0 mt-1 w-52 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg py-1 z-50">
              <button onClick={handleScreenshot} className={menuItem}>
                <span className="w-5 text-center">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="inline-block">
                    <rect x="2" y="4" width="12" height="9" rx="1.5" />
                    <circle cx="8" cy="8.5" r="2.5" />
                    <path d="M5.5 4V3a.5.5 0 01.5-.5h4a.5.5 0 01.5.5v1" />
                  </svg>
                </span>
                <span>Screenshot</span>
              </button>
              <button onClick={handleShare} className={menuItem}>
                <span className="w-5 text-center">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="inline-block">
                    <path d="M6 9.5l4-3M10 3.5a2 2 0 110 4 2 2 0 010-4zM6 8.5a2 2 0 110 4 2 2 0 010-4z" />
                  </svg>
                </span>
                <span>Share</span>
              </button>
              <button onClick={handleFullscreen} className={menuItem}>
                <span className="w-5 text-center">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="inline-block">
                    <path d="M2 6V3a1 1 0 011-1h3M10 2h3a1 1 0 011 1v3M14 10v3a1 1 0 01-1 1h-3M6 14H3a1 1 0 01-1-1v-3" />
                  </svg>
                </span>
                <span>Fullscreen</span>
              </button>
              <button onClick={handleLangToggle} className={menuItem}>
                <span className="w-5 text-center font-bold text-[11px]">{lang === 'en' ? 'हिं' : 'En'}</span>
                <span>{lang === 'en' ? 'हिंदी में बदलें' : 'Switch to English'}</span>
              </button>
              <button onClick={() => { toggleTheme(); setMenuOpen(false) }} className={menuItem}>
                <span className="w-5 text-center">
                  {isDark ? (
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="inline-block">
                      <circle cx="8" cy="8" r="3" />
                      <path d="M8 1.5v1M8 13.5v1M1.5 8h1M13.5 8h1M3.4 3.4l.7.7M11.9 11.9l.7.7M3.4 12.6l.7-.7M11.9 4.1l.7-.7" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="inline-block">
                      <path d="M13.5 8.5a5.5 5.5 0 01-7-7A5.5 5.5 0 1013.5 8.5z" />
                    </svg>
                  )}
                </span>
                <span>{isDark ? 'Light mode' : 'Dark mode'}</span>
              </button>
            </div>
          )}
        </div>

        <BetaBadge />
      </div>
    </div>
  )
}
