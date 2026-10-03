import Link from 'next/link'
import Image from 'next/image'
import { getAllModules } from '@/simulations/registry'
import { Header } from './_components/Header'
import { FieldbookStage } from './_components/FieldbookStage'
import { TOPIC_ILLUSTRATIONS } from './_components/TopicIllustrations'

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
      <FieldbookStage topics={topics} serifClass="font-serif" />

      {/* Learning Journey */}
      <section className="py-20 sm:py-24 px-4 sm:px-6 bg-fb-paper">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-mono text-fb-dim tracking-widest uppercase mb-3 text-center">How it works</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-fb-ink mb-4 tracking-tight font-serif">
            Change. Observe. Understand.
          </h2>
          <p className="text-center text-fb-muted text-sm sm:text-base mb-14 max-w-md mx-auto leading-relaxed">
            Every simulation follows the same loop: adjust a parameter, see the result, build intuition that sticks.
          </p>

          <div className="relative">
            {/* connecting line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-fb-rule hidden sm:block" aria-hidden="true" />

            <div className="space-y-12">
              <div className="flex gap-6 items-start">
                <div className="shrink-0 w-12 h-12 rounded-full bg-fb-accent/10 border border-fb-accent/20 flex items-center justify-center relative z-10">
                  <span className="text-lg font-bold text-fb-accent font-serif">1</span>
                </div>
                <div className="pt-2">
                  <h3 className="text-base font-semibold text-fb-ink mb-1">Change a variable</h3>
                  <p className="text-sm text-fb-muted leading-relaxed">
                    Drag a slider to set launch angle, adjust voltage, or shift wavelength. Every parameter has a visible control you can explore.
                  </p>
                </div>
              </div>

              <div className="flex gap-6 items-start">
                <div className="shrink-0 w-12 h-12 rounded-full bg-fb-accent/10 border border-fb-accent/20 flex items-center justify-center relative z-10">
                  <span className="text-lg font-bold text-fb-accent font-serif">2</span>
                </div>
                <div className="pt-2">
                  <h3 className="text-base font-semibold text-fb-ink mb-1">Observe the result</h3>
                  <p className="text-sm text-fb-muted leading-relaxed">
                    The simulation updates instantly. Trajectories redraw, fields reshape, and readings change as you watch.
                  </p>
                </div>
              </div>

              <div className="flex gap-6 items-start">
                <div className="shrink-0 w-12 h-12 rounded-full bg-fb-accent/10 border border-fb-accent/20 flex items-center justify-center relative z-10">
                  <span className="text-lg font-bold text-fb-accent font-serif">3</span>
                </div>
                <div className="pt-2">
                  <h3 className="text-base font-semibold text-fb-ink mb-1">Understand why</h3>
                  <p className="text-sm text-fb-muted leading-relaxed">
                    Compare your guess to the numbers. Toggle vectors and components. Take a quiz to check your intuition.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fieldbook Chapters */}
      <section id="chapters" className="py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 sm:mb-14">
            <p className="text-xs font-mono text-fb-dim tracking-widest uppercase mb-3">The Fieldbook</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-fb-ink tracking-tight mb-3 font-serif">
              Six chapters of experiments
            </h2>
            <p className="text-sm text-fb-muted max-w-md leading-relaxed">
              Each topic has interactive experiments, guided presets, and quiz questions. Pick one to start exploring.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {topics.map((topic, i) => {
              const Illustration = TOPIC_ILLUSTRATIONS[topic.slug]
              return (
                <Link
                  key={topic.slug}
                  href={`/${topic.slug}`}
                  className="group block rounded-xl overflow-hidden border border-fb-rule hover:border-fb-accent/30 transition-all hover:shadow-lg hover:shadow-fb-accent/5"
                >
                  {/* illustration on dark field */}
                  {Illustration && (
                    <div className="aspect-[5/3] bg-fb-field relative overflow-hidden">
                      <div className="absolute inset-0 transition-transform duration-300 group-hover:scale-[1.03]">
                        <Illustration color={topic.color} />
                      </div>
                      <div className="absolute top-3 left-3">
                        <span className="text-[10px] font-mono text-white/40">
                          Ch.{String(i + 1).padStart(2, '0')}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="p-4 bg-fb-page">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="text-sm font-semibold text-fb-ink group-hover:text-fb-accent transition-colors">
                        {topic.name}
                      </h3>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-fb-paper text-fb-dim border border-fb-rule/60">
                        Class {topic.classRange}
                      </span>
                    </div>
                    <p className="text-xs text-fb-muted leading-relaxed line-clamp-2">
                      {topic.description}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Feature pills */}
      <section className="py-10 px-4 sm:px-6 border-t border-fb-rule/60">
        <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-fb-dim">
          <span>No login required</span>
          <span className="w-px h-3 bg-fb-rule" aria-hidden="true" />
          <span>Hindi &amp; English</span>
          <span className="w-px h-3 bg-fb-rule" aria-hidden="true" />
          <span>Lessons cached offline after first visit</span>
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
              width={90}
              height={26}
              className="h-6 w-auto opacity-70"
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
