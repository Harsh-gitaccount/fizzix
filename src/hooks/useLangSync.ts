'use client'

import { useEffect } from 'react'
import { useUIStore } from '@/store/uiStore'

export function useLangSync() {
  useEffect(() => {
    try {
      const storedLang = localStorage.getItem('fizzix-lang')
      if (storedLang === 'hi') {
        useUIStore.getState().setLang('hi')
      }
    } catch {}
    try {
      const storedSound = localStorage.getItem('fizzix-sound')
      if (storedSound === '1') {
        useUIStore.setState({ soundEnabled: true })
      }
    } catch {}
  }, [])
}
