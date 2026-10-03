import Link from 'next/link'
import Image from 'next/image'
import { getAllModules } from '@/simulations/registry'
import { Header } from './_components/Header'
import { FieldbookStage } from './_components/FieldbookStage'
import { ChapterExplorer } from './_components/ChapterExplorer'
import { DiscoverySection } from './_components/DiscoverySection'

export default function Home() {
  const modules = getAllModules()

  const headerModules = modules.map(m => ({ slug: m.slug, name: m.name }))

  const topics = modules.map(m => ({
    slug: m.slug,
    name: m.name,
    description: m.description,
    classRange: m.classRange,
    color: m.color,
  }))

  return (
    <div className="min-h-screen bg-fb-page text-fb-ink selection:bg-fb-accent/20">
      <Header modules={headerModules} />

      {/* Experiment Stage */}
      <FieldbookStage serifClass="font-serif" />

      {/* Discovery: complementary angle symmetry */}
      <DiscoverySection />

      {/* Fieldbook Chapters */}
      <ChapterExplorer topics={topics} />

      {/* Feature pills */}
      <section className="py-10 px-4 sm:px-6 border-t border-fb-rule/60">
        <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-fb-dim">
          <span>No login required</span>
          <span className="w-px h-3 bg-fb-rule" aria-hidden="true" />
          <span>Hindi &amp; English</span>
          <span className="w-px h-3 bg-fb-rule" aria-hidden="true" />
          <span>Works offline after first visit</span>
          <span className="w-px h-3 bg-fb-rule" aria-hidden="true" />
          <span>Free forever</span>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 sm:px-6 border-t border-fb-rule/60">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image
              src="/fizzix-logo.png"
              alt="Fizzix"
              width={120}
              height={34}
              className="h-7 w-auto opacity-70"
            />
          </div>
          <div className="flex items-center gap-4 text-xs text-fb-dim">
            <Link href="/guide" className="hover:text-fb-ink transition-colors">Guide</Link>
            <Link href="/guide/teachers" className="hover:text-fb-ink transition-colors">For teachers</Link>
            <Link href="/guide/topics" className="hover:text-fb-ink transition-colors">Topic reference</Link>
          </div>
          <p className="text-xs text-fb-dim">
            Free physics lab for Indian students &middot; Class 6&ndash;12
          </p>
        </div>
      </footer>
    </div>
  )
}
