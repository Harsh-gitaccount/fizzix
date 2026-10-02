# Homepage Design

**Branch:** `homepage/living-physics-atlas`
**Revision:** `e7129fd` + handoff fixes

## Composition

### Header (`_components/Header.tsx`)
Fixed-position nav with backdrop blur. Desktop: inline links + "Enter the lab" CTA. Mobile: hamburger toggle with `aria-expanded`, Escape-to-close, focus-on-open, focus-return-on-close. `aria-controls="mobile-menu"` links button to panel.

### Hero Section
Asymmetric two-column layout (`grid-cols-1 lg:grid-cols-[1fr_1.3fr]`):
- **Left:** Serif headline ("Physics, in your hands."), subtitle, "Explore topics" anchor, three feature pills (no login, Hindi & English, offline after first visit).
- **Right:** Interactive projectile-motion experiment (`_components/HeroExperiment.tsx`). SVG with animated ball, angle slider, real-time readouts (range, height, time). Launch/Reset controls. Honors `prefers-reduced-motion`.

### Pedagogy Section (`#how-it-works`)
Warm paper background (`#FAF6F0`). Three numbered steps: Change a variable, Observe the result, Understand why. Serif heading, dark-on-warm text.

### Atlas Index (`#atlas`, `_components/AtlasIndex.tsx`)
- **Desktop:** Two-column layout. Left: numbered topic list with `aria-pressed` selection buttons. Right: preview card with SVG illustration, topic name, class range badge, description, "Open lesson" link.
- **Mobile:** Horizontal pill selector (`role="group"`, `aria-label`, `aria-pressed` on each button) + single preview card below.

### Footer
AtomMark + "Fizzix" + tagline. No dead links.

## Visual Language

### Colors
- Background: `#0C1222` (deep navy)
- Surface: `#141E33` (card lift)
- Accent: `#E8740C` (logo orange)
- Warm section: `#FAF6F0` with `#2D1810`/`#5C4A3A` text

### Typography
- Headlines: Source Serif 4 (variable `--font-serif`)
- Body: system stack
- Monospace: for measurements, badges, readouts

### Illustrations (`_components/TopicIllustrations.tsx`)
Inline SVG components with CSS animations, one per topic. Each receives a `color` prop.

## Accessibility
- Mobile atlas: `role="group"` + `aria-pressed` buttons (not tablist)
- Desktop atlas: `aria-pressed` buttons
- Mobile menu: `aria-expanded`, `aria-controls`, Escape closes, focus managed
- All decorative SVGs: `aria-hidden="true"`
- Hero experiment: `role="img"` with descriptive `aria-label`
- Slider: full ARIA value attributes
- `prefers-reduced-motion` honored (experiment stops animation, shows ball at apex)

## Offline Behavior
Service worker precaches only `/`, `/manifest.json`, and icons. Lesson pages are cached after first visit (stale-while-revalidate). The homepage says "Lessons cached offline after first visit" — not "works offline once installed."

## Implementation
- `page.tsx` is a server component; client interactivity in leaf components
- Topic data from `getAllModules()` in `src/simulations/registry.ts`
- No fabricated statistics, testimonials, or awards
- All lesson links verified working (6/6 return HTTP 200)
