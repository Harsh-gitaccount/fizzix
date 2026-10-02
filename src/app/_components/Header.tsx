'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { AtomMark } from './AtomMark'

interface HeaderModule {
  slug: string
  name: string
}

export function Header({ modules }: { modules: HeaderModule[] }) {
  const [open, setOpen] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => {
    setOpen(false)
    toggleRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!open) return
    const first = menuRef.current?.querySelector<HTMLElement>('a, button')
    first?.focus()

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { e.preventDefault(); close() }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, close])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06]">
      <div className="backdrop-blur-xl bg-[#0C1222]/85 supports-[backdrop-filter]:bg-[#0C1222]/70">
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 shrink-0" aria-label="Fizzix home">
            <AtomMark size={26} />
            <span className="text-[15px] font-bold text-white tracking-tight">Fizzix</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-[13px] text-slate-400 hover:text-white transition-colors">
              How it works
            </a>
            <a href="#atlas" className="text-[13px] text-slate-400 hover:text-white transition-colors">
              Explore
            </a>
            <a
              href="#atlas"
              className="text-[13px] font-semibold text-atlas-accent hover:text-atlas-accent-light transition-colors px-4 py-1.5 rounded-full border border-atlas-accent/30 hover:border-atlas-accent/50"
            >
              Enter the lab
            </a>
          </div>

          <button
            ref={toggleRef}
            onClick={() => open ? close() : setOpen(true)}
            className="md:hidden w-10 h-10 flex items-center justify-center text-slate-300"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {open ? (
                <><path d="M4 4l10 10" /><path d="M14 4L4 14" /></>
              ) : (
                <><path d="M2 4h14" /><path d="M2 9h14" /><path d="M2 14h14" /></>
              )}
            </svg>
          </button>
        </nav>

        {open && (
          <div id="mobile-menu" ref={menuRef} className="md:hidden border-t border-white/[0.06] px-4 pb-4 pt-2">
            <a href="#how-it-works" onClick={close} className="block py-2.5 text-sm text-slate-300 hover:text-white">
              How it works
            </a>
            <a href="#atlas" onClick={close} className="block py-2.5 text-sm text-slate-300 hover:text-white">
              Explore all topics
            </a>
            <div className="mt-3 pt-3 border-t border-white/[0.06]">
              <div className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.15em] mb-1">Subjects</div>
              {modules.map(mod => (
                <Link key={mod.slug} href={`/${mod.slug}`} onClick={close} className="block py-2 text-sm text-slate-400 hover:text-white">
                  {mod.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
