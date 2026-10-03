'use client'

import { useState, useEffect, useCallback } from 'react'
import { type ThemeChoice, getStoredTheme, setStoredTheme, resolveIsDark, applyThemeClass } from '@/lib/theme'

export function useTheme() {
  const [choice, setChoice] = useState<ThemeChoice>('system')

  useEffect(() => {
    setChoice(getStoredTheme())
  }, [])

  useEffect(() => {
    applyThemeClass(resolveIsDark(choice))

    if (choice === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = () => applyThemeClass(mq.matches)
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
  }, [choice])

  const cycle = useCallback(() => {
    setChoice((prev) => {
      const next: ThemeChoice = prev === 'system' ? 'dark' : prev === 'dark' ? 'light' : 'system'
      setStoredTheme(next)
      return next
    })
  }, [])

  return { choice, cycle }
}
