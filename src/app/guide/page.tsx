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

      <h2>Opening a simulation</h2>
      <ol>
        <li>Go to the <Link href="/">Fizzix homepage</Link> and scroll to the topic chapters, or use the header navigation.</li>
        <li>Click on any topic &mdash; for example, <Link href="/projectile-motion">Projectile Motion</Link>.</li>
        <li>The simulation loads in your browser. You will see a diagram, parameter sliders, and readout displays.</li>
      </ol>

      <h2>Using the controls</h2>
      <p>Every simulation has the same structure:</p>
      <ul>
        <li><strong>Sliders</strong> &mdash; drag to change a parameter (angle, velocity, wavelength, etc.). You can also use arrow keys for fine adjustments.</li>
        <li><strong>Tabs</strong> &mdash; switch between different views of the same simulation. For example, Projectile Motion has Intro, Vectors, Compare, and Free-play tabs.</li>
        <li><strong>Layers</strong> &mdash; toggle visual overlays like grid lines, velocity vectors, or force components.</li>
        <li><strong>Presets</strong> &mdash; load a curated starting configuration to explore a specific concept.</li>
        <li><strong>Quiz</strong> &mdash; test your understanding with multiple-choice questions drawn from the current topic.</li>
      </ul>

      <h2>Language support</h2>
      <p>
        Simulations support both Hindi and English. Parameter labels, help text, and layer names are
        available in both languages. Use the language toggle within each simulation to switch.
      </p>

      <h2>Offline use</h2>
      <p>
        Fizzix uses a service worker to cache lesson pages after your first visit. Once you have loaded
        a simulation with an internet connection, you can revisit it offline. The homepage and app shell
        are precached automatically when you first open the site.
      </p>
      <p>
        Note: you must visit each lesson at least once while online for it to be available offline.
        New content or updates require a connection to download.
      </p>

      <h2>Keyboard and accessibility</h2>
      <ul>
        <li>All controls are keyboard-accessible. Tab to navigate, Enter or Space to activate, and arrow keys to adjust sliders.</li>
        <li>The mobile menu closes with the Escape key and returns focus to the menu button.</li>
        <li>Animations respect the <code>prefers-reduced-motion</code> system setting. When reduced motion is active, animations are disabled and static indicators are shown instead.</li>
        <li>All interactive elements have accessible labels for screen readers.</li>
      </ul>

      <h2>Browser compatibility</h2>
      <p>
        Fizzix works in any modern browser: Chrome, Firefox, Safari, Edge, and their mobile equivalents.
        JavaScript must be enabled. The site is responsive and works on phones, tablets, and desktops.
      </p>

      <h2>Next steps</h2>
      <ul>
        <li><Link href="/guide/topics">Topic Reference</Link> &mdash; details on each of the six available simulations.</li>
        <li><Link href="/guide/teachers">Teacher Guide</Link> &mdash; suggestions for using Fizzix in a classroom setting.</li>
      </ul>
    </article>
  )
}
