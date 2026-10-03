'use client'

import { useState, useEffect } from 'react'

const STORAGE_KEY = 'fizzix-mobile-hint-dismissed'

export default function MobileHint() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (window.innerWidth < 640 && !localStorage.getItem(STORAGE_KEY)) {
        setVisible(true)
      }
    } catch {}
  }, [])

  if (!visible) return null

  const dismiss = () => {
    setVisible(false)
    try { localStorage.setItem(STORAGE_KEY, '1') } catch {}
  }

  return (
    <div className="sm:hidden flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0">
        <rect x="4" y="1" width="8" height="14" rx="1.5" />
        <path d="M7 12h2" />
      </svg>
      <p className="flex-1">For the best experience, use a desktop or laptop.</p>
      <button
        onClick={dismiss}
        className="shrink-0 w-5 h-5 flex items-center justify-center rounded hover:bg-amber-200/50 dark:hover:bg-amber-800/50"
        aria-label="Dismiss"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 2l6 6M8 2l-6 6" />
        </svg>
      </button>
    </div>
  )
}
