import { create } from 'zustand'
import type { LayerKey } from '@/lib/physics/types'
import type { Lang } from '@/lib/i18n'

type CanvasToolKey = 'ruler' | 'protractor' | 'stopwatch'

interface UIStore {
  activeTab: string
  activeLayers: Record<string, boolean>
  activeTools: Record<CanvasToolKey, boolean>
  panelTab: 'params' | 'data' | 'equations'
  simQuizMode: 'sim' | 'quiz'
  soundEnabled: boolean
  fullscreen: boolean
  mobileDrawerOpen: boolean
  theme: 'light' | 'dark' | 'system'
  reducedMotion: boolean
  showMeHint: string | null
  lang: Lang

  setActiveTab: (tab: string) => void
  toggleLayer: (key: LayerKey) => void
  setActiveLayers: (layers: Record<string, boolean>) => void
  toggleTool: (key: CanvasToolKey) => void
  setPanelTab: (tab: UIStore['panelTab']) => void
  setSimQuizMode: (mode: UIStore['simQuizMode']) => void
  toggleSound: () => void
  toggleFullscreen: () => void
  setMobileDrawerOpen: (open: boolean) => void
  setTheme: (theme: UIStore['theme']) => void
  clearShowMeHint: () => void
  setLang: (lang: Lang) => void
}

export const useUIStore = create<UIStore>((set) => ({
  activeTab: 'intro',
  activeLayers: {
    grid: true,
    trajectory: true,
    velocity: false,
    components: false,
    acceleration: false,
    graph: false,
  },
  activeTools: {
    ruler: false,
    protractor: false,
    stopwatch: false,
  },
  panelTab: 'params',
  simQuizMode: 'sim',
  soundEnabled: false,
  fullscreen: false,
  mobileDrawerOpen: false,
  theme: 'system',
  reducedMotion: false,
  showMeHint: null,
  lang: 'en' as Lang,

  setActiveTab: (activeTab) => set({ activeTab }),
  toggleLayer: (key) =>
    set((s) => ({
      activeLayers: { ...s.activeLayers, [key]: !s.activeLayers[key] },
    })),
  setActiveLayers: (layers) => set({ activeLayers: layers }),
  toggleTool: (key) =>
    set((s) => ({
      activeTools: { ...s.activeTools, [key]: !s.activeTools[key] },
    })),
  setPanelTab: (panelTab) => set({ panelTab }),
  setSimQuizMode: (simQuizMode) => set({ simQuizMode }),
  toggleSound: () =>
    set((s) => {
      const next = !s.soundEnabled
      try { localStorage.setItem('fizzix-sound', next ? '1' : '0') } catch {}
      return { soundEnabled: next }
    }),
  toggleFullscreen: () => set((s) => ({ fullscreen: !s.fullscreen })),
  setMobileDrawerOpen: (mobileDrawerOpen) => set({ mobileDrawerOpen }),
  setTheme: (theme) => set({ theme }),
  clearShowMeHint: () => set({ showMeHint: null }),
  setLang: (lang) => {
    try { localStorage.setItem('fizzix-lang', lang) } catch {}
    set({ lang })
  },
}))
