# Continuation Checkpoint

## Session State
- **Branch**: `claude/brave-ramanujan-s4hhf9`
- **Base commit**: `7523ff0c2e3164d205036a85d81d12ae0312f997`
- **Last batch**: batch-21 (F26 SW lifecycle verification, final reconciliation)
- **TypeScript**: 0 errors
- **ESLint**: 0 errors, 0 warnings (src/)
- **Dash lint**: 0 violations
- **Unit tests**: 356/356 passing
- **npm audit**: 4 vulnerabilities (down from 23→15→4)

## Commits
1. `6d3fa31` -- Batch 1: F01, F02, F03, F04, F05-partial, F08, F09, F25
2. `4d7a196` -- Batch 2: F06, F07, F13, F14, F15, F19, F21
3. `845b3b0` -- Batch 3: F10, F11
4. `0f6e0cf` -- Batch 4: F12, F17, F20
5. `180969a` -- Batch 5: F16, F18, F22-partial
6. `fcb3b41` -- Batch 6: F05 virtual ray rendering
7. `6be4bac` -- Batch 7: Verification response (F01/F07/F09/F10/F12/F14/F17/F19/F22/F26)
8. `b9bf820` -- Batch 8: Second verification response
9. `e97d111` -- Batch 9: Third verification response
10. `40854b6` -- Batch 10: Test gaps closed, poolVersion policy
11. `d54583a` -- Batch 11: F03/F05/F06/F12/F21/F24 physics/content corrections
12. `1119f50` -- Batch 12: F11 gas PV/labels, F23 animation performance profiling
13. `2f04877` -- Batch 13: F15 accessibility, F21 trajectory cap
14. `5affd8b` -- Batch 14a: F15 arrow key tab navigation
15. `79611eb` -- Batch 14b: F22 dependency upgrades (vitest 2→5, eslint-config-next 14→15)
16. `9933f38` -- Batch 14c: F15 3D keyboard camera controls
17. `a44769f` -- Batch 15: Keyboard widget isolation, ARIA panel targets, @types/node alignment
18. `8672430` -- Batch 16: F12 rays toggle, F23 resource disposal, F24 mass preset, F26 static caching
19. `806880b` -- Batch 17: F03 error metric, F06 quiz subcriteria, F11 KE qualifier + histogram
20. `049bc32` -- Batch 18: Verification reproduced failures, quiz corrections, histogram/KE/volume disclosure
21. `927330e` -- Batch 19: F12 3D tools, F11 histogram scale, F23 disposal test, F06/F11 dispositions
22. `3eb950b` -- Batch 20: F22 dependency migration (Next 14→16, Prisma CLI 8-rc→7, postcss 8.5.22→8.5.28)
23. `47abf13` -- Batch 20b: docs: browser acceptance results, promote F12/F14/F15/F23/F24 to DONE
24. *(pending)* -- Batch 21: F26 SW lifecycle verification, final reconciliation

## Batch 11 Changes

### F03: Small-angle approximation disclosure
- `src/components/simulation/ControlPanel.tsx`: Amber warning shown when pendulum theta0 > 15°, displaying approximation error percentage.
- `src/lib/i18n.ts`: Added `approx.warning` translation key.

### F05: Principal ray geometry fix
- `src/lib/canvas/opticsRenderer.ts`: `drawPrincipalRays` now receives `imgScreenH` (final height) instead of `animImgH` (animated). Rays point to the correct image position throughout the reveal.

### F12: Vector layer gating fix
- `src/components/simulation/Canvas2D.tsx`: Removed hardcoded tab-name gating (`showVectors` check). Vector layers now work on any tab in any topic.

### F21: Acceleration vector and symbol corrections
- `src/lib/canvas/renderer2d.ts`: `PARAM_SYMBOLS.drag` changed from 'Cd' to 'b'. `drawAccelerationVector` now computes net acceleration including drag force. Legend label shows "Net Acceleration" when drag > 0.
- `src/lib/i18n.ts`: Added `canvas.acceleration` translation key.

### F06: Quiz distractor fix
- `src/simulations/electrostatics/quiz.ts`: `elec-e4` fake distractor `P = IV²` replaced with real formula `F = qE`.

### F24: Preset hookQuestion corrections
- `src/simulations/projectile-motion/presets.ts`:
  - `low-drive`: hookQuestion changed from false premise "Why does a low throw cover more ground?" to neutral "How does a low angle change the trajectory shape?"
  - `moon-vs-earth`: hookQuestion changed from statement "Same throw, different worlds" to question "How far would this same throw go on the Moon?"
  - `does-mass-matter`: hookQuestion reworded to "Does changing the mass change the trajectory?", added `compareParams` with identical params, `defaultTab` set to `compare` so students see overlapping trajectories.

## Batch 12 Changes

### F11: Gas PV/pressure deduplication and PV derived value
- `src/lib/physics/thermodynamics.ts`: Added PV product derived value (`PV = P * V/1000` in Joules). avgKE symbol changed from `KE` to `⟨KE⟩` for disambiguation.
- `src/simulations/thermodynamics/module.ts`: Added `pv` to `derivedValueKeys`.
- `src/lib/three/gasBox3D.ts`: Replaced inline pressure calculation with `idealGasPressure()`/`effectiveVolume()` imports.
- `src/lib/canvas/thermoRenderer.ts`: Replaced inline pressure calculation with `idealGasPressure()`/`effectiveVolume()`.

