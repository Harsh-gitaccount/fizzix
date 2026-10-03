'use client'

import { useState, useEffect, useCallback } from 'react'
import { getStoredTheme, setStoredTheme, resolveIsDark, applyThemeClass } from '@/lib/theme'

export function useTheme() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const stored = getStoredTheme()
    const dark = resolveIsDark(stored)
    setIsDark(dark)
    applyThemeClass(dark)
  }, [])

  const toggle = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev
      setStoredTheme(next ? 'dark' : 'light')
      applyThemeClass(next)
      return next
    })
  }, [])

  return { isDark, toggle }
}
