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
- Footer with logo and tagline
- Wraps content in `.guide-prose` for typography styling

## Content Sources

All documentation content is derived from the actual codebase:

- **Topic data** (`src/simulations/registry.ts`): module names, slugs, descriptions, class ranges
- **Parameter lists** (`src/simulations/*/module.ts`): extracted from each module's `params` array with exact ranges and units
- **Layer lists** (`src/simulations/*/module.ts`): extracted from each module's `layers` array
- **Preset examples** (`src/simulations/*/presets.ts`): representative names from each module's preset list
- **Offline behavior** (`public/sw.js`): precache strategy and stale-while-revalidate documented accurately
- **Accessibility features**: derived from actual component implementations (Header.tsx, FieldbookStage.tsx)

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
