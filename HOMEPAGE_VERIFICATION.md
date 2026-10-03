# Homepage Verification Report

**Branch:** `homepage/living-physics-atlas`
**Revision:** Fieldbook revision — corrections and completions
**Date:** 2026-10-03

## Test Environment
- Next.js 16.3.8 (Turbopack dev + production build)
- Chromium headless via Playwright
- Node.js 22.22.0

## Build

| Check | Result |
|-------|--------|
| TypeScript (`tsc --noEmit`) | 0 errors |
| Production build (`next build`) | Success, `/` static |
| Guide pages static | `/guide`, `/guide/teachers`, `/guide/topics` all `○` static |

## Navigation — Lesson Links

| Topic | href | HTTP Status |
|-------|------|-------------|
| Projectile Motion | `/projectile-motion` | 200 |
| Simple Harmonic Motion | `/shm` | 200 |
| Electrostatics & Circuits | `/electrostatics` | 200 |
| Optics & Light | `/optics` | 200 |
| Thermodynamics | `/thermodynamics` | 200 |
| Modern Physics | `/modern-physics` | 200 |

## Navigation — Guide Links

| Page | href | HTTP Status |
|------|------|-------------|
| Getting Started | `/guide` | 200 |
| Teacher Guide | `/guide/teachers` | 200 |
| Topic Reference | `/guide/topics` | 200 |

## Focused Checks

| Check | Detail | Result |
|-------|--------|--------|
| chapter-aria | `role="tab"` count=0, `aria-pressed` count=6 | PASS |
| diagram-bounds | SVG viewBox height=320, WORLD_H=17 (60° maxH≈15.3m fits) | PASS |
| guide-navigation | Getting Started page loads correctly | PASS |
| on-this-page-links | `<nav aria-label="On this page">` present | PASS |
| tab-names-i18n | "Total Internal Reflection" present, raw "Tir" absent | PASS |

## Documentation Corrections Verified

| Claim | Before | After | Verified |
|-------|--------|-------|----------|
| Speed Distribution | "shows the correct analytical Maxwell–Boltzmann distribution" | "bins the simulated particle speeds" | Yes — matches thermoRenderer.ts and Scene3DGas.tsx |
| Reduced motion | "simulation animations show static positions" | "Lesson-page canvas animations do not currently check the preference" | Yes — only CSS global rule + homepage FieldbookStage check |
| Tab names | `t.id.replace(/-/g, ' ')` title-case conversion | `t(tab.labelKey, 'en')` i18n lookup | Yes — "Total Internal Reflection" not "Tir" |
| Optics TIR | "the refracted ray vanishes" at critical angle | "refracted ray runs along the interface" at critical angle, TIR above it | Yes — physically correct |

## Screenshot Evidence

Saved to `e2e/results/evidence/`:

| File | Description |
|------|-------------|
| `desktop-homepage.png` | Full homepage at 1440×900 |
| `desktop-chapter-selection.png` | Chapter explorer with third topic selected |
| `desktop-teacher-guide.png` | Full Teacher Guide at 1440×900 |
| `desktop-topic-reference.png` | Full Topic Reference at 1440×900 |
| `desktop-getting-started.png` | Full Getting Started at 1440×900 |
| `mobile-homepage.png` | Full homepage at 390×844 |
| `mobile-teacher-guide.png` | Full Teacher Guide at 390×844 |
| `mobile-topic-reference.png` | Full Topic Reference at 390×844 |
| `mobile-guide-nav-open.png` | Guide page with mobile nav open |

## Console Errors
Only `ERR_TUNNEL_CONNECTION_FAILED` from proxy environment (analytics hosts blocked). No application errors.

## Safety Constraints
- No fabricated testimonials, counts, awards, or statistics
- No dead links or placeholder actions
- No scroll hijacking or mandatory intro
- Navigation never delayed by animation
- `prefers-reduced-motion` honored (CSS global + homepage experiment)
- All lesson links verified working
- Offline claim qualified: "Lessons cached offline after first visit"
- No chatbot UI or dependencies
- All guide links lead to completed, useful content
