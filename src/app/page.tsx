import Link from 'next/link'
import { getAllModules } from '@/simulations/registry'

function ProjectileIllustration({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 240 160" className="w-full h-full max-h-[160px]" aria-hidden="true">
      <defs>
        <radialGradient id="pm-glow" cx="50%" cy="30%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.12" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="240" height="160" fill="url(#pm-glow)" />
      <line x1="15" y1="140" x2="225" y2="140" stroke="white" strokeWidth="0.5" opacity="0.06" />
      <line x1="25" y1="10" x2="25" y2="140" stroke="white" strokeWidth="0.5" opacity="0.06" />
      <path d="M 30,135 Q 120,0 210,135" fill="none" stroke={color} strokeWidth="1" opacity="0.15" strokeDasharray="4 4" />
      <path d="M 30,135 Q 120,0 210,135" fill={`${color}06`} stroke="none" />
      {[0, 0.15, 0.3, 0.5, 0.7, 0.85, 1].map((t, i) => {
        const x = 30 + t * 180
        const y = 135 - 4 * 135 * t * (1 - t)
        return <circle key={i} cx={x} cy={y} r="1.5" fill={color} opacity={0.2 + t * 0.1} />
      })}
      <circle cx="120" cy="18" r="7" fill={color} opacity="0.85" className="atlas-float" />
      <circle cx="120" cy="18" r="12" fill={color} opacity="0.08" className="atlas-float" />
      <line x1="128" y1="18" x2="158" y2="18" stroke={color} strokeWidth="1.5" opacity="0.5" />
      <polygon points="158,15 165,18 158,21" fill={color} opacity="0.5" />
      <line x1="120" y1="28" x2="120" y2="50" stroke="white" strokeWidth="0.7" opacity="0.12" strokeDasharray="2 2" />
      <text x="126" y="44" fill="white" fontSize="9" fontFamily="var(--font-geist-mono, monospace)" opacity="0.15">g</text>
    </svg>
  )
}

function SHMIllustration({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 240 160" className="w-full h-full max-h-[160px]" aria-hidden="true">
      <defs>
        <radialGradient id="shm-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.1" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="240" height="160" fill="url(#shm-glow)" />
      <line x1="10" y1="80" x2="230" y2="80" stroke="white" strokeWidth="0.5" opacity="0.06" />
      <path
        d="M 10,80 C 32,20 55,20 77,80 C 99,140 122,140 144,80 C 166,20 188,20 210,80"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        opacity="0.5"
        strokeLinecap="round"
      />
      <path
        d="M 10,80 C 32,20 55,20 77,80 C 99,140 122,140 144,80 C 166,20 188,20 210,80 L 210,160 L 10,160 Z"
        fill={color}
        opacity="0.03"
      />
      <line x1="77" y1="30" x2="77" y2="130" stroke={color} strokeWidth="0.5" opacity="0.1" strokeDasharray="3 3" />
      <text x="80" y="28" fill={color} fontSize="8" fontFamily="var(--font-geist-mono, monospace)" opacity="0.25">A</text>
      <circle cx="10" cy="80" r="6" fill={color} opacity="0.8" className="atlas-pulse" />
      <circle cx="10" cy="80" r="10" fill={color} opacity="0.1" className="atlas-pulse" />
      <text x="215" y="78" fill="white" fontSize="8" fontFamily="var(--font-geist-mono, monospace)" opacity="0.12">t</text>
    </svg>
  )
}

