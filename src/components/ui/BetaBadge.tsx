'use client'

import { useState, useRef, useEffect } from 'react'

const EMAIL = 'harshchaudhary.tech@gmail.com'

export default function BetaBadge() {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
      const el = document.createElement('textarea')
      el.value = EMAIL
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
        aria-expanded={open}
        aria-label="Beta - click for feedback info"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        Beta
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg p-4 z-50">
          <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Fizzix is in beta
          </p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
            Found a bug or have a suggestion? We&apos;d love to hear from you.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-[11px] bg-gray-100 dark:bg-slate-900 text-gray-700 dark:text-gray-300 px-2.5 py-1.5 rounded border border-gray-200 dark:border-slate-700 truncate">
              {EMAIL}
            </code>
            <button
              onClick={copyEmail}
              className="shrink-0 px-2.5 py-1.5 text-[11px] font-medium rounded border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 transition-colors"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <button
            onClick={() => {
              window.location.href = `mailto:${EMAIL}?subject=Fizzix%20Beta%20Feedback`
            }}
            className="mt-2 w-full text-center text-[11px] font-medium text-fb-accent hover:text-fb-accent-hover transition-colors"
          >
            Open in email app
          </button>
        </div>
      )}
    </div>
  )
}
