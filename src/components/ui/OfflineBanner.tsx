'use client'

import { useState, useEffect } from 'react'
import { useUIStore } from '@/store/uiStore'
import { t } from '@/lib/i18n'

export default function OfflineBanner() {
  const [online, setOnline] = useState(true)
  const lang = useUIStore((s) => s.lang)

  useEffect(() => {
    setOnline(navigator.onLine)
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  if (online) return null

  return (
    <div className="flex items-center justify-center gap-2 px-4 py-1.5 bg-amber-500 text-white text-xs font-semibold" role="alert">
      <span>⚠</span>
      <span>{t('offline.banner', lang)}</span>
    </div>
  )
}
