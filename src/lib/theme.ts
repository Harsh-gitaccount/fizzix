export type ThemeChoice = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'fizzix-theme'

export function getStoredTheme(): ThemeChoice {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'light' || v === 'dark') return v
  } catch {}
  return 'system'
}

export function setStoredTheme(choice: ThemeChoice) {
  try {
    if (choice === 'system') localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, choice)
  } catch {}
}

export function resolveIsDark(choice: ThemeChoice): boolean {
  if (choice === 'dark') return true
  if (choice === 'light') return false
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function applyThemeClass(isDark: boolean) {
  const el = document.documentElement
  if (isDark) el.classList.add('dark')
  else el.classList.remove('dark')
}
