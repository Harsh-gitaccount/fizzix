import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllModules } from '@/simulations/registry'
import { t } from '@/lib/i18n'

export const metadata: Metadata = {
  title: 'Topic Reference - Fizzix Guide',
  description: 'Parameters, layers, and presets for all Fizzix physics simulations.',
}

const CONCEPTS: Record<string, string> = {
  'projectile-motion': 'Parabolic trajectory under uniform gravity, range and height dependence on angle, velocity components, air drag effects.',
  'shm': 'Simple pendulum period and length, spring-mass oscillations and stiffness, damping, energy exchange between kinetic and potential.',
  'electrostatics': 'Coulomb\'s law and inverse-square force, electric field lines, simple DC circuits with Ohm\'s law, series and parallel resistors.',
  'optics': 'Snell\'s law of refraction, total internal reflection and critical angle, thin-lens image formation with convex and concave lenses.',
  'thermodynamics': 'Kinetic theory of gases, ideal gas law (PV = nRT), molecular speed distributions, Brownian motion, compression and expansion with a piston.',
  'modern-physics': 'Photoelectric effect and threshold frequency, Bohr model energy levels and spectral transitions, radioactive decay and half-life.',
}

const MODEL_NOTES: Record<string, string> = {
  'thermodynamics': 'The particle motion on screen is illustrative - particle positions are randomised for visual clarity. The Speed Distribution histogram bins the simulated particle speeds, showing their distribution at that instant rather than the theoretical Maxwell-Boltzmann curve.',
  'shm': 'The Pendulum tab uses the small-angle approximation. At angles above about 20°, the true period deviates from T = 2π√(L/g).',
  'modern-physics': 'Transition energy calculations use the Bohr model for hydrogen-like atoms. Multi-electron atoms and quantum mechanical corrections are not modelled.',
}

export default function TopicReferencePage() {
  const modules = getAllModules()

  return (
    <article>
      <h1 className="text-3xl sm:text-4xl font-bold text-fb-ink tracking-tight font-serif mb-2">
        Topic Reference
      </h1>
      <p className="text-fb-muted text-base mb-10">
        Parameters, layers, and presets derived from the simulation definitions.
      </p>

      {modules.map(mod => {
        const concepts = CONCEPTS[mod.slug]
        const modelNote = MODEL_NOTES[mod.slug]
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

            {concepts && (
              <>
                <h3>Concepts covered</h3>
                <p>{concepts}</p>
              </>
            )}

            <h3>Parameters</h3>
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-fb-rule/60">
                    <th className="text-left py-1.5 pr-3 font-semibold text-fb-ink">Symbol</th>
                    <th className="text-left py-1.5 pr-3 font-semibold text-fb-ink">Unit</th>
                    <th className="text-left py-1.5 pr-3 font-semibold text-fb-ink">Range</th>
                    <th className="text-left py-1.5 font-semibold text-fb-ink">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {mod.paramDefs.map(p => (
                    <tr key={p.key} className="border-b border-fb-rule/30">
                      <td className="py-1.5 pr-3"><code>{p.symbol}</code></td>
                      <td className="py-1.5 pr-3 text-fb-muted">{p.unit || '-'}</td>
                      <td className="py-1.5 pr-3 font-mono text-xs text-fb-muted">{p.min}-{p.max}</td>
                      <td className="py-1.5 text-fb-muted">{p.help}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3>Visual layers</h3>
            <p>{mod.layerDefs.map(l => l.label).join(', ')}</p>

            <h3>Tabs</h3>
            <p>{mod.tabs.map(tab => t(tab.labelKey, 'en')).join(', ')}</p>

            <h3>Presets</h3>
            <p>{mod.presets.map(p => p.label).join(' · ')}</p>

            {modelNote && (
              <>
                <h3>Model notes</h3>
                <p>{modelNote}</p>
              </>
            )}
          </section>
        )
      })}

      <h2>Common features</h2>
      <p>All six simulations share these features:</p>
      <ul>
        <li><strong>Tabs</strong> &mdash; multiple views of the same topic (intro, comparison, free-play, etc.)</li>
        <li><strong>Presets</strong> &mdash; curated starting configurations for guided exploration</li>
        <li><strong>Layer toggles</strong> &mdash; show or hide visual overlays independently</li>
        <li><strong>Quiz questions</strong> &mdash; multiple-choice questions tied to the current topic</li>
        <li><strong>Hindi labels</strong> &mdash; every parameter, layer, and help string has a Hindi translation</li>
        <li><strong>Keyboard control</strong> &mdash; all sliders respond to arrow keys for fine adjustment</li>
      </ul>

      <h2>Further reading</h2>
      <ul>
        <li><Link href="/guide">Getting Started</Link> &mdash; basics for new users</li>
        <li><Link href="/guide/teachers">Teacher Guide</Link> &mdash; classroom activities with specific settings</li>
      </ul>
    </article>
  )
}
