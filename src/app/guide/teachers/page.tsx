import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Teacher Guide – Fizzix',
  description: 'Classroom activities using Fizzix physics simulations.',
}

export default function TeacherGuidePage() {
  return (
    <article>
      <h1 className="text-3xl sm:text-4xl font-bold text-fb-ink tracking-tight font-serif mb-2">
        Teacher Guide
      </h1>
      <p className="text-fb-muted text-base mb-8">
        Classroom-ready activities using Fizzix simulations. Each includes exact settings, a prediction
        question, procedure, and expected observations.
      </p>

      <h2>Why interactive simulations?</h2>
      <p>
        Physics concepts become concrete when students manipulate variables and immediately see
        the effect. A slider that changes launch angle is faster than deriving the range formula
        and more memorable than a demonstration alone. Fizzix puts the loop &mdash; change,
        observe, understand &mdash; directly in each student&rsquo;s hands, on any device with
        a browser.
      </p>

      <h2 id="projectile-activity">
        Projectile Motion: complementary angle symmetry
      </h2>
      <p className="text-xs font-mono text-fb-dim mb-2">
        Class 6&ndash;8 &middot; 20&ndash;25 minutes &middot; <Link href="/projectile-motion">Open simulation</Link>
      </p>

      <h3>Learning objective</h3>
      <p>
        Students discover that complementary launch angles (θ and 90° − θ) produce the same range
        when a projectile is launched and lands at the same height, with the same speed, under uniform
        gravity, and without air resistance.
      </p>

      <h3>Setup</h3>
      <p>
        Open <Link href="/projectile-motion">Projectile Motion</Link>. Select the <strong>Intro</strong> tab.
        Set these parameters:
      </p>
      <ul>
        <li><code>v₀</code> (initial speed): <strong>20 m/s</strong></li>
        <li><code>θ</code> (launch angle): <strong>30°</strong></li>
        <li><code>g</code> (gravity): <strong>9.8 m/s²</strong></li>
        <li><code>y₀</code> (starting height): <strong>0 m</strong></li>
        <li><code>b</code> (drag factor): <strong>0</strong></li>
      </ul>
      <p>Turn on the <strong>Grid</strong> and <strong>Trajectory</strong> layers. Turn off Velocity and Components.</p>

      <h3>Prediction question</h3>
      <p>
        Ask students: &ldquo;If you launch at 30° and then at 60°, keeping speed and gravity the same,
        will the ball land at the same distance, a shorter distance, or a longer distance?&rdquo;
        Have each student write their prediction.
      </p>

      <h3>Procedure</h3>
      <ol>
        <li>With θ = 30°, note the range reading displayed below the diagram. (Expected: approximately 35.3 m.)</li>
        <li>Change θ to 60°. Note the new range. (Expected: approximately 35.3 m &mdash; the same.)</li>
        <li>Switch to the <strong>Compare</strong> tab and set the two angles to 30° and 60° to see both trajectories overlaid.</li>
        <li>Try other complementary pairs: 20° and 70°, 15° and 75°. Record each range.</li>
        <li>Try 45°. Ask: &ldquo;Is this range longer, shorter, or the same as the others?&rdquo; (Expected: longest range for any angle.)</li>
      </ol>

      <h3>Expected observation</h3>
      <p>
        Complementary angles produce the same range. 45° gives the maximum range.
        The 30° trajectory is flatter (lower height, longer horizontal travel per second); the 60°
        trajectory is taller (greater height, shorter horizontal travel per second). Both land at the
        same point.
      </p>

      <h3>Explanation</h3>
      <p>
        Range = V₀² sin(2θ) / g. Since sin(2θ) = sin(180° − 2θ), the pairs θ and (90° − θ) give
        the same value of sin(2θ). At 45°, sin(90°) = 1 &mdash; the maximum possible value.
      </p>
      <p>
        <strong>Assumptions:</strong> This holds only when the launch and landing heights are equal,
        speed is fixed, gravity is uniform, and there is no air resistance. Changing any of these
        breaks the symmetry. Students can verify this by setting y₀ &gt; 0 or b &gt; 0 and
        comparing the ranges again.
      </p>

      <h3>Common misconception</h3>
      <p>
        &ldquo;A higher angle always means a longer throw.&rdquo; Students often assume that throwing
        upward gives more distance. The simulation shows that beyond 45°, increasing the angle
        <em> decreases</em> the range because more of the initial velocity goes into height rather
        than horizontal distance.
      </p>

      <h3>Follow-up question</h3>
      <p>
        &ldquo;What happens to the complementary-angle symmetry when you add air resistance?
        Set b to 0.1 and compare 30° and 60° again. Which angle now gives the longer range, and why?&rdquo;
      </p>

      <hr className="my-10 border-fb-rule/60" />

      <h2 id="shm-activity">Simple Harmonic Motion: period and length</h2>
      <p className="text-xs font-mono text-fb-dim mb-2">
        Class 9&ndash;10 &middot; 15 minutes &middot; <Link href="/shm">Open simulation</Link>
      </p>
      <p>
        <strong>Setup:</strong> Open the Pendulum tab. Set L = 1 m, θ₀ = 10°, g = 9.8 m/s², b = 0.
      </p>
      <p>
        <strong>Question:</strong> &ldquo;If you double the string length to 2 m, does the period double?&rdquo;
      </p>
      <p>
        <strong>Procedure:</strong> Note the period at L = 1 m (approximately 2.0 s). Change L to 2 m.
        The period increases to approximately 2.8 s &mdash; not double, because period is proportional
        to √L.
      </p>
      <p>
        <strong>Expected observation:</strong> Doubling the length increases the period by a factor of √2 ≈ 1.41,
        not 2. Amplitude (for small angles) does not affect the period.
      </p>
      <p>
        <strong>Model limitation:</strong> The simulation uses the small-angle approximation for the
        Pendulum tab. At large angles (above about 20°), the true period deviates from the formula T = 2π√(L/g).
      </p>

      <hr className="my-10 border-fb-rule/60" />

      <h2 id="electrostatics-activity">Electrostatics: Coulomb&rsquo;s law and distance</h2>
      <p className="text-xs font-mono text-fb-dim mb-2">
        Class 10&ndash;11 &middot; 15 minutes &middot; <Link href="/electrostatics">Open simulation</Link>
      </p>
      <p>
        <strong>Setup:</strong> Charges tab. Set q₁ = +5 µC, q₂ = −5 µC, r = 1 m. Turn on Force Vectors.
      </p>
      <p>
        <strong>Question:</strong> &ldquo;If you halve the distance to 0.5 m, how does the force change?&rdquo;
      </p>
      <p>
        <strong>Procedure:</strong> Note the force magnitude at r = 1 m. Change r to 0.5 m. The force
        quadruples because F ∝ 1/r². Try r = 0.25 m to confirm.
      </p>
      <p>
        <strong>Expected observation:</strong> The force increases by a factor of 4 when distance is halved.
        Field lines become denser between the charges.
      </p>
      <p>
        <strong>Model limitation:</strong> This simulation models point charges in free space. Real charges
        on conductors redistribute, and dielectric materials between them reduce the effective force.
      </p>

      <hr className="my-10 border-fb-rule/60" />

      <h2 id="optics-activity">Optics: finding the critical angle</h2>
      <p className="text-xs font-mono text-fb-dim mb-2">
        Class 10&ndash;11 &middot; 15 minutes &middot; <Link href="/optics">Open simulation</Link>
      </p>
      <p>
        <strong>Setup:</strong> TIR tab. Set n₁ = 1.5 (glass), n₂ = 1.0 (air), θ₁ = 30°.
      </p>
      <p>
        <strong>Question:</strong> &ldquo;At what angle does the refracted ray disappear?&rdquo;
      </p>
      <p>
        <strong>Procedure:</strong> Slowly increase θ₁ from 30° toward 42°. At approximately 42°
        (the critical angle for glass-to-air), the refracted ray vanishes and all light reflects
        internally. Try the &ldquo;Diamond Sparkle&rdquo; preset to see the same effect with a higher
        refractive index.
      </p>
      <p>
        <strong>Expected observation:</strong> Total internal reflection occurs when θ₁ ≥ arcsin(n₂/n₁).
        For glass-to-air, this is about 42°. For diamond (n₁ = 2.42), it is about 24°, which is why
        diamonds sparkle.
      </p>

      <hr className="my-10 border-fb-rule/60" />

      <h2 id="thermo-activity">Thermodynamics: temperature and molecular speed</h2>
      <p className="text-xs font-mono text-fb-dim mb-2">
        Class 11 &middot; 15 minutes &middot; <Link href="/thermodynamics">Open simulation</Link>
      </p>
      <p>
        <strong>Setup:</strong> Gas Particles tab. Set T = 300 K, M = 28 g/mol (N₂). Turn on Speed Colors.
      </p>
      <p>
        <strong>Question:</strong> &ldquo;If you double the temperature to 600 K, do the molecules move twice as fast?&rdquo;
      </p>
      <p>
        <strong>Procedure:</strong> Observe the particle speeds at 300 K. Change T to 600 K. The particles
        move faster, but the average speed increases by a factor of √2 ≈ 1.41, not 2, because average
        speed ∝ √T.
      </p>
      <p>
        <strong>Expected observation:</strong> The speed distribution shifts right and broadens. Turn on
        Speed Distribution to see the histogram change shape.
      </p>
      <p>
        <strong>Model limitation:</strong> The particle motion on screen is illustrative &mdash;
        particle positions are randomised for visual clarity, not sampled from a physically accurate
        Maxwell&ndash;Boltzmann velocity distribution. The Speed Distribution histogram does show
        the correct analytical distribution for the given temperature and molar mass.
      </p>

      <hr className="my-10 border-fb-rule/60" />

      <h2 id="modern-activity">Modern Physics: photoelectric threshold</h2>
      <p className="text-xs font-mono text-fb-dim mb-2">
        Class 12 &middot; 15 minutes &middot; <Link href="/modern-physics">Open simulation</Link>
      </p>
      <p>
        <strong>Setup:</strong> Photoelectric tab. Load the &ldquo;Cs + Violet Light&rdquo; preset
        (φ = 2.1 eV, λ = 400 nm).
      </p>
      <p>
        <strong>Question:</strong> &ldquo;If you increase the wavelength from 400 nm (violet) to 700 nm (red),
        do electrons still get ejected?&rdquo;
      </p>
      <p>
        <strong>Procedure:</strong> Increase λ from 400 nm in steps of 50 nm. At approximately 590 nm
        (the threshold wavelength for caesium), electron emission stops. Increasing intensity at 700 nm
        does not restart it &mdash; only shorter wavelength (higher energy photons) will.
      </p>
      <p>
        <strong>Expected observation:</strong> Below the threshold frequency, no electrons are emitted
        regardless of intensity. This contradicts classical wave theory and demonstrates the
        photon model of light.
      </p>

      <hr className="my-10 border-fb-rule/60" />

      <h2>Using Fizzix in class</h2>
      <h3>Before class</h3>
      <ol>
        <li>Open the simulation and try the activity yourself to verify the settings.</li>
        <li>Identify which parameters to focus on and which to leave at defaults.</li>
        <li>Prepare the prediction question to pose before changing the variable.</li>
      </ol>

      <h3>During class</h3>
      <ol>
        <li><strong>Project the simulation</strong> on a screen and demonstrate the basic controls.</li>
        <li><strong>Ask the prediction question</strong> before changing the variable. Have students commit to an answer.</li>
        <li><strong>Let students try</strong> on their own devices. All they need is a browser &mdash; phones work fine.</li>
        <li><strong>Use presets</strong> to jump to specific starting configurations.</li>
        <li><strong>Toggle layers</strong> to progressively reveal details: start with just the trajectory, then add vectors.</li>
      </ol>

      <h3>After class</h3>
      <p>
        Students can revisit the same simulation at home. Once they have loaded a simulation while
        online, it stays cached on their device for offline use. The built-in quiz questions let
        them test their understanding.
      </p>

      <h2>Accessibility</h2>
      <p>
        Fizzix works on any device with a modern browser. Sliders and buttons have accessible labels
        and respond to keyboard input. When a student&rsquo;s device has reduced-motion preferences enabled,
        CSS animations are suppressed and simulation animations display static positions instead.
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
        <li><Link href="/guide/topics">Topic Reference</Link> &mdash; parameters, layers, and presets for each simulation.</li>
      </ul>
    </article>
  )
}