function ElectrostaticsIllustration({ color }: { color: string }) {
  const lines = [
    'M 78,75 Q 120,50 162,75',
    'M 78,75 Q 120,100 162,75',
    'M 75,65 Q 115,30 165,65',
    'M 75,85 Q 115,120 165,85',
    'M 72,55 Q 105,15 168,55',
    'M 72,95 Q 105,135 168,95',
    'M 70,45 Q 100,5 170,48',
    'M 70,105 Q 100,145 170,102',
  ]
  return (
    <svg viewBox="0 0 240 160" className="w-full h-full max-h-[160px]" aria-hidden="true">
      <defs>
        <radialGradient id="es-glow-pos" cx="30%" cy="50%" r="35%">
          <stop offset="0%" stopColor={color} stopOpacity="0.12" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="es-glow-neg" cx="70%" cy="50%" r="35%">
          <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#60A5FA" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="240" height="160" fill="url(#es-glow-pos)" />
      <rect width="240" height="160" fill="url(#es-glow-neg)" />
      {lines.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke={color}
          strokeWidth="1"
          opacity={0.15 + (i % 3) * 0.08}
          className="atlas-ray"
        />
      ))}
      <circle cx="68" cy="75" r="16" fill={color} opacity="0.12" />
      <circle cx="68" cy="75" r="12" fill="none" stroke={color} strokeWidth="1.5" opacity="0.5" />
      <text x="63" y="80" fill={color} fontSize="16" fontWeight="bold" opacity="0.7">+</text>
      <circle cx="172" cy="75" r="16" fill="#60A5FA" opacity="0.08" />
      <circle cx="172" cy="75" r="12" fill="none" stroke="#60A5FA" strokeWidth="1.5" opacity="0.5" />
      <text x="166" y="81" fill="#60A5FA" fontSize="18" fontWeight="bold" opacity="0.6">&minus;</text>
      <circle cx="68" cy="75" r="4" fill={color} opacity="0.6" className="atlas-pulse" />
    </svg>
  )
}

function OpticsIllustration({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 240 160" className="w-full h-full max-h-[160px]" aria-hidden="true">
      <defs>
        <radialGradient id="opt-glow" cx="65%" cy="50%" r="45%">
          <stop offset="0%" stopColor={color} stopOpacity="0.1" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="opt-lens" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="white" stopOpacity="0.06" />
          <stop offset="50%" stopColor="white" stopOpacity="0.12" />
          <stop offset="100%" stopColor="white" stopOpacity="0.06" />
        </linearGradient>
      </defs>
      <rect width="240" height="160" fill="url(#opt-glow)" />
      <line x1="10" y1="80" x2="230" y2="80" stroke="white" strokeWidth="0.4" opacity="0.06" strokeDasharray="4 4" />
      {/* Lens shape */}
      <path d="M 115,28 Q 126,80 115,132 Q 104,80 115,28 Z" fill="url(#opt-lens)" stroke="white" strokeWidth="1.2" opacity="0.25" />
      {/* Incoming parallel rays */}
      {[45, 80, 115].map((y, i) => (
        <g key={i}>
          <line x1="15" y1={y} x2="110" y2={y} stroke={color} strokeWidth="1.5" opacity={0.35 + i * 0.1} strokeLinecap="round" />
          <line x1="120" y1={y} x2="185" y2={80} stroke={color} strokeWidth="1.5" opacity={0.35 + i * 0.1} strokeLinecap="round" />
        </g>
      ))}
      <circle cx="185" cy="80" r="5" fill={color} opacity="0.7" className="atlas-pulse" />
      <circle cx="185" cy="80" r="11" fill={color} opacity="0.06" />
      <text x="181" y="100" fill="white" fontSize="9" fontFamily="var(--font-geist-mono, monospace)" opacity="0.18">f</text>
    </svg>
  )
}

