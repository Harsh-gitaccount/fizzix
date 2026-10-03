# Documentation Content Map

## Routes

| Route | Page | Title | Status |
|-------|------|-------|--------|
| `/guide` | `src/app/guide/page.tsx` | Getting Started | Complete |
| `/guide/teachers` | `src/app/guide/teachers/page.tsx` | Teacher Guide | Complete |
| `/guide/topics` | `src/app/guide/topics/page.tsx` | Topic Reference | Complete |

## Shared Layout

`src/app/guide/layout.tsx` — provides:
- Header with logo, guide nav links, "Back to lab" link
- Desktop sidebar with guide navigation
- Mobile hamburger nav with `aria-expanded`/`aria-controls`
- Footer with logo and tagline
- Wraps content in `.guide-prose` for typography styling

## Features

- **On this page** — Getting Started and Teacher Guide have `<nav aria-label="On this page">` with anchor links to each section
- **Print styling** — `@media print` rules in globals.css hide nav/header/footer, adjust typography, and append URLs to internal links
- **Annotated illustration** — Getting Started includes an inline SVG diagram of the simulation interface layout (tabs, canvas, sliders, layers)

## Content Sources

All documentation content is derived from the actual codebase:

- **Topic data** (`src/simulations/registry.ts`): module names, slugs, descriptions, class ranges
- **Parameter lists** (`src/simulations/*/module.ts`): extracted from each module's `paramDefs` array with exact ranges and units
- **Layer lists** (`src/simulations/*/module.ts`): extracted from each module's `layerDefs` array
- **Tab names** (`src/lib/i18n.ts`): rendered via `t(tab.labelKey, 'en')` using the i18n dictionary, not string-manipulated IDs
- **Preset examples** (`src/simulations/*/presets.ts`): representative names from each module's preset list
- **Offline behavior** (`public/sw.js`): precache strategy and stale-while-revalidate documented accurately
- **Accessibility features**: derived from actual component implementations

## Content Accuracy Notes

- **Speed Distribution histogram** (thermodynamics): bins simulated particle speeds at each frame, not the analytical Maxwell–Boltzmann distribution. Documented as such in both Topic Reference model notes and Teacher Guide.
- **Reduced motion**: global CSS rule suppresses animation/transition durations. Homepage experiment checks `prefers-reduced-motion` and skips requestAnimationFrame. Lesson-page canvas animations do not check the preference. Documented accurately in both guides.
- **Optics TIR**: at the critical angle the refracted ray runs along the interface (90° from normal). Total internal reflection occurs above the critical angle. Teacher Guide corrected accordingly.

## Content Guidelines Applied

- No fabricated statistics, testimonials, or educational outcomes
- No fake search field or unsupported language switch
- No dead links — every visible link leads to completed, working content
- All claims about features verified against actual implementation
- Offline claim qualified accurately ("cached after first visit")
- Hindi support documented as it actually works (parameter labels, help text, layer names)
- No chatbot references

## Styling

Guide typography is handled by `.guide-prose` in `globals.css`:
- Headings: navy (#1B2249), h2 at 1.5rem bold, h3 at 1.125rem semibold
- Body text: #3D405B, 1.7 line height
- Links: orange (#E8740C) with underline
- Code: monospace on subtle paper background
- Lists: standard disc/decimal with comfortable spacing
- Print: header/footer/nav hidden, link URLs appended, page breaks managed
