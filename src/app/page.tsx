import { Source_Serif_4 } from 'next/font/google'
import { getAllModules } from '@/simulations/registry'
import { Header } from './_components/Header'
import { HeroExperiment } from './_components/HeroExperiment'
import { AtlasIndex } from './_components/AtlasIndex'
import { AtomMark } from './_components/AtomMark'

const serif = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  display: 'swap',
  variable: '--font-serif',
})

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
    <div className={`min-h-screen bg-atlas-bg text-slate-200 selection:bg-atlas-accent/30 ${serif.variable}`}>
      <Header modules={headerModules} />

      {/* Hero */}
      <section className="pt-20 sm:pt-24 pb-16 sm:pb-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-10 lg:gap-14 items-start">
            {/* text column */}
            <div className="pt-4 lg:pt-10">
              <h1 className="mb-5">
                <span className={`block text-4xl sm:text-5xl lg:text-[3.5rem] font-black text-white leading-[1.1] tracking-tight ${serif.className}`}>
                  Physics,
                </span>
                <span className={`block text-4xl sm:text-5xl lg:text-[3.5rem] font-normal text-atlas-accent leading-[1.1] tracking-tight mt-1 ${serif.className}`}>
                  in your hands.
                </span>
              </h1>
              <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-md mb-6">
                Free interactive simulations for Class 6&ndash;12. Change a variable, watch what happens, understand why.
              </p>
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <a
                  href="#atlas"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-atlas-accent hover:bg-atlas-accent-light transition-colors px-5 py-2.5 rounded-lg"
                >
                  Explore topics
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M7 2v10M3 8l4 4 4-4" />
                  </svg>
                </a>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span>No login required</span>
                <span className="w-px h-3 bg-slate-700" aria-hidden="true" />
                <span>Hindi &amp; English</span>
                <span className="w-px h-3 bg-slate-700" aria-hidden="true" />
                <span>Lessons cached offline after first visit</span>
              </div>
            </div>

            {/* experiment column */}
            <div className="min-w-0">
              <HeroExperiment />
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-16 sm:py-20 px-4 sm:px-6 bg-[#FAF6F0]">
        <div className="max-w-4xl mx-auto">
          <h2 className={`text-2xl sm:text-3xl font-bold text-center text-[#2D1810] mb-4 tracking-tight ${serif.className}`}>
            Change. Observe. Understand.
          </h2>
          <p className="text-center text-[#5C4A3A] text-sm sm:text-base mb-12 max-w-lg mx-auto leading-relaxed">
            Every simulation follows the same loop: adjust a parameter, see the result in real time, build intuition that sticks.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#E8740C]/10 border border-[#E8740C]/20 mb-4">
                <span className="text-lg font-bold text-[#E8740C]">1</span>
              </div>
              <h3 className="text-sm font-bold text-[#2D1810] mb-2">Change a variable</h3>
              <p className="text-sm text-[#6B5B4E] leading-relaxed">
                Drag a slider to set launch angle, adjust voltage, or shift wavelength. Every parameter has a visible control.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#E8740C]/10 border border-[#E8740C]/20 mb-4">
                <span className="text-lg font-bold text-[#E8740C]">2</span>
              </div>
              <h3 className="text-sm font-bold text-[#2D1810] mb-2">Observe the result</h3>
              <p className="text-sm text-[#6B5B4E] leading-relaxed">
                The simulation updates instantly. Trajectories redraw, fields reshape, readings change as you watch.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#E8740C]/10 border border-[#E8740C]/20 mb-4">
                <span className="text-lg font-bold text-[#E8740C]">3</span>
              </div>
              <h3 className="text-sm font-bold text-[#2D1810] mb-2">Understand why</h3>
              <p className="text-sm text-[#6B5B4E] leading-relaxed">
                Compare your guess to the numbers. Toggle vectors and components. Take a quiz to check your intuition.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Atlas Index */}
      <section id="atlas" className="py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className={`text-2xl sm:text-3xl font-bold text-white tracking-tight mb-3 ${serif.className}`}>
              The Lab
            </h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Six topics, each with interactive experiments, guided presets, and quiz questions. Pick one to start.
            </p>
          </div>

          <AtlasIndex topics={topics} />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 sm:px-6 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <AtomMark size={24} />
            <span className="text-sm font-bold text-slate-300 tracking-tight">Fizzix</span>
          </div>
          <p className="text-xs text-slate-500">
            Free physics lab for Indian students &middot; Class 6&ndash;12
          </p>
        </div>
      </footer>
    </div>
  )
}