### F23: Animation performance profiling
- `e2e/perf-profile.spec.ts` (new): Playwright-based test measuring rAF frame times (idle + active) across all 6 topics and topic-switching latency.
- Results: all topics avg ~16.5ms (~60fps), p95 < 33ms (30fps budget). Topic switching 0.9-1.4s. No regression.

## Batch 13 Changes

### F15: Accessibility improvements
- `src/components/simulation/LayerToggles.tsx`: `aria-pressed` on layer and tool toggles.
- `src/components/simulation/TabBar.tsx`: `role="tablist"`, `aria-controls`, `tabIndex` roving.
- `src/components/simulation/SimulationPage.tsx`: Panel tabs get `role="tabpanel"`, `aria-labelledby`.
- `src/components/simulation/PlaybackBar.tsx`: `aria-pressed` on sound/pause toggles, "Replay" label.
- `src/components/simulation/PresetStrip.tsx`: `aria-pressed` on active preset.
- `src/components/quiz/QuizPanel.tsx`: `role="radiogroup"` + `role="radio"` + `aria-checked`.
- `src/components/ui/Toast.tsx`: `role="status"` + `aria-live="polite"`.
- `src/components/simulation/Scene3D.tsx`, `Scene3DGas.tsx`: `role="img"` + `aria-label`.
- `src/components/simulation/TopBar.tsx`: Language toggle `aria-label`.

### F21: Trajectory cap raised
- `src/lib/physics/drag.ts`: maxSteps raised from 100001 to 250001 (100s → 250s), covering worst-case slider combo (v0=50, theta=90, g=0.5, y0=50 → ~214s TOF).

## Batch 14 Changes

### F15: TabBar arrow key navigation
- `src/components/simulation/TabBar.tsx`: WAI-ARIA keyboard navigation added. ArrowRight/ArrowLeft cycle tabs, Home/End jump to first/last. Focus follows selection. `handleTabChange` wrapped in `useCallback` to satisfy exhaustive-deps.

### F22: Dependency remediation
- `package.json`: vitest `^2.1.9` → `5.0.3`, added `vite@^6.4.0` and `@testing-library/dom` as explicit dev deps. `eslint-config-next` `14.2.35` → `15.5.27`.
- `src/__tests__/sync-client.test.ts`: Mock typing adapted for vitest 5's stricter `vi.fn()` return type.
- **Resolved advisories**: `@vitest/mocker` path traversal, vite dev server exposure, esbuild dev server CORS, glob CLI injection (7 unique GHSAs).
- **Remaining**: 15 packages, 72 unique advisories — all in next 14.x chain (postcss, next framework) and prisma chain (hono, valibot, lodash). Both require major framework upgrades not safe to attempt in this session.

## Batch 16 Changes

### F12: Optics rays toggle (reopened as PARTIAL)
- `src/lib/canvas/opticsRenderer.ts`: `renderRefraction()` and `renderTIR()` gate ray drawing on `opts.activeLayers.rays !== false`. Angle arcs and labels stay visible.

### F23: Three.js resource disposal (reopened as PARTIAL)
- `src/lib/three/fieldView3D.ts`: `disposeSprite()` and `disposeGroup()` helpers. `clearScene()` disposes label1/label2 textures+materials and forceArrow1/forceArrow2 geometries+materials.

### F24: Mass preset distinct masses (reopened as PARTIAL)
- `src/simulations/projectile-motion/presets.ts`: `does-mass-matter` uses `mass: 1` / `mass: 10`, `drag: 0`.
- `src/lib/canvas/renderer2d.ts`: `mass: 'm'` in PARAM_SYMBOLS, "kg" unit in getDiffLabel.

### F26: Static asset caching
- `public/sw.js`: Static asset handler checks `res.ok` before `cache.put()`.

### Tests
- `src/__tests__/batch16-fixes.test.ts` (new): 5 tests for F12, F23, F24, F26.

## Batch 17 Changes

### F03: Period error metric
- `src/components/simulation/ControlPanel.tsx`: Borda approximation (θ²/16) replaces 1/cos(θ/2)-1. Warning labels it as "period error."
- `src/lib/i18n.ts`: Warning text updated.

### F06: Quiz subcriteria
- `src/simulations/projectile-motion/quiz.ts`: pm-m7 (qualifier + showMe), pm-h7 (showMe + explanation).
- `src/simulations/thermodynamics/quiz.ts`: thermo-h8 (expanded explanation).
- `src/simulations/modern-physics/quiz.ts`: mp-e9 ("for a given metal"), mp-h6 (question + explanation).

### F11: KE qualifier and histogram labels
- `src/lib/physics/thermodynamics.ts`: avgKE symbol `⟨KE⟩ₜᵣ`, label "Avg translational KE".
- `src/lib/canvas/thermoRenderer.ts`: Histogram axis labels (N, Speed →).
- `src/lib/i18n.ts`: Updated avgKE label.

