import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Teacher Guide – Fizzix',
  description: 'How to use Fizzix in your classroom.',
}

export default function TeacherGuidePage() {
  return (
    <article>
      <h1 className="text-3xl sm:text-4xl font-bold text-fb-ink tracking-tight font-serif mb-2">
        Teacher Guide
      </h1>
      <p className="text-fb-muted text-base mb-8">
        Practical suggestions for using Fizzix with your students.
      </p>

      <h2>Why interactive simulations?</h2>
      <p>
        Physics concepts become concrete when students can manipulate variables and immediately see
        the effect. A slider that changes launch angle is faster than deriving the range formula
        and more memorable than watching a demonstration. Fizzix puts that loop &mdash; change,
        observe, understand &mdash; directly in each student&rsquo;s hands.
      </p>

      <h2>Using Fizzix in class</h2>
      <h3>Before class</h3>
      <ol>
        <li>Open the simulation you plan to use and familiarise yourself with its tabs, presets, and layers.</li>
        <li>Identify one or two parameters to focus on. For example, in Projectile Motion, you might focus only on angle while keeping velocity fixed.</li>
        <li>Prepare a question to pose: &ldquo;What angle gives the longest range?&rdquo; or &ldquo;What happens to the period when you double the mass?&rdquo;</li>
      </ol>

      <h3>During class</h3>
      <ol>
        <li><strong>Project the simulation</strong> on a screen and demonstrate the basic controls.</li>
        <li><strong>Ask the question</strong> and have students predict the answer before you change the variable.</li>
        <li><strong>Let students try</strong> on their own devices. All they need is a browser &mdash; phones work fine.</li>
        <li><strong>Use presets</strong> to jump to specific configurations that illustrate a concept.</li>
        <li><strong>Toggle layers</strong> to progressively reveal details: start with just the trajectory, then add velocity vectors, then show components.</li>
      </ol>

      <h3>After class</h3>
      <p>
        Students can revisit the same simulation at home. Once they have loaded a lesson while
        online, it stays cached on their device for offline use. The built-in quiz questions let
        them test their understanding without needing a separate assignment.
      </p>

      <h2>Suggested activities by topic</h2>

      <h3>Projectile Motion (Class 6&ndash;8)</h3>
      <ul>
        <li>Predict, then test: which angle maximises range at fixed speed?</li>
        <li>Compare symmetric angles (30° vs 60°) and discuss why they give the same range.</li>
        <li>Use the Vectors tab to show how horizontal and vertical velocity components change independently.</li>
      </ul>

      <h3>Simple Harmonic Motion (Class 9&ndash;10)</h3>
      <ul>
        <li>Change the spring constant and observe the effect on period.</li>
        <li>Have students note the relationship between amplitude and period (spoiler: there isn&rsquo;t one for ideal SHM).</li>
        <li>Use the Compare tab to overlay two oscillations with different parameters.</li>
      </ul>

      <h3>Electrostatics &amp; Circuits (Class 10&ndash;11)</h3>
      <ul>
        <li>Place charges and observe the resulting electric field lines.</li>
        <li>Ask students to predict the field pattern before revealing it.</li>
        <li>In the circuit view, change resistance and voltage to explore Ohm&rsquo;s law directly.</li>
      </ul>

      <h3>Optics &amp; Light (Class 10&ndash;11)</h3>
      <ul>
        <li>Move the object relative to a lens and observe where the image forms.</li>
        <li>Find the critical angle for total internal reflection by adjusting the angle of incidence.</li>
      </ul>

      <h3>Thermodynamics (Class 11)</h3>
      <ul>
        <li>Observe molecular speeds at different temperatures.</li>
        <li>Relate macroscopic variables (pressure, volume, temperature) to particle motion.</li>
      </ul>

      <h3>Modern Physics (Class 12)</h3>
      <ul>
        <li>Vary the frequency of incident light and observe the photoelectric effect threshold.</li>
        <li>Explore Bohr model energy levels by selecting transitions.</li>
      </ul>

      <h2>Accessibility in the classroom</h2>
      <p>
        Fizzix works on any device with a modern browser. Students who use screen readers can
        navigate controls with the keyboard; all sliders and buttons have accessible labels.
        If any student has reduced-motion preferences set on their device, animations are
        automatically disabled and static indicators are shown instead.
      </p>

      <h2>What Fizzix does not do</h2>
      <ul>
        <li>It does not track student progress, assign grades, or generate reports.</li>
        <li>It does not require student accounts or collect personal information.</li>
        <li>It does not replace a textbook or syllabus &mdash; it supplements them with hands-on experimentation.</li>
      </ul>

      <h2>Further resources</h2>
      <ul>
        <li><Link href="/guide">Getting Started</Link> &mdash; the basics for anyone new to Fizzix.</li>
        <li><Link href="/guide/topics">Topic Reference</Link> &mdash; detailed parameter lists and feature descriptions for each simulation.</li>
      </ul>
    </article>
  )
}
