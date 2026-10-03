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

      <h2>What is Fizzix?</h2>
      <p>
        Fizzix is a free, browser-based physics lab designed for Indian students in Class 6&ndash;12.
        Each topic presents an interactive simulation where you change parameters, watch the result
        in real time, and build physical intuition through direct experimentation.
      </p>
      <p>
        There is no login, no download, and no fee. Open any topic in your browser and start experimenting.
      </p>

      <h2>Your first experiment</h2>
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

      <h2>Using the controls</h2>
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

      <h2>Language support</h2>
      <p>
        Parameter labels, help text, and layer names are available in both Hindi and English.
        Use the language toggle within each simulation to switch.
      </p>

      <h2>Offline use</h2>
      <p>
        Fizzix uses a service worker to cache simulation pages after your first visit. Once you have
        loaded a simulation while online, you can revisit it offline. You must visit each simulation at
        least once while online for it to be available offline. New content or updates require a
        connection to download.
      </p>

      <h2>Keyboard and accessibility</h2>
      <ul>
        <li>All controls are keyboard-accessible. Tab to navigate, Enter or Space to activate, and arrow keys to adjust sliders.</li>
        <li>Interactive elements have accessible labels for screen readers.</li>
        <li>Animations respect the <code>prefers-reduced-motion</code> system setting. When reduced motion is active, CSS animations are suppressed and simulation animations show static positions.</li>
      </ul>

      <h2>Browser compatibility</h2>
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
