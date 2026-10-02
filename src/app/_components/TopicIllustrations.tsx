import type { ComponentType } from 'react'

function ProjectileIllustration({ color }: { color: string }) {
  const pts = Array.from({ length: 25 }, (_, i) => {
    const t = i / 24
    return `${30 + t * 180},${140 - 4 * 110 * t * (1 - t)}`
  }).join(' ')
  return (
    <svg viewBox="0 0 240 160" className="w-full h-full" aria-hidden="true">
      <defs>
        <radialGradient id="pm-glow" cx="50%" cy="30%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.12" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="240" height="160" fill="url(#pm-glow)" />
      <line x1="15" y1="140" x2="225" y2="140" stroke="white" strokeWidth="0.5" opacity="0.06" />
      <line x1="25" y1="10" x2="25" y2="140" stroke="white" strokeWidth="0.5" opacity="0.06" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" opacity="0.5" strokeLinecap="round" strokeLinejoin="round" />
      {[0, 0.15, 0.3, 0.5, 0.7, 0.85, 1].map((t, i) => {
        const x = 30 + t * 180
        const y = 140 - 4 * 110 * t * (1 - t)
        return <circle key={i} cx={x} cy={y} r="1.8" fill={color} opacity={0.25 + i * 0.05} />
      })}
      <circle cx="120" cy="30" r="6" fill={color} opacity="0.85" className="atlas-float" />
      <circle cx="120" cy="30" r="11" fill={color} opacity="0.08" />
      <line x1="128" y1="30" x2="152" y2="30" stroke={color} strokeWidth="1.2" opacity="0.4" />
      <polygon points="152,27.5 157,30 152,32.5" fill={color} opacity="0.4" />
      <line x1="120" y1="38" x2="120" y2="55" stroke="white" strokeWidth="0.6" opacity="0.1" strokeDasharray="2 2" />
      <text x="126" y="50" fill="white" fontSize="9" fontFamily="monospace" opacity="0.12">g</text>
    </svg>
  )
}

function SHMIllustration({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 240 160" className="w-full h-full" aria-hidden="true">
      <defs>
        <radialGradient id="shm-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.1" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="240" height="160" fill="url(#shm-glow)" />
      <line x1="10" y1="80" x2="230" y2="80" stroke="white" strokeWidth="0.5" opacity="0.06" />
      <path d="M 10,80 C 32,20 55,20 77,80 C 99,140 122,140 144,80 C 166,20 188,20 210,80" fill="none" stroke={color} strokeWidth="2.5" opacity="0.5" strokeLinecap="round" />
      <path d="M 10,80 C 32,20 55,20 77,80 C 99,140 122,140 144,80 C 166,20 188,20 210,80 L 210,160 L 10,160 Z" fill={color} opacity="0.03" />
      <line x1="77" y1="30" x2="77" y2="130" stroke={color} strokeWidth="0.5" opacity="0.1" strokeDasharray="3 3" />
      <text x="80" y="28" fill={color} fontSize="8" fontFamily="monospace" opacity="0.25">A</text>
      <circle cx="10" cy="80" r="6" fill={color} opacity="0.8" className="atlas-pulse" />
      <circle cx="10" cy="80" r="10" fill={color} opacity="0.1" className="atlas-pulse" />
    </svg>
  )
}

