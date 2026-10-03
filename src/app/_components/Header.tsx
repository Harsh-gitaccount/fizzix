'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import ThemeToggle from '@/components/ui/ThemeToggle'
import BetaBadge from '@/components/ui/BetaBadge'

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
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-fb-rule/60 dark:border-slate-800">
      <div className="backdrop-blur-xl bg-fb-page/90 dark:bg-slate-950/90 supports-[backdrop-filter]:bg-fb-page/80 dark:supports-[backdrop-filter]:bg-slate-950/80">
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/" className="flex items-center gap-2" aria-label="Fizzix home">
              <Image
                src="/fizzix-logo.png"
                alt="Fizzix"
                width={140}
                height={40}
                className="h-9 w-auto dark:invert"
                priority
              />
            </Link>
            <BetaBadge />
          </div>

          <div className="hidden md:flex items-center gap-7">
            <a href="#chapters" className="text-[13px] text-fb-muted dark:text-gray-400 hover:text-fb-ink dark:hover:text-gray-200 transition-colors">
              Explore
            </a>
            <Link href="/guide/teachers" className="text-[13px] text-fb-muted dark:text-gray-400 hover:text-fb-ink dark:hover:text-gray-200 transition-colors">
              For teachers
            </Link>
            <Link href="/guide" className="text-[13px] text-fb-muted dark:text-gray-400 hover:text-fb-ink dark:hover:text-gray-200 transition-colors">
              Guide
            </Link>
            <ThemeToggle className="w-8 h-8 flex items-center justify-center rounded hover:bg-fb-rule/60 dark:hover:bg-slate-800 text-fb-muted dark:text-gray-400" />
            <a
              href="#experiment"
              className="text-[13px] font-semibold text-white bg-fb-accent hover:bg-fb-accent-hover transition-colors px-4 py-1.5 rounded-full"
            >
              Start experimenting
            </a>
          </div>

          <button
            ref={toggleRef}
            onClick={() => open ? close() : setOpen(true)}
            className="md:hidden w-10 h-10 flex items-center justify-center text-fb-muted dark:text-gray-400"
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
          <div id="mobile-menu" ref={menuRef} className="md:hidden border-t border-fb-rule/60 dark:border-slate-800 px-4 pb-4 pt-2 bg-fb-page dark:bg-slate-950">
            <a href="#experiment" onClick={close} className="block py-2.5 text-sm text-fb-ink dark:text-gray-100 hover:text-fb-accent">
              Start experimenting
            </a>
            <a href="#chapters" onClick={close} className="block py-2.5 text-sm text-fb-muted dark:text-gray-400 hover:text-fb-ink dark:hover:text-gray-200">
              Explore topics
            </a>
            <Link href="/guide/teachers" onClick={close} className="block py-2.5 text-sm text-fb-muted dark:text-gray-400 hover:text-fb-ink dark:hover:text-gray-200">
              For teachers
            </Link>
            <Link href="/guide" onClick={close} className="block py-2.5 text-sm text-fb-muted dark:text-gray-400 hover:text-fb-ink dark:hover:text-gray-200">
              Guide
            </Link>
            <div className="mt-3 pt-3 border-t border-fb-rule/60 dark:border-slate-800">
              <div className="text-[10px] font-bold text-fb-dim dark:text-gray-500 uppercase tracking-[0.15em] mb-1">Subjects</div>
              {modules.map(mod => (
                <Link key={mod.slug} href={`/${mod.slug}`} onClick={close} className="block py-2 text-sm text-fb-muted dark:text-gray-400 hover:text-fb-ink dark:hover:text-gray-200">
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
