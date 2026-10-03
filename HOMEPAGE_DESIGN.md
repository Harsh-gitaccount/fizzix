# Homepage Design — The Fizzix Fieldbook

**Branch:** `claude/brave-ramanujan-s4hhf9`
**Concept:** Interactive scientific fieldbook — warm paper aesthetic, open experiment stage

## Brand

- **Logo:** `public/fizzix-logo.png` — stylized "F" with book/page elements, orange orbital ellipse, "Fizzix" wordmark in navy (#1B2249) with orange dots on the i's
- The logo is used as an `<img>` via `next/image` in the Header and Footer. The old hand-coded AtomMark SVG is no longer used on the homepage or guide pages.

## Composition

### Header (`_components/Header.tsx`)
Fixed-position nav with backdrop blur on warm paper background (`fb-page`). Desktop: logo image + "Explore", "For teachers", "Guide" links + "Start experimenting" orange CTA. Mobile: hamburger toggle with `aria-expanded`, Escape-to-close, focus-on-open, focus-return-on-close. `aria-controls="mobile-menu"` links button to panel.

### Experiment Stage (`_components/FieldbookStage.tsx`)
Open experiment integrated directly into the page — no boxed card. The projectile motion diagram renders on the light paper background with navy ink and orange accent, like a physics textbook figure.

- **Chapter rail** (desktop only): numbered circles along the left edge linking to each topic lesson. Each circle uses the topic's color.
- **Title area**: mono label "EXPERIMENT 01 — PROJECTILE MOTION", serif heading "Physics, in your hands.", subtitle.
- **Open SVG diagram**: trajectory path, sampled dots, height/range annotations, launcher, angle arc, animated ball. Navy ink palette on light background.
- **Instrument strip**: slider control, readouts (range, height, time), Launch/Reset buttons, separated by ruled borders.
- **Model disclosure**: V₀ = 20 m/s · g = 9.81 m/s² · no drag + link to full simulation.

Physics calculations reused from HeroExperiment: `calcTrajectory(angleDeg)` and `calcPositionAtTime(angleDeg, t)` with V0=20, G=9.81.

### Learning Journey
Warm paper background (`fb-paper`). Three numbered steps with connecting vertical line: Change a variable, Observe the result, Understand why. Serif step numbers in orange circles.

### Fieldbook Chapters (`#chapters`)
Left-aligned section title "THE FIELDBOOK" / "Six chapters of experiments". 3-column grid (desktop), single column (mobile) of topic cards. Each card:
- Dark field (`fb-field`) illustration area using existing `TopicIllustrations.tsx` SVGs with chapter number label
- Light paper info area with topic name, class range badge, description
- Entire card is a link to the lesson; hover lifts illustration and changes title color

### Feature Pills
Centered row: No login required · Hindi & English · Lessons cached offline after first visit · Free forever

### Footer
Logo image (dimmed), guide navigation links, tagline.

## Visual Language

### Colors (Tailwind: `fb.*`)
- Page: `#FAF9F6` (warm off-white paper)
- Ink: `#1B2249` (logo navy)
- Accent: `#E8740C` (logo orange)
- Accent hover: `#D16A0A`
- Muted: `#6B7186` (body text gray)
- Rule: `#E5E2DC` (ruling lines)
- Dim: `#9B9EAD` (annotations)
- Paper: `#F3F1EC` (section backgrounds)
- Field: `#141830` (dark containers for illustrations)

### Typography
- Headlines: Source Serif 4 via `--font-serif` CSS variable (loaded in root layout)
- Body: system stack
- Labels/readouts: monospace

### Illustrations
Existing `TopicIllustrations.tsx` SVGs rendered inside dark `fb-field` containers, preserving their designed appearance.

## Accessibility
- Mobile menu: `aria-expanded`, `aria-controls`, Escape closes, focus managed
- Experiment: `role="img"` with descriptive `aria-label`, slider with full ARIA value attributes
- `prefers-reduced-motion` honored (animation stops, ball at apex)
- Chapter rail links have descriptive `aria-label`
- All interactive elements keyboard-accessible

## Offline Behavior
Unchanged from previous revision. Service worker precaches `/`, `/manifest.json`, and icons. Lesson pages cached after first visit. Homepage says "Lessons cached offline after first visit."

## Safety Constraints
- No fabricated statistics, testimonials, or awards
- No dead links or placeholder actions
- No chatbot UI, dependencies, or placeholder
- No scroll hijacking, no mandatory intro
- Navigation never delayed by animation
- `prefers-reduced-motion` honored
- All 6 lesson links verified working (HTTP 200)
- Offline claim qualified accurately
