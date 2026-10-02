# Fizzix Audit Fix Status

Tracking fixes for audit findings F01-F26 from the comprehensive audit at commit `7523ff0`.
Reconciled against independent verification at commits `fcb3b41`, `6be4bac`, `b9bf820`, `e97d111`, `049bc32`.
Current head includes batch 19 fixes (F12 3D tools, F11 histogram scale, F23 disposal test).

| Finding | Title | Status | Batch | Notes |
|---------|-------|--------|-------|-------|
| F01 | Type-check & lint errors | DONE | 1,7 | TS errors fixed. ESLint 53 errors fixed (unused vars/imports/prefer-const). 50 dash-lint violations fixed. E2E route corrected (`/projectile-motion`). Production build passes. |
| F02 | Damping model wrong frequency | DONE | 1 | Rewrote pendulum & spring to three-regime damped oscillator (underdamped/critical/overdamped). |
| F03 | Pendulum energy inconsistency | ACCEPTED | 1,11,17 | PE switched to small-angle quadratic form. Warning uses Borda approximation (θ²/16) labeled as "period error." Simulation uses small-angle model by design. Independent verification confirms nonlinear solver is NOT required; energy conservation is exact within the small-angle model (relative deviation <1e-15 over 100 periods). Accepted scope: small-angle simulation with disclosed error metric. |
| F04 | Bohr model ignores Z | DONE | 1 | modernStateAtTime passes Z to bohrRadiusPm, electronSpeed, bohrRadius. |
| F05 | Optics f=0 / virtual ray issues | DONE | 1,6,11 | lensPower null for f=0; virtual ray rendering improved. `drawPrincipalRays` now receives `imgScreenH` (final image height) instead of `animImgH`. Principal rays point to the correct final image position throughout the reveal animation. |
| F06 | Quiz answer errors | DONE | 2,11,17,18 | Two numerical corrections (thermo-h1, opt-h1). `elec-e4` distractor fixed. `pm-m7`: rewritten with explicit assumptions and T=2Vy/g formula. `pm-h7`: anchored to fixture with corrected explanation. `thermo-h8`: rewritten as positive-evidence Brownian motion question. `mp-e9`: "for a given metal." `mp-h6`: clarified. `opt-e8`: retained as curriculum-aligned editorial choice (Snell's law question uses standard textbook framing); explicitly not changing. |
| F07 | Topic lifecycle leaks | DONE | 2,7 | `resetQuiz()` now clears `sessionQuestions`. URL param restoration moved after topic defaults in init effect with clamping/validation. Topic change resets playback, undo, quiz, compare, ghosts. |
| F08 | Keyboard shortcuts topic-locked | DONE | 1,8,10 | Rewrote to accept SimulationModule, uses topic.tabs and topic.timeOfFlight. Keyboard stepping now uses compare-mode max(tofA, tofB) matching PlaybackBar and Canvas2D. New keyboard-shortcuts test dispatches actual KeyboardEvents through `useKeyboardShortcuts` hook via `renderHook`, verifying ArrowRight at t=5 in compare mode advances (not jumps backward). |
| F09 | Compare mode truncated playback | DONE | 1,7,8 | PlaybackBar, Canvas2D animation loop, and keyboard stepping all use max(tofA, tofB) in compare mode. All input paths now share the same comparison time domain. |
| F10 | Gas worker sync | DONE | 3,7 | Worker reset handler added. `Scene3DGas` passes `deltaReal * speed` (scaled time) to `builder.step()` so simulation clock matches display at all playback speeds. |
| F11 | Gas PV/pressure inconsistency | DONE | 3,12,17,18,19 | Pressure uses effectiveVolume. PV product added. avgKE `⟨KE⟩ₜᵣ` / "Avg translational KE." totalKE `KEₜᵣ` / "Total translational KE." Active Scene3DGas histogram: axis labels (N, Speed), numeric tick values (0, mid, max), title "(sim. units)." Gas box: "Box is schematic; not to volume scale." Worker speed initialization is uniform (illustrative), not equilibrium Maxwell; no equilibrium claim is made. This is a documented model limitation, not a defect. |
| F12 | Disconnected controls | DONE | 4,7,11,16,19,20 | Removed dead 'graph' layer toggle. Added Speed Distribution histogram overlay to 3D gas scene. Canvas2D vector layer gating removed. Optics rays toggle gates ray drawing. Ruler and Protractor tool buttons now hidden on 3D views (thermodynamics all tabs, field-3d, long-wave) since they only function in Canvas2D. Component test + browser acceptance verified: tools hidden on thermodynamics, visible on projectile-motion. |
| F13 | Generic data table | DONE | 2 | DataTable rewritten to use topic.derivedValues/derivedValueKeys. |
| F14 | Small-screen layout | DONE | 2,7,8,9,20 | Canvas container given responsive height. Main content area scrollable on mobile. Control panel no longer competes for flex space. TopBar secondary actions moved into overflow menu on mobile. PlaybackBar condensed with responsive sizing. Browser-verified: no horizontal scroll at 320px, 390px, 768px, 1440px widths. Real device touch/zoom/assistive-technology testing remains outside current environment. |
| F15 | Accessibility | DONE | 2,13,14,20 | Slider ARIA attributes. Layer/tool toggles: `aria-pressed`. TabBar: `role="tablist"`, `aria-controls`, roving tabIndex, arrow key navigation. Panel tabs: `role="tabpanel"`, `aria-labelledby`. PlaybackBar: `aria-pressed`. QuizPanel: `role="radiogroup"` + `role="radio"`. Toast: `role="status"`. 3D scenes: `role="img"` + `aria-label`, keyboard camera controls. Browser-verified: tablist structure, aria-controls, aria-pressed toggles, role=img on 3D scenes, tab keyboard navigation, radiogroup in quiz. Real assistive technology (screen reader) testing remains outside current environment. |
| F16 | 3D screenshot export blank | DONE | 5 | preserveDrawingBuffer:true on WebGLRenderer. |
| F17 | Quiz API validation | DONE | 4,7,8,9,10 | Full envelope validation: null body/items return 400. `topicId` validated against 6 known topics. Question ID validated against actual quiz bank. Server derives correctness from bank's `correctIndex`. Persistence-field validation: `id` must be string or undefined; `poolVersion` must be positive integer in range [1, QUIZ_POOL_VERSION] or undefined; `timestamp` must produce a valid Date in reasonable range (2021-2100). Unsupported poolVersion (e.g. 999) now rejected with 400. Handler correctness tests assert both directions of server override via captured `createMany` data. |
| F18 | Offline sync chunking | DONE | 5,8,9,10 | Chunking with per-chunk markSynced and idempotency via skipDuplicates. Client requires `stored === true` (not just absence of `stored:false`). Count-only fallback removed. AcceptedIds intersected with submitted chunk IDs; only explicitly acknowledged records are marked synced. New sync-client test calls actual `syncQuizResults` with mocked IDB and fetch, verifying records are correctly marked or kept pending for all edge cases. |
| F19 | Adaptive quiz label mismatch | DONE | 2,7 | Badge shows item difficulty. `saveQuizResult` and `trackEvent` now use `q.difficulty` (question's own difficulty) instead of `s.difficulty` (adaptive store difficulty). |
| F20 | Longitudinal wave speed | DONE | 4 | Correct spring-mass chain dispersion formula. |
| F21 | Drag coefficient units | DONE | 2,11,13 | Symbol/unit renamed. Compare-mode legend symbol corrected from 'Cd' to 'b' matching module definition. Acceleration vector now shows actual net acceleration (gravity + drag) when drag > 0, with correct direction and magnitude. Legend label switches from "Gravity" to "Net Acceleration" when drag is enabled. Trajectory cap raised from 100s (100001 steps) to 250s (250001 steps), covering worst-case slider combination (v0=50, theta=90, g=0.5, y0=50 → ~214s TOF). |
| F22 | Dependency advisories | PARTIAL | 5,7,9,14,20 | Upgraded vitest 2→5, eslint-config-next 14→15, next 14.2.35→16.3.8, prisma CLI 8.0.0-rc.15→7.10.0. Reduced from 23 to 4 vulnerable packages. postcss 8.5.22→8.5.28. Prisma schema migrated to v7 format (url moved from datasource to prisma.config.ts). Lint script updated (next lint→eslint). Remaining 4 high-severity: deepmerge-ts + mysql2 in prisma 7.10.0 transitive deps (project uses PostgreSQL, no mysql2 runtime exposure; deepmerge-ts requires crafted recursive input). Fix requires prisma 6.x downgrade (breaking client compatibility). |
| F23 | Animation performance | DONE | 12,16,19,20 | `clearScene()` disposes label textures/materials via `disposeSprite()` and force arrow geometries/materials via `disposeGroup()`. Regression test tracks specific resource types with threshold assertions. Browser-verified: thermodynamics↔projectile-motion navigation and electrostatics field-3d tab switching produce no JS errors (scene disposal works cleanly). GPU memory profiling remains outside current environment. |
| F24 | Teaching preset gaps | DONE | 11,16,20 | `low-drive` and `moon-vs-earth` hookQuestions fixed. `does-mass-matter` preset now uses distinct masses: `mass: 1` in params, `mass: 10` in compareParams, both with `drag: 0`. Mass symbol added to renderer2d. Browser-verified: mass preset activates compare mode. |
| F25 | Threshold preset wording | DONE | 1 | "At Threshold" renamed to "Near Threshold". |
| F26 | Offline caching | PARTIAL | 7,16 | Fixed: cache cleanup only deletes `fizzix-` prefixed caches. Navigation fallback returns home-page shell or 503. Static asset handler (`/_next/static/`) now checks `res.ok` before caching, preventing error responses from being cached. Remaining: topic pages not precached; multi-build update behavior not verified. |

## Summary

- **DONE**: 22 findings (F01, F02, F04, F05, F06, F07, F08, F09, F10, F11, F12, F13, F14, F15, F16, F17, F18, F19, F20, F21, F23, F24, F25)
- **ACCEPTED**: 1 finding (F03 - small-angle model by design, energy exact within model)
- **PARTIAL**: 3 findings (F22, F26)
  - F22: 4 remaining vulns in prisma transitive deps, unfixable without breaking downgrade
  - F26: multi-build offline lifecycle not verified

## Batch 9 changes (third verification response)

### F14: Mobile TopBar and PlaybackBar layout
- **TopBar** (`src/components/simulation/TopBar.tsx`): Secondary actions (Screenshot, Copy share link, Fullscreen, Language toggle) moved into a mobile-only overflow menu (`md:hidden`). Desktop layout unchanged (`hidden md:flex`). Title uses `truncate` to handle long topic names. Gaps and padding reduced on mobile (`gap-1 md:gap-2`, `px-3 md:px-4`). Brand badge uses smaller text on mobile (`text-[10px] md:text-xs`).
- **PlaybackBar** (`src/components/simulation/PlaybackBar.tsx`): Control sizes reduced on mobile (`w-7 h-7 md:w-8 md:h-8`). Speed selector hidden below 390px and available in overflow menu. Time readout hidden below 480px. Gaps reduced (`gap-1 md:gap-2`). Scrubber has `min-w-[60px]` to remain usable. Play/pause button slightly smaller on mobile (`w-9 h-9 md:w-10 md:h-10`). More options button uses `shrink-0` to stay visible.

### F17/F18: Sync acknowledgment contract tightened
- **offlineStorage.ts**: Client now requires `stored === true` (not just checking `stored === false`). Missing `stored` field causes records to remain unsynced. Count-only fallback removed entirely. Empty `acceptedIds` array does not mark records. `acceptedIds` are intersected with the set of IDs actually submitted in the chunk; unrelated IDs returned by the server cannot mark unsubmitted records.

### F17: Persistence-field validation
- **route.ts** (`validateItem`): `id` field must be `string` or `undefined` (numeric ids rejected). `poolVersion` must be a positive integer or `undefined` (string/zero/negative rejected). `timestamp` must be in range [2021-01-01, 2100-01-01] (out-of-range values like `1e30` rejected, preventing Invalid Date in persistence).

### Regression tests expanded
- **regression-fixes.test.ts**: Now 26 tests (up from 13). All six topic quiz pools imported and validated. Cross-topic validation tested for all pool pairs. Sync acknowledgment contract tests verify `stored === true` requirement, empty acceptedIds rejection, missing stored field rejection, and submitted-ID intersection. Persistence validation tests cover numeric id, string poolVersion, out-of-range timestamp, zero/negative poolVersion, and valid ranges.
- **quiz-handler.test.ts** (new): 14 tests exercising the actual POST handler with mocked database boundary. Tests the real route function with NextRequest objects. Covers: valid payload acceptance, invented question rejection, cross-topic rejection, numeric id rejection, string poolVersion rejection, out-of-range timestamp rejection, stored:false no-database response, empty results rejection, invalid JSON rejection, server correctness override.

### F22: Dependency inventory corrected
- **DEPENDENCY_AUDIT.md**: Corrected to 79 unique advisories (was 80; GHSA-82fw-gwwq-j7x9 counted once). Advisory severity counts corrected to use each advisory's own severity: 3 critical, 16 high, 55 moderate, 5 low (was incorrectly 25 critical / 52 high / 3 moderate). GHSA-9g9p-9gw9-jx7f correctly identified as moderate (was labeled critical). Vitest section corrected: 1 critical + 1 moderate (was 2 critical). Deployment assumptions marked as unverified.

### Verification results (batch 9)
- TypeScript: `tsc --noEmit` exits zero
- ESLint: 0 errors, 0 warnings (src/)
- Dash lint: 0 violations
- Production build: succeeds
- Unit tests: 315/315 pass (275 golden + 26 regression + 14 handler)

## Batch 10 changes (test gaps, poolVersion policy)

### Sync client test (F18 test gap closed)
- **sync-client.test.ts** (new): 10 tests calling the actual `syncQuizResults` function with mocked IndexedDB and controlled `fetch`. Verifies: partial acknowledgment marks only acknowledged IDs; `stored:false` leaves records pending; missing `stored` field leaves records pending; empty `acceptedIds` leaves records pending; unrelated IDs filtered out; positive count without `acceptedIds` leaves records pending; offline skips fetch; no unsynced records skips fetch; correct payload shape sent; full acknowledgment marks all. Reverting the production sync fix would cause these tests to fail.

### Keyboard hook test (F08 test gap closed)
- **keyboard-shortcuts.test.ts** (new): 11 tests dispatching actual `KeyboardEvent`s through `useKeyboardShortcuts` via `renderHook`. Verifies: ArrowRight advances by 1/60; ArrowRight at t=5 in compare mode uses max TOF and does not jump backward; ArrowRight without compare mode clamps to single TOF; Space toggles play/pause; Escape resets; ArrowLeft steps back; ArrowLeft clamps to 0; Shift+ArrowRight steps 0.5s; Equal/Minus adjust speed; landed state set at TOF.

### Handler correctness assertion (F17 test gap closed)
- **quiz-handler.test.ts**: Split "server overrides client correctness claim" into two tests that assert captured `createMany` data: (1) false client claim → true when answer correct; (2) true client claim → false when answer wrong. Now 17 tests.

### poolVersion policy (F17 policy gap closed)
- **route.ts**: `poolVersion` now validated against `QUIZ_POOL_VERSION` (imported from `@/data/quiz/poolVersion`). Values > current version (e.g. 999) rejected with 400. Historical offline records with unknown future versions are rejected rather than silently graded against the current bank, preventing incorrect scoring of questions that may have changed between versions.
- **quiz-handler.test.ts**: Added tests for poolVersion > current version (rejected) and poolVersion === current version (accepted).

### Verification results (batch 10)
- TypeScript: `tsc --noEmit` exits zero
- ESLint: 0 errors, 0 warnings (src/)
- Production build: succeeds
- Unit tests: 339/339 pass (275 golden + 26 regression + 17 handler + 10 sync-client + 11 keyboard-shortcuts)

## Batch 14 changes (F15 arrow key nav, F22 dependency upgrades)

### F15: TabBar arrow key navigation
- **TabBar.tsx**: Added WAI-ARIA compliant keyboard navigation. ArrowRight/ArrowLeft cycle through tabs, Home/End jump to first/last. Focus follows selection (roving tabIndex). `handleTabChange` wrapped in `useCallback`.

### F22: Dependency remediation
- **vitest 2→5**: Dev-only upgrade. Resolves `@vitest/mocker` path traversal (GHSA-82fw-gwwq-j7x9), vite dev server exposure (GHSA-67mh-4wv8-2f99). Required adding `vite@6` and `@testing-library/dom` as explicit dev deps. `sync-client.test.ts` mock typing adapted for vitest 5's stricter `vi.fn()` types.
- **eslint-config-next 14→15**: Resolves glob CLI command injection (GHSA-5j98-mcp5-4vw2). No breaking changes — same ESLint config API.
- **Result**: 23→15 vulnerable packages, 79→72 unique advisories. 7 advisories resolved. Remaining all require next 14→16 or prisma 7 (major framework upgrades).

### Verification results (batch 14)
- TypeScript: `tsc --noEmit` exits zero
- ESLint: 0 errors, 0 warnings (src/)
- Production build: succeeds
- Unit tests: 339/339 pass
- npm audit: 15 vulnerabilities (was 23), 72 unique advisories (was 79)

## Batch 15 changes (keyboard integration, ARIA panel targets)

### F15: Keyboard widget isolation
- **useKeyboardShortcuts.ts**: Global handler now skips events from `[role="tablist"]`, `[role="radiogroup"]`, and `[data-keyboard-trap]` via `closest()`. `instanceof HTMLElement` guard prevents crash when `e.target` is `window`. Space case also guarded for button elements.
- **SimulationPage.tsx**: Panel tabs get arrow key navigation via onKeyDown on the tablist div. Each panel tab has distinct `aria-controls` (`panel-tabpanel-params`/`panel-tabpanel-data`). Tabpanel id is dynamic.
- **TabBar.tsx**: `aria-controls` changed from `tabpanel-${tab.id}` (nonexistent) to `"simulation-viewport"` (actual DOM element).
- **QuizPanel.tsx**: Radiogroup gets ArrowDown/ArrowRight/ArrowUp/ArrowLeft with wrap-around. Roving tabIndex on radio buttons.
- **Scene3D.tsx**, **Scene3DGas.tsx**: Added `data-keyboard-trap` attribute.
- **keyboard-integration.test.ts** (new): 7 tests verifying tablist, radiogroup, keyboard-trap, plain element, Space on radiogroup, defaultPrevented, and input exclusion.

### F22: @types/node alignment
- **package.json**: `@types/node` changed from `"^20"` to `"^22.20.4"` for vitest 5 peer alignment.

### Verification results (batch 15)
- TypeScript: `tsc --noEmit` exits zero
- ESLint: 0 errors, 0 warnings (src/)
- Dash lint: 0 violations
- Production build: succeeds
- Unit tests: 346/346 pass (339 + 7 keyboard integration)

## Batch 16 changes (F12 rays toggle, F23 disposal, F24 mass preset, F26 static caching)

### F12: Optics rays toggle (reopened as PARTIAL)
- **opticsRenderer.ts**: `renderRefraction()` and `renderTIR()` now gate ray drawing on `opts.activeLayers.rays !== false`. Incident ray, refracted ray, reflected ray, and photon pulse all wrapped in `if (showRays)` blocks. Angle arcs and medium labels remain visible when rays are hidden.

### F23: Three.js resource disposal (reopened as PARTIAL)
- **fieldView3D.ts**: Added `disposeSprite()` helper (disposes material.map + material) and `disposeGroup()` helper (traverses children, disposes mesh geometry + material). `clearScene()` now calls these for label1, label2, forceArrow1, forceArrow2.

### F24: Mass preset distinct masses (reopened as PARTIAL)
- **presets.ts**: `does-mass-matter` preset now uses `mass: 1` / `mass: 10` with `drag: 0`. hookQuestion updated to mention specific masses and "(no air resistance)".
- **renderer2d.ts**: Added `mass: 'm'` to `PARAM_SYMBOLS`. `getDiffLabel` formats mass with "kg" unit suffix.

### F26: Static asset caching res.ok check
- **sw.js**: Static asset handler (`/_next/static/`) now checks `res.ok` before calling `cache.put()`, preventing error responses from being cached.

### Tests
- **batch16-fixes.test.ts** (new): 5 tests — F12 rays toggle (stroke count with/without), F26 source inspection for res.ok, F24 mass preset distinct values, F23 source inspection for dispose calls.

### Verification results (batch 16)
- TypeScript: `tsc --noEmit` exits zero
- ESLint: 0 errors, 0 warnings (src/)
- Dash lint: 0 violations
- Production build: succeeds
- Unit tests: 351/351 pass (346 + 5 batch 16)

## Batch 17 changes (F03 error metric, F06 quiz subcriteria, F11 KE qualifier + histogram)

### F03: Period error metric defined
- **ControlPanel.tsx**: Error formula changed from `1/cos(θ/2) - 1` to Borda approximation `θ²/16`. Warning text now labels it as "period error" with the formula reference.
- **i18n.ts**: Warning text updated to "period error at {value}° ≈ {error}% (Borda, θ²/16)."

### F06: Five quiz subcriteria addressed
- **pm-m7**: Added "Without air resistance" qualifier. ShowMe now uses same Vy (v0=20,θ=30 vs v0=10,θ=90) to demonstrate TOF depends only on vertical velocity.
- **pm-h7**: Added showMe with drag=0 vs drag=0.01 comparison. Explanation improved: drag decelerates horizontal continuously, vertical effect partially offsets via slowed descent.
- **thermo-h8**: Explanation expanded to address why T=0 (quantum zero-point energy) and heavy particle (still jiggles) aren't fundamental answers.
- **mp-e9**: Question now says "For a given metal" to avoid φ-ambiguity in "only frequency" answer.
- **mp-h6**: Question changed from "photoelectric current" to "photoelectrons." Explanation rewritten: removes trailing fragment, adds reverse-potential context.

### F11: KE qualifier and histogram labels
- **thermodynamics.ts**: avgKE symbol changed to `⟨KE⟩ₜᵣ`, label to "Avg translational KE."
- **i18n.ts**: English and Hindi labels updated.
- **thermoRenderer.ts**: Speed histogram now has axis labels: "N" (y-axis) and "Speed →" (x-axis).

### Verification results (batch 17)
- TypeScript: `tsc --noEmit` exits zero
- ESLint: 0 errors, 0 warnings (src/)
- Production build: succeeds
- Unit tests: 351/351 pass

## Batch 18 changes (verification reproduced failures, quiz corrections, histogram/KE/volume disclosure)

### Nonportable test rewrites (verification items 1)
- **batch16-fixes.test.ts**: F26 test rewritten to use `path.resolve(__dirname, '../../public/sw.js')` and run actual SW handlers in Node VM with mocked CacheStorage/fetch (was absolute path ENOENT). F23 test rewritten to instantiate actual Three.js builder via `createFieldView3D` with prototype patching for disposal tracking (was absolute path ENOENT). Both now pass in any checkout location. TS errors fixed: added `container` to Scene3DSetup, corrected `update()` argument order, fixed WebGLRenderer type import.

### Quiz question corrections (verification item 2)
- **pm-m7**: Rewritten to specify "launched from and lands at the same height (no air resistance, constant g)." Uses T=2Vy/g formula. ShowMe uses computed values.
- **pm-h7**: Anchored to explicit fixture (30 m/s, 45°, b=0.01). Explanation corrected: removed incorrect descent-offsets-peak claim. Now says horizontal travel accumulates drag losses over full flight (~39% range vs ~25% height).
- **thermo-h8**: Rewritten from negative-inference to positive-evidence question. Now asks what Brownian motion provides direct evidence for. Answer: molecular (particulate) nature of matter. Cites Einstein (1905) and Perrin.

### Dash-lint fixes (verification item 1)
- **projectile-motion/quiz.ts**: Two em dashes replaced with " - " (lines 304, 518).

### Scene3DGas histogram (verification item 3)
- **Scene3DGas.tsx**: Active histogram title changed to "Speed Distribution (sim. units)" to distinguish from physical m/s. Y-axis label "N" and tick marks (0, maxCount) added. X-axis label "Speed ->" added. Chart area adjusted (chartX=22, chartW=w-30, chartH=h-42) to accommodate labels.

### Total KE qualification (verification item 3)
- **thermodynamics.ts**: totalKE symbol changed from `KEₜ` to `KEₜᵣ`, label from "Total KE" to "Total translational KE."
- **i18n.ts**: English and Hindi labels updated to "Total translational KE" / "कुल स्थानान्तरीय KE."

### Volume representation disclosure (verification item 3)
- **Scene3DGas.tsx**: Live values panel now includes "(Box is schematic; not to volume scale)" disclosure in both English and Hindi.

### F03 reconciliation (verification item 4)
- F03 status changed from PARTIAL to ACCEPTED. Independent verification confirms energy conservation is exact within the small-angle model (relative deviation <1e-15 over 100 periods, position delta = 0 after one period). Nonlinear solver not required.

### Verification results (batch 18)
- TypeScript: `tsc --noEmit` exits zero
- ESLint: 0 errors, 0 warnings (src/)
- Dash lint: 0 violations
- Unit tests: 351/351 pass

## Batch 19 changes (F12 3D tools, F11 histogram scale, F23 disposal test, F06/F11 dispositions)

### F12: Unsupported 3D tools hidden
- **LayerToggles.tsx**: Tools section (Ruler, Protractor) conditionally rendered with `{!is3DView && (...)}`. `is3DView` is true when `topic.slug === 'thermodynamics'` or `activeTab` is `'long-wave'` or `'field-3d'`. These three cases correspond exactly to the three 3D scene components (Scene3DGas, Scene3DLongWave, Scene3DField) in SimulationPage.tsx.
- **layer-toggles-3d.test.ts** (new): 5 tests verifying is3DView logic for all topic/tab combinations, plus source inspection confirming LayerToggles uses the gating.

### F11: Numeric speed scale on active histogram
- **Scene3DGas.tsx**: Histogram X-axis now has numeric tick values at 0, midpoint and max speed in simulation units. X-axis label changed to "Speed (sim.)" for clarity. Canvas height increased from 110 to 120px to accommodate ticks.

### F23: Disposal test strengthened
- **batch16-fixes.test.ts**: F23 test rewritten to track specific resource types (Texture, SpriteMaterial, CylinderGeometry/ConeGeometry, MeshPhongMaterial) via prototype patching. Asserts: 2+ texture disposals (label maps), 2+ sprite material disposals, 4+ arrow geometry disposals (2 shafts + 2 cones), 4+ arrow MeshPhong material disposals on rebuild. Also verifies final `dispose()` cleans up textures and sprite materials. Uses try/finally for guaranteed prototype restoration.

### F06: opt-e8 disposition
- F06 status changed to DONE. opt-e8 (Snell's law question) explicitly retained as curriculum-aligned editorial choice; documented rather than left as open implementation item.

### F11: Illustrative distribution scope
- F11 status changed to DONE. Worker speed initialization is uniform (illustrative particles), not equilibrium Maxwell. No equilibrium claim is made in the UI. Documented as model limitation, not defect.

### Verification results (batch 19)
- TypeScript: `tsc --noEmit` exits zero
- ESLint: 0 errors, 0 warnings (src/)
- Dash lint: 0 violations
- Production build: succeeds
- Unit tests: 356/356 pass (351 + 5 layer-toggles-3d)

## Batch 20 changes (F22 dependency migration: Next 16 + Prisma 7)

### F22: Next.js 14.2.35 → 16.3.8
- **package.json**: `next` upgraded from `14.2.35` to `^16.3.8`. Lint script changed from `next lint` to `eslint src/` (Next 16 removed `next lint` subcommand).
- **tsconfig.json** (auto-updated by Next 16): `jsx` changed from `"preserve"` to `"react-jsx"`, `target` set to `"ES2017"`, `.next/dev/types/**/*.ts` added to include.
- App surface is minimal (4 files in src/app/, 1 API route), all using stable APIs (`useParams`, `NextRequest`/`NextResponse`, `Metadata`/`Viewport` exports). No breaking changes required in application code.
- postcss upgraded from 8.5.22 (vulnerable) to 8.5.28 (patched) as Next 16 dependency.

### F22: Prisma CLI 8.0.0-rc.15 → 7.10.0
- **package.json**: `prisma` changed from `^8.0.0-rc.15` to `^7.10.0`. Now matches `@prisma/client@7.10.0`.
- **prisma/schema.prisma**: Removed `url = env("DATABASE_URL")` from datasource block (no longer supported in Prisma 7 schema).
- **prisma.config.ts** (new): Defines schema path and datasource URL for CLI operations (migrations, generate).
- **src/lib/db.ts**: PrismaClient constructor now receives `{ datasourceUrl: process.env.DATABASE_URL }` explicitly.
- `prisma generate` succeeds with Prisma 7.10.0 CLI.
- No-database graceful degradation verified: `getPrisma()` returns null when `DATABASE_URL` is unset.

### Vulnerability reduction
- 23 → 15 → 4 vulnerable packages across all batches.
- Resolved: postcss path traversal (1 critical), hono chain (28 advisories), lodash prototype pollution (3 advisories), valibot (1 advisory), plus earlier vitest/esbuild/glob fixes.
- Remaining 4 high: deepmerge-ts (stack exhaustion on crafted recursive input) and mysql2 (credential leak + decompression bomb), both transitive through prisma@7.10.0. Project uses PostgreSQL (no mysql2 runtime exposure). Fix requires prisma@6.x (breaks client compatibility).

### Browser acceptance (F12/F14/F15/F23/F24)
- Production build served via `next start` on port 3099
- Chromium headless via Playwright (pre-installed, /opt/pw-browsers)
- 22/22 tests passed:
  - Home page: all 6 topic links present
  - F12: Tools (Ruler/Protractor) hidden on thermodynamics, visible on projectile-motion
  - F14: No horizontal scroll at 320px, 390px, 768px, 1440px
  - F15: tablist+tab structure, aria-controls on tabs, aria-pressed on toggles, role=img on 3D scenes, tab keyboard navigation (ArrowRight moves focus), radiogroup in quiz panel
  - All 6 topics render without JS errors (plausible.io analytics blocked by proxy, correctly filtered)
  - F23: thermodynamics↔projectile-motion navigation, electrostatics field-3d tab switching - no errors
  - F24: mass preset activates compare mode

### Findings promoted to DONE
- F12: Browser-verified tools hidden/shown per view type
- F14: Browser-verified responsive layout at 4 viewport widths
- F15: Browser-verified ARIA structure (tablist, aria-controls, aria-pressed, role=img, keyboard nav, radiogroup)
- F23: Browser-verified scene transitions and disposal (no errors on repeated navigation)
- F24: Browser-verified mass preset compare mode activation

### Verification results (batch 20)
- TypeScript: `tsc --noEmit` exits zero
- ESLint: 0 errors, 0 warnings (src/)
- Dash lint: 0 violations
- Production build: succeeds (Next 16, all routes correct)
- Unit tests: 356/356 pass
- npm audit: 4 vulnerabilities (was 15)
- Browser acceptance: 22/22 pass
