'use client'

import { useTheme } from '@/hooks/useTheme'

const icons: Record<string, JSX.Element> = {
  light: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="8" r="3" />
      <path d="M8 1.5v1M8 13.5v1M1.5 8h1M13.5 8h1M3.4 3.4l.7.7M11.9 11.9l.7.7M3.4 12.6l.7-.7M11.9 4.1l.7-.7" />
    </svg>
  ),
  dark: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M13.5 8.5a5.5 5.5 0 01-7-7A5.5 5.5 0 1013.5 8.5z" />
    </svg>
  ),
  system: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="3" width="12" height="8" rx="1" />
      <path d="M5 14h6M8 11v3" />
    </svg>
  ),
}

const labels: Record<string, string> = {
  light: 'Light mode',
  dark: 'Dark mode',
  system: 'System theme',
}

export default function ThemeToggle({ className }: { className?: string }) {
  const { choice, cycle } = useTheme()

  return (
    <button
      onClick={cycle}
      className={className}
      aria-label={labels[choice]}
      title={labels[choice]}
    >
      {icons[choice]}
    </button>
  )
}
