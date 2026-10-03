import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllModules } from '@/simulations/registry'

export const metadata: Metadata = {
  title: 'Topic Reference – Fizzix Guide',
  description: 'Detailed reference for all six Fizzix physics topics.',
}

const TOPIC_DETAILS: Record<string, {
  concepts: string
  parameters: string[]
  layers: string[]
  presetExamples: string[]
}> = {
  'projectile-motion': {
    concepts: 'Parabolic trajectory under uniform gravity, range and height dependence on angle, velocity components, air drag effects.',
    parameters: [
      'v₀ (initial speed, 0–50 m/s)',
      'θ (launch angle, 0–90°)',
      'g (gravity, 0.5–20 m/s²)',
      'y₀ (starting height, 0–50 m)',
      'b (drag factor, 0–0.5 1/m)',
    ],
    layers: ['Grid', 'Trajectory', 'Velocity', 'Components', 'Acceleration'],
    presetExamples: ['45° classic', 'Moon gravity', 'With drag'],
  },
  shm: {
    concepts: 'Simple pendulum, spring-mass oscillations, period dependence on length and stiffness, damping, energy exchange.',
    parameters: [
      'L (string length, 0.1–5 m)',
      'θ₀ (starting angle, 1–60°)',
      'g (gravity, 0.5–20 m/s²)',
      'b (damping, 0–5 kg/s)',
      'k (spring stiffness, 1–100 N/m)',
      'm (mass, 0.1–10 kg)',
      'A (amplitude, 0.01–1 m)',
    ],
    layers: ['Grid', 'Trail', 'Velocity', 'Angle', 'Energy Bar'],
    presetExamples: ['Simple Pendulum', 'Moon Pendulum', 'Bouncy Spring', 'Damped Swing'],
  },
  electrostatics: {
    concepts: 'Coulomb\'s law, electric field lines, force between charges, simple DC circuits with Ohm\'s law, series and parallel resistors.',
    parameters: [
      'q₁, q₂ (charges, ±10 µC)',
      'r (distance, 0.05–2 m)',
      'V (battery voltage, 1–24 V)',
      'R₁, R₂ (resistances, 1–1000 Ω)',
    ],
    layers: ['Grid', 'Force Vectors', 'Field Lines', 'Values', 'Current Flow'],
    presetExamples: ['Opposite Charges', 'Like Charges', 'Simple Bulb', 'Series vs Parallel'],
  },
  optics: {
    concepts: 'Snell\'s law of refraction, total internal reflection, critical angle, thin-lens image formation, convex and concave lenses.',
    parameters: [
      'n₁, n₂ (refractive indices, 1.0–2.5)',
      'θ₁ (angle of incidence, 0–89°)',
      'u (object distance, −100 to −5 cm)',
      'f (focal length, −50 to 50 cm)',
      'h (object height, 1–30 cm)',
    ],
    layers: ['Grid', 'Rays', 'Angles', 'Values'],
    presetExamples: ['Air to Glass', 'Diamond Sparkle', 'Convex – Real Image', 'Optical Fiber'],
  },
  thermodynamics: {
    concepts: 'Kinetic theory of gases, ideal gas law (PV = nRT), Maxwell-Boltzmann speed distribution, Brownian motion, compression and expansion.',
    parameters: [
      'T (temperature, 100–1000 K)',
      'n (amount, 0.1–5 mol)',
      'V (volume, 1–100 L)',
      'M (molar mass, 2–44 g/mol)',
      'x (piston position)',
      'N (molecule count for Brownian motion, 20–150)',
    ],
    layers: ['Speed Colors', 'Pressure Arrows', 'Speed Distribution', 'Brownian Trace'],
    presetExamples: ['Room Temp N₂', 'Hot Gas', 'Boyle\'s Law', 'Pollen Grain'],
  },
  'modern-physics': {
    concepts: 'Photoelectric effect and threshold frequency, Bohr model energy levels and spectral transitions, radioactive decay and half-life.',
    parameters: [
      'λ (wavelength, 100–800 nm)',
      'φ (work function, 1.5–6 eV)',
      'I (intensity, 10–100%)',
      'n (orbit number, 1–6)',
      'n₁, n₂ (transition levels)',
      'T½ (half-life, 1–100 s)',
      'N₀ (initial nuclei, 100–10000)',
    ],
    layers: ['Energy Bars', 'Energy Levels', 'Transition', 'Half-life Markers'],
    presetExamples: ['Cs + Violet Light', 'Cu + UV Light', 'Balmer Alpha', 'Fast Decay'],
  },
}

export default function TopicReferencePage() {
  const modules = getAllModules()

  return (
    <article>
      <h1 className="text-3xl sm:text-4xl font-bold text-fb-ink tracking-tight font-serif mb-2">
        Topic Reference
      </h1>
      <p className="text-fb-muted text-base mb-10">
        Parameters, layers, and presets for each of the six simulations.
      </p>

      {modules.map(mod => {
        const details = TOPIC_DETAILS[mod.slug]
        if (!details) return null
        return (
          <section key={mod.slug} className="mb-12 pb-8 border-b border-fb-rule/60 last:border-0">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="!mt-0 !mb-0" id={mod.slug}>
                <Link href={`/${mod.slug}`} className="!text-fb-ink hover:!text-fb-accent !no-underline">
                  {mod.name}
                </Link>
              </h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-fb-paper text-fb-dim border border-fb-rule/60">
                Class {mod.classRange}
              </span>
            </div>
            <p className="!text-sm !text-fb-muted mb-4">{mod.description}</p>

            <h3>Concepts covered</h3>
            <p>{details.concepts}</p>

            <h3>Parameters</h3>
            <ul>
              {details.parameters.map(p => (
                <li key={p}><code>{p.split(' (')[0]}</code> &mdash; {p.split(' (')[1]?.replace(')', '') || p}</li>
              ))}
            </ul>

            <h3>Visual layers</h3>
            <p>{details.layers.join(', ')}</p>

            <h3>Example presets</h3>
            <p>{details.presetExamples.join(' · ')}</p>
          </section>
        )
      })}

      <h2>Common features</h2>
      <p>
        All six simulations share these features:
      </p>
      <ul>
        <li><strong>Tabs</strong> &mdash; multiple views of the same topic (intro, comparison, free-play, etc.)</li>
        <li><strong>Presets</strong> &mdash; curated starting configurations for guided exploration</li>
        <li><strong>Layer toggles</strong> &mdash; show or hide visual overlays independently</li>
        <li><strong>Quiz questions</strong> &mdash; multiple-choice questions tied to the current topic</li>
        <li><strong>Hindi labels</strong> &mdash; every parameter, layer, and help string has a Hindi translation</li>
        <li><strong>Keyboard control</strong> &mdash; all sliders respond to arrow keys for fine adjustment</li>
        <li><strong>Offline caching</strong> &mdash; revisit any topic without a connection after first load</li>
      </ul>

      <h2>Further reading</h2>
      <ul>
        <li><Link href="/guide">Getting Started</Link> &mdash; basics for new users</li>
        <li><Link href="/guide/teachers">Teacher Guide</Link> &mdash; classroom suggestions</li>
      </ul>
    </article>
  )
}
