# Homepage Design: The Living Physics Atlas

## Creative Direction

**Concept:** A precision scientific atlas — the visual confidence of an editorial publication, the curiosity of an interactive museum exhibit, the clarity of a well-designed instrument panel.

**Why this fits Fizzix:** Students arrive at a landing page expecting a quick-scan of what's available and a fast route in. The atlas metaphor treats each physics topic as a specimen to explore, inviting curiosity without demanding commitment. The dark canvas provides theater-like focus on the illustrations while establishing scientific credibility.

## Visual Language

### Color Palette
Derived from the Fizzix logo (orange orbital atom on dark background):
- **Background:** `#0C1222` (deep navy) — darker than typical dark modes, creates depth
- **Surface:** `#141E33` (card background) — subtle lift from the canvas
- **Border:** `#1E2D4A` (card edges) — visible but restrained separation
- **Accent:** `#E8740C` (logo orange) — used sparingly for badges, icons, hover states
- **Text:** Slate scale (`slate-100` through `slate-500`) — never pure white

### Typography
System stack via Next.js Geist fonts. Hierarchy:
- `text-3xl font-extrabold` — brand name only
- `text-lg font-bold` — section headings
- `text-[0.9375rem] font-bold` — card titles (15px, between sm and base)
- `text-[0.8125rem]` — descriptions (13px, readable without competing)
- `text-[10px] font-mono` — class range badges

### Illustration System
Each topic card has a custom SVG illustration (240×160 viewBox) with:
- Radial gradient glow at the illustration center
- Topic color as primary stroke/fill
- Physics-accurate visual shorthand (parabolic trajectory, sine wave, field lines, lens refraction, particle motion, electron orbitals)
- CSS animations appropriate to each topic's physics
- `max-h-[160px]` constraint to prevent vertical expansion

## Page Structure

### Hero Section (min-h-screen)
1. **Brand mark** — Orange atom SVG (3 orbital ellipses + center dot) + "Fizzix" h1
2. **Tagline** — "Free physics simulations for Class 6–12"
3. **Feature line** — "No login · Works offline · Hindi & English"
4. **Topic grid** — 3×2 on desktop, 2×3 on tablet, 1×6 on mobile

### Topic Cards
Each card is a `<Link>` to `/{slug}` with:
- Illustration area (aspect-[5/3]) with hover scale (1.04×)
- Info section: title, description, class range badge
- Hidden hover CTA: "Start exploring →" slides in from left
- Hover border glow: inset colored shadow + outer shadow in topic color
- Entrance animation: `atlas-card-enter` (fade up from 20px below) with staggered delays (50ms–400ms per child)

### Value Props Section
"Built for how students actually learn" — three columns at md+:
- No account needed (door/arrow icon)
- Works offline (wifi-off icon)
- Hindi & English (translation icon)

### Footer
Minimal: AtomMark + "Fizzix" + "Free physics lab for Indian students"

## Motion Design

### Ambient Animations (CSS only)
- **Orbital background:** 3 slowly rotating ellipses (30s/20s cycles, 3.5% opacity) — visible only on close inspection
- **Dot grid:** Subtle radial gradient dots at 32px intervals, 2.5% white opacity
- **Projectile:** Floating ball with `atlas-float` (4s ease-in-out translateY)
- **SHM:** Pulsing endpoint with `atlas-pulse` (3s opacity cycle)
- **Electrostatics:** Field line flow with `atlas-ray` (2s stroke-dashoffset)
- **Thermodynamics:** Three particle animation groups with different paths and timings (3s/3.7s/4.3s)
- **Modern Physics:** Three electron orbit rotations (4s/6s/8s) around a central nucleus

### Interactive Animations
- Card hover: `translateY(-4px)` with cubic-bezier(0.22, 1, 0.36, 1)
- Illustration scale: 1.04× on card hover/focus
- CTA slide-in: opacity + translateX transition (300ms)
- Border glow: opacity transition (300ms)

### Reduced Motion
Global rule in `globals.css` sets `animation-duration: 0.01ms` and `transition-duration: 0.01ms` for `prefers-reduced-motion: reduce`. Verified via Playwright: both values read as `1e-05s`.

## Responsive Breakpoints

| Viewport | Grid | Cards | Notes |
|----------|------|-------|-------|
| ≥1024px (lg) | 3 columns | ~389px wide | Max-width 76rem |
| ≥640px (sm) | 2 columns | ~370px wide | Gap adjusts |
| <640px | 1 column | Full width | 16px side padding |
| 320px | 1 column | Full width | No horizontal scroll verified |

## Accessibility

- All illustrations: `aria-hidden="true"` (decorative)
- Cards: `<Link>` elements with `focus-visible:ring-2 ring-atlas-accent ring-offset-2 ring-offset-atlas-bg`
- Keyboard navigation verified: Tab cycles through all 6 topic links
- Focus indicator: 2px solid blue outline with 2px offset
- `prefers-reduced-motion` honored
- No scroll hijacking, no mandatory intro, navigation never delayed by animation
- Color contrast: slate-400 on #141E33 meets WCAG AA for large text; badges use high-contrast white on colored backgrounds

## Implementation Notes

- Server component — no `'use client'` directive needed
- All animations are CSS-only (no JS animation libraries)
- SVG illustrations are inline React components for full CSS animation control
- Topic data sourced from `getAllModules()` in `src/simulations/registry.ts`
- No fabricated testimonials, counts, awards, or performance statistics
- All links point to existing simulation pages (verified: all 6 return HTTP 200)
- No dead links, placeholder actions, or links to unbuilt pages
