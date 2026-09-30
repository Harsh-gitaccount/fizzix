'use client'

import { useEffect, useState } from 'react'

export default function BrowserCheck({ children }: { children: React.ReactNode }) {
  const [supported, setSupported] = useState<boolean | null>(null)

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const ok = !!ctx && typeof requestAnimationFrame === 'function'
      setSupported(ok)
    } catch {
      setSupported(false)
    }
  }, [])

  if (supported === null) return null
  if (supported) return <>{children}</>

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gray-50 p-8">
      <div className="max-w-md text-center">
        <div className="text-5xl mb-4">&#x269B;</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Browser Not Supported</h1>
        <p className="text-sm text-gray-600 mb-4">
          Fizzix requires a modern browser with Canvas support. Please update your browser or try Chrome, Firefox, Safari, or Edge.
        </p>
        <p className="text-xs text-gray-400">
          Minimum: Chrome 80+, Firefox 78+, Safari 14+, Edge 80+
        </p>
      </div>
    </div>
  )
}
