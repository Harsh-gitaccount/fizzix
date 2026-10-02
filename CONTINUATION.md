# Continuation Checkpoint

## Session State
- **Branch**: `homepage/living-physics-atlas`
- **Base commit**: `47a5ea9` (stabilization baseline)
- **TypeScript**: 0 errors
- **Production build**: success

## Homepage Branch Commits

1. `0b5526d` — feat: homepage — The Living Physics Atlas (original six-card grid)
2. `e7129fd` — feat: homepage redesign — interactive editorial cover
3. `9bd1edf` — chore: ignore e2e screenshot results

## Handoff Fixes (this session, uncommitted → to be committed)

### 1. `.gitignore` narrowed
Blanket `/e2e/results` replaced with targeted rules for disposable directories only (`/e2e/results/redesign`, `/e2e/results/homepage`). Already-tracked evidence files preserved.

### 2. Offline claim qualified
`src/app/page.tsx` line 65: "Works offline once installed" → "Lessons cached offline after first visit". Reflects actual SW behavior (precaches only `/`, manifest, icons; lessons cached on visit).

### 3. Mobile atlas ARIA semantics
`src/app/_components/AtlasIndex.tsx`: Changed mobile topic selector from improper `role="tablist"`/`role="tab"` to `role="group"` with `aria-pressed` buttons. Desktop already correct.

### 4. Mobile menu keyboard
`src/app/_components/Header.tsx`: Added Escape-to-close, focus-on-open (first link), focus-return-on-close (toggle button). `aria-controls="mobile-menu"` links button to panel.

### 5. Smoke check hardened
`e2e/scripts/smoke-check.mjs`: Slider interaction now reads value before/after click, asserts change. `sliderWorked` added to pass criteria.

### 6. Documentation updated
`HOMEPAGE_DESIGN.md`, `HOMEPAGE_VERIFICATION.md`, `CONTINUATION.md` rewritten to describe current revision (`e7129fd`+).

### 7. Screenshots saved
`e2e/results/evidence/`: desktop-1440-full, desktop-atlas-selected, mobile-390-full, mobile-390-menu-open.

## Next Step
Visual acceptance review. Design not yet approved.
