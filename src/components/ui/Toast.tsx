'use client'

import { useEffect, useState, useCallback } from 'react'

interface ToastMessage {
  id: number
  text: string
  icon?: string
}

let addToastFn: ((text: string, icon?: string) => void) | null = null
let nextId = 0

export function showToast(text: string, icon?: string) {
  addToastFn?.(text, icon)
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = useCallback((text: string, icon?: string) => {
    const id = nextId++
    setToasts((prev) => [...prev, { id, text, icon }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 2000)
  }, [])

  useEffect(() => {
    addToastFn = addToast
    return () => { addToastFn = null }
  }, [addToast])

  if (toasts.length === 0) return null

  return (
    <div role="status" aria-live="polite" className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2 animate-slide-up"
        >
          {t.icon && <span>{t.icon}</span>}
          {t.text}
        </div>
      ))}
    </div>
  )
}
