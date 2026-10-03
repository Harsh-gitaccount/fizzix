import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Getting Started – Fizzix Guide',
  description: 'Learn how to use Fizzix interactive physics simulations.',
}

export default function GettingStartedPage() {
  return (
    <article>
      <h1 className="text-3xl sm:text-4xl font-bold text-fb-ink tracking-tight font-serif mb-2">
        Getting Started
      </h1>
      <p className="text-fb-muted text-base mb-8">
        Everything you need to start using Fizzix in under five minutes.
      </p>

      <nav aria-label="On this page" className="mb-10 text-sm">
        <p className="font-semibold text-fb-ink mb-2">On this page</p>
        <ol className="list-decimal pl-5 space-y-0.5 text-fb-muted">
          <li><a href="#what-is-fizzix" className="hover:text-fb-accent">What is Fizzix?</a></li>
          <li><a href="#first-experiment" className="hover:text-fb-accent">Your first experiment</a></li>
          <li><a href="#controls" className="hover:text-fb-accent">Using the controls</a></li>
          <li><a href="#language" className="hover:text-fb-accent">Language support</a></li>
          <li><a href="#offline" className="hover:text-fb-accent">Offline use</a></li>
          <li><a href="#accessibility" className="hover:text-fb-accent">Keyboard and accessibility</a></li>
          <li><a href="#browser" className="hover:text-fb-accent">Browser compatibility</a></li>
        </ol>
      </nav>

      <h2 id="what-is-fizzix">What is Fizzix?</h2>
      <p>
        Fizzix is a free, browser-based physics lab designed for Indian students in Class 6&ndash;12.
        Each topic presents an interactive simulation where you change parameters, watch the result
        in real time, and build physical intuition through direct experimentation.
      </p>
      <p>
        There is no login, no download, and no fee. Open any topic in your browser and start experimenting.
      </p>

      <h2 id="first-experiment">Your first experiment</h2>
      <p>
        Open <Link href="/projectile-motion">Projectile Motion</Link> and try this:
      </p>
      <ol>
        <li>
          You will see a projectile diagram with parameter sliders on the side. The <strong>Intro</strong> tab
          is selected by default.
        </li>
        <li>
          Find the <code>θ</code> (launch angle) slider. Drag it to <strong>30°</strong> and note the
          range reading.
        </li>
        <li>
          Now drag <code>θ</code> to <strong>60°</strong>. The range should be the same &mdash; complementary
          angles (30° and 60°) produce equal range when launched and landing on flat ground with no drag.
        </li>
        <li>
          Try <strong>45°</strong>. This gives the maximum range for any given speed.
        </li>
        <li>
          Turn on the <strong>Velocity</strong> layer using the layer toggles. You will see a green velocity
          arrow that changes direction along the path.
        </li>
      </ol>
      <p>
        This &ldquo;change &rarr; observe &rarr; understand&rdquo; loop is the same across all six simulations.
      </p>

      {/* Annotated illustration of the simulation interface */}
      <figure className="my-8 border border-fb-rule/60 rounded-lg overflow-hidden bg-fb-paper">
        <svg viewBox="0 0 600 260" className="w-full h-auto" role="img" aria-label="Annotated diagram of the simulation interface showing tabs, sliders, layers, and the canvas area">
          {/* Canvas area */}
          <rect x="20" y="40" width="360" height="200" rx="6" fill="#FAF9F6" stroke="#E5E2DC" strokeWidth="1" />
          <text x="200" y="145" textAnchor="middle" fontSize="13" fill="#9B9EAD" fontFamily="monospace">Canvas</text>
          {/* Trajectory sketch */}
          <path d="M60 220 Q160 60 300 220" fill="none" stroke="#E8740C" strokeWidth="2" opacity="0.5" />
          <circle cx="60" cy="220" r="4" fill="#1B2249" opacity="0.5" />
          <circle cx="300" cy="220" r="4" fill="#1B2249" opacity="0.3" />

          {/* Tab bar */}
          <rect x="20" y="12" width="360" height="24" rx="4" fill="#F3F1EC" stroke="#E5E2DC" strokeWidth="0.5" />
          <rect x="24" y="15" width="50" height="18" rx="3" fill="#E8740C" />
          <text x="49" y="28" textAnchor="middle" fontSize="9" fill="white" fontWeight="600">Intro</text>
          <text x="98" y="28" fontSize="9" fill="#9B9EAD">Vectors</text>
          <text x="148" y="28" fontSize="9" fill="#9B9EAD">Compare</text>

          {/* Annotation: Tabs */}
          <line x1="200" y1="6" x2="200" y2="12" stroke="#6B7186" strokeWidth="0.75" />
          <text x="200" y="4" textAnchor="middle" fontSize="10" fill="#1B2249" fontWeight="600">Tabs</text>

          {/* Slider panel */}
          <rect x="400" y="40" width="180" height="200" rx="6" fill="#FAF9F6" stroke="#E5E2DC" strokeWidth="1" />
          <text x="420" y="62" fontSize="10" fill="#1B2249" fontWeight="600">Parameters</text>

          {/* Slider: angle */}
          <text x="420" y="82" fontSize="9" fill="#6B7186" fontFamily="monospace">θ  Launch angle</text>
          <rect x="420" y="88" width="140" height="4" rx="2" fill="#E5E2DC" />
          <circle cx="480" cy="90" r="6" fill="#E8740C" />

          {/* Slider: speed */}
          <text x="420" y="114" fontSize="9" fill="#6B7186" fontFamily="monospace">v₀ Initial speed</text>
          <rect x="420" y="120" width="140" height="4" rx="2" fill="#E5E2DC" />
          <circle cx="520" cy="122" r="6" fill="#E8740C" />

          {/* Annotation: Sliders */}
          <line x1="590" y1="90" x2="596" y2="90" stroke="#6B7186" strokeWidth="0.75" />

          {/* Layer toggles */}
          <text x="420" y="155" fontSize="10" fill="#1B2249" fontWeight="600">Layers</text>
          <rect x="420" y="162" width="10" height="10" rx="2" fill="#E8740C" />
          <text x="436" y="171" fontSize="9" fill="#6B7186">Grid</text>
          <rect x="420" y="178" width="10" height="10" rx="2" fill="#E8740C" />
          <text x="436" y="187" fontSize="9" fill="#6B7186">Trajectory</text>
          <rect x="420" y="194" width="10" height="10" rx="2" fill="#E5E2DC" stroke="#9B9EAD" strokeWidth="0.5" />
          <text x="436" y="203" fontSize="9" fill="#6B7186">Velocity</text>

          {/* Annotation: Layers */}
          <line x1="590" y1="180" x2="596" y2="180" stroke="#6B7186" strokeWidth="0.75" />
        </svg>
        <figcaption className="text-xs text-fb-muted text-center py-2 px-4">
          Every simulation page has the same layout: tabs across the top, a canvas with the diagram, and a side panel with parameter sliders and layer toggles.
        </figcaption>
      </figure>

      <h2 id="controls">Using the controls</h2>
      <p>Every simulation has the same structure:</p>
      <ul>
        <li>
          <strong>Sliders</strong> &mdash; drag to change a parameter (angle, velocity, wavelength, etc.).
          Use arrow keys for single-step adjustments.
        </li>
        <li>
          <strong>Tabs</strong> &mdash; switch between different views. For example, Projectile Motion has
          Intro, Vectors, Compare, and Free-play tabs.
        </li>
        <li>
          <strong>Layers</strong> &mdash; toggle visual overlays like grid lines, velocity vectors, or
          force components. Each layer can be shown or hidden independently.
        </li>
        <li>
          <strong>Presets</strong> &mdash; load a curated starting configuration. For example, &ldquo;Moon vs
          Earth&rdquo; in Projectile Motion sets gravity to 1.6 m/s².
        </li>
        <li>
          <strong>Quiz</strong> &mdash; test your understanding with multiple-choice questions about the
          current topic.
        </li>
      </ul>

      <h2 id="language">Language support</h2>
      <p>
        Parameter labels, help text, and layer names are available in both Hindi and English.
        Use the language toggle within each simulation to switch.
      </p>

      <h2 id="offline">Offline use</h2>
      <p>
        Fizzix uses a service worker to cache simulation pages after your first visit. Once you have
        loaded a simulation while online, you can revisit it offline. You must visit each simulation at
        least once while online for it to be available offline. New content or updates require a
        connection to download.
      </p>

      <h2 id="accessibility">Keyboard and accessibility</h2>
      <ul>
        <li>All controls are keyboard-accessible. Tab to navigate, Enter or Space to activate, and arrow keys to adjust sliders.</li>
        <li>Interactive elements have accessible labels for screen readers.</li>
        <li>A global CSS rule suppresses animation and transition durations when <code>prefers-reduced-motion</code> is active. The homepage experiment also checks this setting and skips its requestAnimationFrame loop. Lesson-page canvas animations do not currently check the preference.</li>
      </ul>

      <h2 id="browser">Browser compatibility</h2>
      <p>
        Fizzix works in any modern browser: Chrome, Firefox, Safari, Edge, and their mobile equivalents.
        JavaScript must be enabled. The site is responsive and works on phones, tablets, and desktops.
      </p>

      <h2>Next steps</h2>
      <ul>
        <li><Link href="/guide/topics">Topic Reference</Link> &mdash; parameters, layers, and presets for each simulation.</li>
        <li><Link href="/guide/teachers">Teacher Guide</Link> &mdash; classroom activities with specific settings and procedures.</li>
      </ul>
    </article>
  )
}