function ThermodynamicsIllustration({ color }: { color: string }) {
  const particles = [
    { cx: 55, cy: 40, r: 4, dx: 8, dy: -5, anim: 'atlas-particle-1' },
    { cx: 140, cy: 50, r: 3.5, dx: -6, dy: 7, anim: 'atlas-particle-2' },
    { cx: 90, cy: 95, r: 4.5, dx: 7, dy: -4, anim: 'atlas-particle-3' },
    { cx: 170, cy: 35, r: 3, dx: -5, dy: -7, anim: 'atlas-particle-1' },
    { cx: 50, cy: 110, r: 3.5, dx: 6, dy: 5, anim: 'atlas-particle-2' },
    { cx: 150, cy: 105, r: 4, dx: -7, dy: -3, anim: 'atlas-particle-3' },
    { cx: 100, cy: 55, r: 3, dx: 4, dy: 8, anim: 'atlas-particle-1' },
    { cx: 180, cy: 80, r: 3.5, dx: -4, dy: -6, anim: 'atlas-particle-2' },
    { cx: 70, cy: 75, r: 4, dx: -6, dy: 4, anim: 'atlas-particle-3' },
    { cx: 125, cy: 80, r: 3, dx: 5, dy: -5, anim: 'atlas-particle-1' },
    { cx: 160, cy: 65, r: 3.5, dx: -3, dy: 6, anim: 'atlas-particle-2' },
    { cx: 80, cy: 45, r: 2.5, dx: 7, dy: 3, anim: 'atlas-particle-3' },
  ]
  return (
    <svg viewBox="0 0 240 160" className="w-full h-full max-h-[160px]" aria-hidden="true">
      <defs>
        <radialGradient id="thermo-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.08" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="240" height="160" fill="url(#thermo-glow)" />
      <rect x="30" y="15" width="180" height="130" rx="6" fill="none" stroke="white" strokeWidth="1" opacity="0.08" />
      {particles.map((p, i) => (
        <g key={i} className={p.anim}>
          <line
            x1={p.cx}
            y1={p.cy}
            x2={p.cx + p.dx}
            y2={p.cy + p.dy}
            stroke={color}
            strokeWidth="0.8"
            opacity="0.15"
            strokeLinecap="round"
          />
          <circle cx={p.cx} cy={p.cy} r={p.r} fill={color} opacity={0.25 + (i % 4) * 0.12} />
          <circle cx={p.cx} cy={p.cy} r={p.r * 0.5} fill={color} opacity={0.5 + (i % 3) * 0.1} />
        </g>
      ))}
    </svg>
  )
}

function ModernPhysicsIllustration({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 240 160" className="w-full h-full max-h-[160px]" aria-hidden="true">
      <defs>
        <radialGradient id="mp-glow" cx="50%" cy="50%" r="40%">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="240" height="160" fill="url(#mp-glow)" />
      <circle cx="120" cy="80" r="10" fill={color} opacity="0.5" />
      <circle cx="120" cy="80" r="5" fill="white" opacity="0.2" />
      <circle cx="120" cy="80" r="16" fill={color} opacity="0.06" />
      <g className="atlas-electron-1" style={{ transformOrigin: '120px 80px' }}>
        <ellipse cx="120" cy="80" rx="65" ry="22" fill="none" stroke={color} strokeWidth="1" opacity="0.2" transform="rotate(-25 120 80)" />
        <circle cx="185" cy="80" r="4" fill={color} opacity="0.8" transform="rotate(-25 120 80)" />
      </g>
      <g className="atlas-electron-2" style={{ transformOrigin: '120px 80px' }}>
        <ellipse cx="120" cy="80" rx="65" ry="22" fill="none" stroke={color} strokeWidth="1" opacity="0.17" transform="rotate(35 120 80)" />
        <circle cx="55" cy="80" r="3.5" fill={color} opacity="0.7" transform="rotate(35 120 80)" />
      </g>
      <g className="atlas-electron-3" style={{ transformOrigin: '120px 80px' }}>
        <ellipse cx="120" cy="80" rx="65" ry="22" fill="none" stroke={color} strokeWidth="1" opacity="0.14" transform="rotate(95 120 80)" />
        <circle cx="120" cy="58" r="3" fill={color} opacity="0.6" />
      </g>
      <text x="95" y="145" fill="white" fontSize="7" fontFamily="var(--font-geist-mono, monospace)" opacity="0.1">n=1</text>
      <text x="60" y="145" fill="white" fontSize="7" fontFamily="var(--font-geist-mono, monospace)" opacity="0.08">n=2</text>
    </svg>
  )
}

