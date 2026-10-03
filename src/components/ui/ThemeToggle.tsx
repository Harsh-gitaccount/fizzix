'use client'

import { useTheme } from '@/hooks/useTheme'

const sunIcon = (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="8" cy="8" r="3" />
    <path d="M8 1.5v1M8 13.5v1M1.5 8h1M13.5 8h1M3.4 3.4l.7.7M11.9 11.9l.7.7M3.4 12.6l.7-.7M11.9 4.1l.7-.7" />
  </svg>
)

const moonIcon = (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M13.5 8.5a5.5 5.5 0 01-7-7A5.5 5.5 0 1013.5 8.5z" />
  </svg>
)

export default function ThemeToggle({ className }: { className?: string }) {
  const { isDark, toggle } = useTheme()

  return (
    <button
      onClick={toggle}
      className={className}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? sunIcon : moonIcon}
    </button>
  )
}
