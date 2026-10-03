'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/guide', label: 'Getting Started' },
  { href: '/guide/teachers', label: 'Teacher Guide' },
  { href: '/guide/topics', label: 'Topic Reference' },
]

export default function GuideLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileNav, setMobileNav] = useState(false)

  return (
    <div className="min-h-screen bg-fb-page text-fb-ink">
      {/* Guide header */}
      <header className="border-b border-fb-rule/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="Fizzix home">
            <Image
              src="/fizzix-logo.png"
              alt="Fizzix"
              width={120}
              height={34}
              className="h-8 w-auto"
            />
          </Link>
          <nav className="hidden sm:flex items-center gap-6" aria-label="Guide pages">
            {NAV.map(n => (
              <Link
                key={n.href}
                href={n.href}
                className={`text-[13px] transition-colors ${
                  pathname === n.href
                    ? 'text-fb-accent font-semibold'
                    : 'text-fb-muted hover:text-fb-ink'
                }`}
                aria-current={pathname === n.href ? 'page' : undefined}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-[13px] text-fb-accent hover:text-fb-accent-hover transition-colors hidden sm:block">
              Back to lab
            </Link>
            {/* Mobile nav toggle */}
            <button
              onClick={() => setMobileNav(!mobileNav)}
              className="sm:hidden w-9 h-9 flex items-center justify-center text-fb-muted"
              aria-label={mobileNav ? 'Close guide menu' : 'Open guide menu'}
              aria-expanded={mobileNav}
              aria-controls="guide-mobile-nav"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {mobileNav ? (
                  <><path d="M4 4l10 10" /><path d="M14 4L4 14" /></>
                ) : (
                  <><path d="M2 4h14" /><path d="M2 9h14" /><path d="M2 14h14" /></>
                )}
              </svg>
            </button>
          </div>
        </div>
        {/* Mobile guide nav */}
        {mobileNav && (
          <nav id="guide-mobile-nav" className="sm:hidden border-t border-fb-rule/60 px-4 py-2 bg-fb-page" aria-label="Guide pages">
            {NAV.map(n => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setMobileNav(false)}
                className={`block py-2 text-sm transition-colors ${
                  pathname === n.href
                    ? 'text-fb-accent font-semibold'
                    : 'text-fb-muted hover:text-fb-ink'
                }`}
                aria-current={pathname === n.href ? 'page' : undefined}
              >
                {n.label}
              </Link>
            ))}
            <Link
              href="/"
              onClick={() => setMobileNav(false)}
              className="block py-2 text-sm text-fb-accent hover:text-fb-accent-hover"
            >
              Back to lab
            </Link>
          </nav>
        )}
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14 flex gap-10">
        {/* Sidebar (desktop only) */}
        <aside className="hidden lg:block w-48 shrink-0">
          <nav className="sticky top-20 space-y-1" aria-label="Guide navigation">
            {NAV.map(n => (
              <Link
                key={n.href}
                href={n.href}
                className={`block text-sm py-1.5 transition-colors ${
                  pathname === n.href
                    ? 'text-fb-accent font-semibold'
                    : 'text-fb-muted hover:text-fb-ink'
                }`}
                aria-current={pathname === n.href ? 'page' : undefined}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="min-w-0 flex-1 guide-prose">
          {children}
        </main>
      </div>

      {/* Guide footer */}
      <footer className="border-t border-fb-rule/60 py-8 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-fb-dim">
          <Image src="/fizzix-logo.png" alt="Fizzix" width={100} height={28} className="h-6 w-auto opacity-50" />
          <p>Free physics lab for Indian students &middot; Class 6&ndash;12</p>
        </div>
      </footer>
    </div>
  )
}