const ILLUSTRATIONS: Record<string, React.ComponentType<{ color: string }>> = {
  'projectile-motion': ProjectileIllustration,
  'shm': SHMIllustration,
  'electrostatics': ElectrostaticsIllustration,
  'optics': OpticsIllustration,
  'thermodynamics': ThermodynamicsIllustration,
  'modern-physics': ModernPhysicsIllustration,
}

function AtomMark({ size = 36 }: { size?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} className="shrink-0" aria-hidden="true">
      <g transform="translate(20,20)">
        <ellipse rx="15" ry="5.5" fill="none" stroke="#E8740C" strokeWidth="1.3" transform="rotate(0)" opacity="0.8" />
        <ellipse rx="15" ry="5.5" fill="none" stroke="#E8740C" strokeWidth="1.3" transform="rotate(60)" opacity="0.8" />
        <ellipse rx="15" ry="5.5" fill="none" stroke="#E8740C" strokeWidth="1.3" transform="rotate(120)" opacity="0.8" />
        <circle r="3" fill="#E8740C" />
      </g>
    </svg>
  )
}

export default function Home() {
  const modules = getAllModules()

  return (
    <div className="min-h-screen bg-atlas-bg text-slate-200 selection:bg-atlas-accent/30">
      {/* Dot grid background */}
      <div className="fixed inset-0 atlas-dot-grid pointer-events-none" />

      <div className="relative">
        {/* Decorative orbital background */}
        <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true">
          <svg viewBox="0 0 800 800" className="w-[min(800px,95vw)] h-[min(800px,95vw)] opacity-[0.035]">
            <g className="atlas-orbit-slow" style={{ transformOrigin: '400px 400px' }}>
              <ellipse cx="400" cy="400" rx="380" ry="150" fill="none" stroke="#E8740C" strokeWidth="1.2" transform="rotate(-15 400 400)" />
            </g>
            <g className="atlas-orbit-med" style={{ transformOrigin: '400px 400px' }}>
              <ellipse cx="400" cy="400" rx="320" ry="130" fill="none" stroke="#E8740C" strokeWidth="0.8" transform="rotate(45 400 400)" />
            </g>
            <g className="atlas-orbit-slow" style={{ transformOrigin: '400px 400px' }}>
              <ellipse cx="400" cy="400" rx="260" ry="100" fill="none" stroke="#E8740C" strokeWidth="0.6" transform="rotate(100 400 400)" />
            </g>
          </svg>
        </div>

        {/* Hero */}
        <section className="min-h-screen flex flex-col items-center px-4 pt-12 pb-16 sm:pt-16 md:pt-20">
          {/* Brand */}
          <div className="flex items-center gap-3 mb-4">
            <AtomMark size={40} />
            <h1 className="text-3xl sm:text-[2rem] font-extrabold tracking-tight text-white">
              Fizzix
            </h1>
          </div>

          <p className="text-sm sm:text-base text-slate-400 text-center max-w-lg mb-3 leading-relaxed">
            Free physics simulations for Class 6&ndash;12
          </p>
          <p className="text-xs sm:text-sm text-slate-500 text-center mb-10 sm:mb-14">
            No login &middot; Works offline &middot; Hindi &amp; English
          </p>

          {/* Topic Atlas */}
          <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 max-w-[76rem] w-full">
            {modules.map((mod) => {
              const Illustration = ILLUSTRATIONS[mod.slug]
              return (
                <Link
                  key={mod.slug}
                  href={`/${mod.slug}`}
                  className="atlas-card group relative block rounded-xl overflow-hidden focus-visible:ring-2 focus-visible:ring-atlas-accent focus-visible:ring-offset-2 focus-visible:ring-offset-atlas-bg"
                  style={{
                    backgroundColor: '#141E33',
                    border: '1px solid #1E2D4A',
                  }}
                >
                  {/* Illustration area */}
                  <div className="aspect-[5/3] flex items-center justify-center px-4 pt-3 pb-1 relative overflow-hidden">
                    <div className="atlas-illus w-full h-full">
                      {Illustration && <Illustration color={mod.color} />}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="px-5 pb-5 pt-3 border-t border-atlas-border/50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="font-bold text-[0.9375rem] text-slate-100 group-hover:text-white transition-colors leading-snug">
                          {mod.name}
                        </h2>
                        <p className="text-[0.8125rem] text-slate-400 mt-1.5 leading-relaxed line-clamp-2">
                          {mod.description}
                        </p>
                      </div>
                      <span
                        className="shrink-0 mt-0.5 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full text-white/90"
                        style={{ backgroundColor: `${mod.color}CC` }}
                      >
                        {mod.classRange}
                      </span>
                    </div>

                    {/* Hover CTA */}
                    <div
                      className="mt-3 flex items-center text-xs font-semibold opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0 transition-all duration-300"
                      style={{ color: mod.color }}
                    >
                      Start exploring
                      <svg className="w-3.5 h-3.5 ml-1.5 transition-transform group-hover:translate-x-0.5" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 7h10M8 3l4 4-4 4" />
                      </svg>
                    </div>
                  </div>

                  {/* Hover border glow */}
                  <div
                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{
                      boxShadow: `inset 0 0 0 1.5px ${mod.color}55, 0 8px 32px ${mod.color}18`,
                    }}
                  />
                </Link>
              )
            })}
          </div>

          {/* Scroll hint */}
          <div className="mt-14 sm:mt-16 flex flex-col items-center text-slate-500 opacity-50" aria-hidden="true">
            <span className="text-[10px] tracking-[0.2em] uppercase mb-2">Scroll</span>
            <svg className="w-4 h-4 atlas-float" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M8 3v10M4 9l4 4 4-4" />
            </svg>
          </div>
        </section>

        {/* What makes Fizzix different */}
        <section className="py-16 sm:py-20 px-4 border-t border-atlas-border/30">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-lg sm:text-xl font-bold text-center text-slate-200 mb-12 sm:mb-14">
              Built for how students actually learn
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 sm:gap-12">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-atlas-accent/10 border border-atlas-accent/20 mb-5">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 text-atlas-accent" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-slate-200 mb-2">No account needed</h3>
                <p className="text-[0.8125rem] text-slate-400 leading-relaxed max-w-[16rem] mx-auto">
                  Open any simulation and start experimenting. No sign-up forms, no passwords.
                </p>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-atlas-accent/10 border border-atlas-accent/20 mb-5">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 text-atlas-accent" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 18h.01" strokeWidth="2.5" />
                    <path d="M9.17 15.17a4 4 0 015.66 0" />
                    <path d="M2 2l20 20" strokeWidth="1.8" />
                    <path d="M6.34 12.34a8 8 0 0111.32 0" opacity="0.5" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-slate-200 mb-2">Works offline</h3>
                <p className="text-[0.8125rem] text-slate-400 leading-relaxed max-w-[16rem] mx-auto">
                  Install once, use anywhere. Every simulation runs without an internet connection.
                </p>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-atlas-accent/10 border border-atlas-accent/20 mb-5">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 text-atlas-accent" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 8l6 6M4 14l6-6 2-3M2 5h12M7 2h1" />
                    <path d="M22 22l-5-10-5 10M14 18h6" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-slate-200 mb-2">Hindi &amp; English</h3>
                <p className="text-[0.8125rem] text-slate-400 leading-relaxed max-w-[16rem] mx-auto">
                  Switch languages with one tap. Labels, controls, and quiz questions in both.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-10 px-4 text-center border-t border-atlas-border/20">
          <div className="flex items-center justify-center gap-2.5 mb-2">
            <AtomMark size={28} />
            <span className="text-sm font-bold text-slate-300 tracking-tight">Fizzix</span>
          </div>
          <p className="text-xs text-slate-500">
            Free physics lab for Indian students
          </p>
        </footer>
      </div>
    </div>
  )
}
