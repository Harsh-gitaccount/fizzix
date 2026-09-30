'use client'

import { useEffect } from 'react'

export function useServiceWorker() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    if (process.env.NODE_ENV === 'development') {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => r.unregister())
      })
      caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)))
      return
    }

    navigator.serviceWorker.register('/sw.js').catch(() => {})
  }, [])
}