function ElectrostaticsIllustration({ color }: { color: string }) {
  const lines = [
    'M 78,75 Q 120,50 162,75', 'M 78,75 Q 120,100 162,75',
    'M 75,65 Q 115,30 165,65', 'M 75,85 Q 115,120 165,85',
    'M 72,55 Q 105,15 168,55', 'M 72,95 Q 105,135 168,95',
    'M 70,45 Q 100,5 170,48', 'M 70,105 Q 100,145 170,102',
  ]
  return (
    <svg viewBox="0 0 240 160" className="w-full h-full" aria-hidden="true">
      <defs>
        <radialGradient id="es-glow-pos" cx="30%" cy="50%" r="35%">
          <stop offset="0%" stopColor={color} stopOpacity="0.12" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="240" height="160" fill="url(#es-glow-pos)" />
      {lines.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={color} strokeWidth="1" opacity={0.15 + (i % 3) * 0.08} className="atlas-ray" />
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
    <svg viewBox="0 0 240 160" className="w-full h-full" aria-hidden="true">
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
      <path d="M 115,28 Q 126,80 115,132 Q 104,80 115,28 Z" fill="url(#opt-lens)" stroke="white" strokeWidth="1.2" opacity="0.25" />
      {[45, 80, 115].map((y, i) => (
        <g key={i}>
          <line x1="15" y1={y} x2="110" y2={y} stroke={color} strokeWidth="1.5" opacity={0.35 + i * 0.1} strokeLinecap="round" />
          <line x1="120" y1={y} x2="185" y2={80} stroke={color} strokeWidth="1.5" opacity={0.35 + i * 0.1} strokeLinecap="round" />
        </g>
      ))}
      <circle cx="185" cy="80" r="5" fill={color} opacity="0.7" className="atlas-pulse" />
      <circle cx="185" cy="80" r="11" fill={color} opacity="0.06" />
      <text x="181" y="100" fill="white" fontSize="9" fontFamily="monospace" opacity="0.18">f</text>
    </svg>
  )
}

function ThermodynamicsIllustration({ color }: { color: string }) {
  const particles = [
    { cx: 55, cy: 40, r: 4, dx: 8, dy: -5, a: 'atlas-particle-1' },
    { cx: 140, cy: 50, r: 3.5, dx: -6, dy: 7, a: 'atlas-particle-2' },
    { cx: 90, cy: 95, r: 4.5, dx: 7, dy: -4, a: 'atlas-particle-3' },
    { cx: 170, cy: 35, r: 3, dx: -5, dy: -7, a: 'atlas-particle-1' },
    { cx: 50, cy: 110, r: 3.5, dx: 6, dy: 5, a: 'atlas-particle-2' },
    { cx: 150, cy: 105, r: 4, dx: -7, dy: -3, a: 'atlas-particle-3' },
    { cx: 100, cy: 55, r: 3, dx: 4, dy: 8, a: 'atlas-particle-1' },
    { cx: 180, cy: 80, r: 3.5, dx: -4, dy: -6, a: 'atlas-particle-2' },
    { cx: 70, cy: 75, r: 4, dx: -6, dy: 4, a: 'atlas-particle-3' },
    { cx: 125, cy: 80, r: 3, dx: 5, dy: -5, a: 'atlas-particle-1' },
  ]
  return (
    <svg viewBox="0 0 240 160" className="w-full h-full" aria-hidden="true">
      <defs>
        <radialGradient id="thermo-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.08" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="240" height="160" fill="url(#thermo-glow)" />
      <rect x="30" y="15" width="180" height="130" rx="6" fill="none" stroke="white" strokeWidth="1" opacity="0.08" />
      {particles.map((p, i) => (
        <g key={i} className={p.a}>
          <line x1={p.cx} y1={p.cy} x2={p.cx + p.dx} y2={p.cy + p.dy} stroke={color} strokeWidth="0.8" opacity="0.15" strokeLinecap="round" />
          <circle cx={p.cx} cy={p.cy} r={p.r} fill={color} opacity={0.25 + (i % 4) * 0.12} />
          <circle cx={p.cx} cy={p.cy} r={p.r * 0.5} fill={color} opacity={0.5 + (i % 3) * 0.1} />
        </g>
      ))}
    </svg>
  )
}

function ModernPhysicsIllustration({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 240 160" className="w-full h-full" aria-hidden="true">
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
    </svg>
  )
}

export const TOPIC_ILLUSTRATIONS: Record<string, ComponentType<{ color: string }>> = {
  'projectile-motion': ProjectileIllustration,
  'shm': SHMIllustration,
  'electrostatics': ElectrostaticsIllustration,
  'optics': OpticsIllustration,
  'thermodynamics': ThermodynamicsIllustration,
  'modern-physics': ModernPhysicsIllustration,
}