## Batch 18 Changes

### Nonportable test rewrites
- `src/__tests__/batch16-fixes.test.ts`: F26 uses `path.resolve(__dirname)` + VM; F23 uses actual `createFieldView3D`. TS errors fixed (container, update signature, WebGLRenderer type).

### Quiz question corrections
- `src/simulations/projectile-motion/quiz.ts`: pm-m7 (explicit assumptions + T=2Vy/g), pm-h7 (fixture anchored, explanation corrected), dash-lint fixes.
- `src/simulations/thermodynamics/quiz.ts`: thermo-h8 (positive-evidence Brownian motion question).

### Scene3DGas histogram, KE, volume disclosure
- `src/components/simulation/Scene3DGas.tsx`: Histogram: title "(sim. units)", Y-axis "N" + ticks, X-axis "Speed ->". Volume panel: "Box is schematic; not to volume scale."
- `src/lib/physics/thermodynamics.ts`: totalKE symbol `KEₜᵣ`, label "Total translational KE."
- `src/lib/i18n.ts`: totalKE labels updated (en + hi).

### F03 reconciliation
- Status changed to ACCEPTED. Energy exact within small-angle model per independent verification.

## Batch 19 Changes

### F12: 3D tools hidden
- `src/components/simulation/LayerToggles.tsx`: Tools section hidden on 3D views via `is3DView` gate.
- `src/__tests__/layer-toggles-3d.test.ts` (new): 5 tests for 3D/2D tool visibility.

### F11: Numeric speed scale
- `src/components/simulation/Scene3DGas.tsx`: X-axis numeric ticks (0, mid, max), canvas height 110→120px.

### F23: Disposal test strengthened
- `src/__tests__/batch16-fixes.test.ts`: Tracks Texture, SpriteMaterial, CylinderGeometry, ConeGeometry, MeshPhongMaterial disposals specifically. try/finally cleanup.

### F06/F11: Explicit dispositions
- F06: DONE. opt-e8 retained as curriculum-aligned editorial choice.
- F11: DONE. Uniform speed initialization documented as model limitation.

## Batch 20 Changes

### F22: Next.js 14.2.35 → 16.3.8
- `package.json`: `next` upgraded to `^16.3.8`. Lint script: `next lint` → `eslint src/`.
- `tsconfig.json`: Auto-updated by Next 16 (`jsx: "react-jsx"`, `target: "ES2017"`, `.next/dev/types` include).
- postcss 8.5.22 → 8.5.28 (resolves path traversal CVEs).

### F22: Prisma CLI 8.0.0-rc.15 → 7.10.0
- `package.json`: `prisma` changed to `^7.10.0` (matches client).
- `prisma/schema.prisma`: Removed `url = env("DATABASE_URL")` (Prisma 7 format).
- `prisma.config.ts` (new): Schema path + datasource URL for CLI operations.
- `src/lib/db.ts`: `PrismaClient({ datasourceUrl: process.env.DATABASE_URL })`.
- Resolves hono (28 advisories), lodash (3), valibot (1) chains.

### Vulnerability summary
- 23 → 4 total (across all batches). Remaining 4 in prisma transitive deps (deepmerge-ts, mysql2); no runtime exposure.

### Browser acceptance (F12/F14/F15/F23/F24)
- 22/22 Chromium headless tests passed (production build on port 3099).
- F12: tools hidden on 3D (thermodynamics), visible on 2D (projectile-motion).
- F14: no horizontal scroll at 320/390/768/1440px.
- F15: tablist, aria-controls, aria-pressed, role=img, keyboard nav, radiogroup verified.
- F23: scene transitions (thermo↔projectile, field-3d tab switching) error-free.
- F24: mass preset activates compare mode.
- All 6 topics render without JS errors.

## Batch 21 Changes

### F26: Service worker browser verification
- 6/6 Chromium headless tests passed: SW registration, precaching, offline fallback, static asset caching, cache isolation.
- SW registers on topic pages only (via `useServiceWorker` hook in `SimulationPage`).

### Final reconciliation
- F26 promoted from PARTIAL to DONE.
- All stabilization checklist items complete.

## Final Status

### DONE (23 findings)
F01, F02, F04, F05, F06, F07, F08, F09, F10, F11, F12, F13, F14, F15, F16, F17, F18, F19, F20, F21, F23, F24, F25, F26

### ACCEPTED (1 finding)
- **F03**: Small-angle model by design. Energy conservation exact (deviation <1e-15). Borda period-error warning disclosed.

### PARTIAL (1 finding)
- **F22**: All framework upgrades done. 4 remaining vulns in prisma transitive deps (deepmerge-ts, mysql2), unfixable without breaking downgrade to prisma 6.x.

### Not verifiable in current environment
- Real mobile touch interaction (physical device required)
- Assistive technology / screen reader compatibility
- Multi-build service worker update lifecycle (requires two production builds on same origin)
- Database integration (no DATABASE_URL configured)
- GPU memory profiling (requires browser DevTools)
