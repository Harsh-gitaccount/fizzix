import Link from 'next/link'
import Image from 'next/image'

const NAV = [
  { href: '/guide', label: 'Getting Started' },
  { href: '/guide/teachers', label: 'Teacher Guide' },
  { href: '/guide/topics', label: 'Topic Reference' },
]

export default function GuideLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-fb-page text-fb-ink">
      {/* Guide header */}
      <header className="border-b border-fb-rule/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="Fizzix home">
            <Image
              src="/fizzix-logo.png"
              alt="Fizzix"
              width={90}
              height={26}
              className="h-6 w-auto"
            />
          </Link>
          <nav className="hidden sm:flex items-center gap-6">
            {NAV.map(n => (
              <Link key={n.href} href={n.href} className="text-[13px] text-fb-muted hover:text-fb-ink transition-colors">
                {n.label}
              </Link>
            ))}
          </nav>
          <Link href="/" className="text-[13px] text-fb-accent hover:text-fb-accent-hover transition-colors">
            Back to lab
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14 flex gap-10">
        {/* Sidebar — desktop only */}
        <aside className="hidden lg:block w-48 shrink-0">
          <nav className="sticky top-20 space-y-1" aria-label="Guide navigation">
            {NAV.map(n => (
              <Link
                key={n.href}
                href={n.href}
                className="block text-sm py-1.5 text-fb-muted hover:text-fb-ink transition-colors"
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
          <Image src="/fizzix-logo.png" alt="Fizzix" width={80} height={24} className="h-5 w-auto opacity-50" />
          <p>Free physics lab for Indian students &middot; Class 6&ndash;12</p>
        </div>
      </footer>
    </div>
  )
}
