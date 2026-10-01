# Fizzix Audit Fix Status

Tracking fixes for audit findings F01-F26 from the comprehensive audit at commit `7523ff0`.
Reconciled against independent verification at commits `fcb3b41`, `6be4bac`, `b9bf820`, and `e97d111`.
Current head includes batch 14 fixes (F15 arrow key nav, F22 dependency upgrades).

| Finding | Title | Status | Batch | Notes |
|---------|-------|--------|-------|-------|
| F01 | Type-check & lint errors | DONE | 1,7 | TS errors fixed. ESLint 53 errors fixed (unused vars/imports/prefer-const). 50 dash-lint violations fixed. E2E route corrected (`/projectile-motion`). Production build passes. |
| F02 | Damping model wrong frequency | DONE | 1 | Rewrote pendulum & spring to three-regime damped oscillator (underdamped/critical/overdamped). |
| F03 | Pendulum energy inconsistency | PARTIAL | 1,11 | PE switched to small-angle quadratic form. UI now shows amber warning when theta0 > 15°, displaying the approximation error percentage. The simulation model still uses small-angle formulas; a full nonlinear solver is not implemented. |
| F04 | Bohr model ignores Z | DONE | 1 | modernStateAtTime passes Z to bohrRadiusPm, electronSpeed, bohrRadius. |
| F05 | Optics f=0 / virtual ray issues | DONE | 1,6,11 | lensPower null for f=0; virtual ray rendering improved. `drawPrincipalRays` now receives `imgScreenH` (final image height) instead of `animImgH`. Principal rays point to the correct final image position throughout the reveal animation. |
| F06 | Quiz answer errors | PARTIAL | 2,11 | Two numerical corrections applied (thermo-h1, opt-h1). `elec-e4` fake distractor `P = IV²` replaced with real formula `F = qE`. Remaining subcriteria: `pm-m7` (drag formula wording), `pm-h7` (trajectory shape claim), `thermo-h8` (adiabatic speed), `mp-e9` (wave equation units), `mp-h6` (standing wave boundary). `opt-e8` mirage TIR explanation simplified but curriculum-aligned (CBSE); not changing. |
| F07 | Topic lifecycle leaks | DONE | 2,7 | `resetQuiz()` now clears `sessionQuestions`. URL param restoration moved after topic defaults in init effect with clamping/validation. Topic change resets playback, undo, quiz, compare, ghosts. |
| F08 | Keyboard shortcuts topic-locked | DONE | 1,8,10 | Rewrote to accept SimulationModule, uses topic.tabs and topic.timeOfFlight. Keyboard stepping now uses compare-mode max(tofA, tofB) matching PlaybackBar and Canvas2D. New keyboard-shortcuts test dispatches actual KeyboardEvents through `useKeyboardShortcuts` hook via `renderHook`, verifying ArrowRight at t=5 in compare mode advances (not jumps backward). |
| F09 | Compare mode truncated playback | DONE | 1,7,8 | PlaybackBar, Canvas2D animation loop, and keyboard stepping all use max(tofA, tofB) in compare mode. All input paths now share the same comparison time domain. |
| F10 | Gas worker sync | DONE | 3,7 | Worker reset handler added. `Scene3DGas` passes `deltaReal * speed` (scaled time) to `builder.step()` so simulation clock matches display at all playback speeds. |
| F11 | Gas PV/pressure inconsistency | PARTIAL | 3,12 | Pressure uses effectiveVolume for piston mode. Inline pressure calculations in gasBox3D.ts and thermoRenderer.ts deduplicated to use centralized `idealGasPressure` and `effectiveVolume`. PV product added as derived value so students can verify PV = nRT. avgKE symbol disambiguated to `⟨KE⟩`. Remaining: visual box volume not proportional to physics volume due to 1D scaling with clamping; this is a visualization simplification, not a physics error. |
| F12 | Disconnected controls | PARTIAL | 4,7,11,16 | Removed dead 'graph' layer toggle. Added Speed Distribution histogram overlay to 3D gas scene. Canvas2D vector layer gating removed. Optics refraction/TIR renderers now gate ray drawing on `activeLayers.rays`, so the Rays toggle actually controls incident/refracted/reflected rays while leaving angle arcs and labels visible. Not browser-verified. |
| F13 | Generic data table | DONE | 2 | DataTable rewritten to use topic.derivedValues/derivedValueKeys. |
| F14 | Small-screen layout | PARTIAL | 2,7,8,9 | Canvas container given responsive height. Main content area scrollable on mobile. Control panel no longer competes for flex space. TopBar secondary actions (Screenshot, Share, Fullscreen, Language) moved into overflow menu on mobile. PlaybackBar condensed with responsive sizing, speed selector and time readout hidden on very narrow viewports. Full touch/zoom/assistive-technology verification not performed; header and playback no longer clip at 320/390px widths in layout, but actual device testing has not been done. |
| F15 | Accessibility | PARTIAL | 2,13,14 | Slider ARIA attributes added. Viewport scaling fixed. Layer/tool toggles: `aria-pressed`. TabBar: `role="tablist"`, `aria-controls`, `tabIndex` roving, ArrowLeft/ArrowRight/Home/End keyboard navigation. SimulationPage panel tabs: `role="tabpanel"`, `aria-labelledby`. PlaybackBar: `aria-pressed` on sound/pause-at-key-points toggles, "Replay" label for landed state. PresetStrip: `aria-pressed` on active preset. QuizPanel: `role="radiogroup"` + `role="radio"` + `aria-checked`. Toast: `role="status"` + `aria-live="polite"`. 3D scenes: `role="img"` + `aria-label`, `tabIndex=0`, keyboard camera controls (arrow keys rotate, +/- zoom), focus outline. Language toggle: `aria-label`. Remaining: full assistive technology testing not performed. |
| F16 | 3D screenshot export blank | DONE | 5 | preserveDrawingBuffer:true on WebGLRenderer. |
| F17 | Quiz API validation | DONE | 4,7,8,9,10 | Full envelope validation: null body/items return 400. `topicId` validated against 6 known topics. Question ID validated against actual quiz bank. Server derives correctness from bank's `correctIndex`. Persistence-field validation: `id` must be string or undefined; `poolVersion` must be positive integer in range [1, QUIZ_POOL_VERSION] or undefined; `timestamp` must produce a valid Date in reasonable range (2021-2100). Unsupported poolVersion (e.g. 999) now rejected with 400. Handler correctness tests assert both directions of server override via captured `createMany` data. |
| F18 | Offline sync chunking | DONE | 5,8,9,10 | Chunking with per-chunk markSynced and idempotency via skipDuplicates. Client requires `stored === true` (not just absence of `stored:false`). Count-only fallback removed. AcceptedIds intersected with submitted chunk IDs; only explicitly acknowledged records are marked synced. New sync-client test calls actual `syncQuizResults` with mocked IDB and fetch, verifying records are correctly marked or kept pending for all edge cases. |
| F19 | Adaptive quiz label mismatch | DONE | 2,7 | Badge shows item difficulty. `saveQuizResult` and `trackEvent` now use `q.difficulty` (question's own difficulty) instead of `s.difficulty` (adaptive store difficulty). |
| F20 | Longitudinal wave speed | DONE | 4 | Correct spring-mass chain dispersion formula. |
| F21 | Drag coefficient units | DONE | 2,11,13 | Symbol/unit renamed. Compare-mode legend symbol corrected from 'Cd' to 'b' matching module definition. Acceleration vector now shows actual net acceleration (gravity + drag) when drag > 0, with correct direction and magnitude. Legend label switches from "Gravity" to "Net Acceleration" when drag is enabled. Trajectory cap raised from 100s (100001 steps) to 250s (250001 steps), covering worst-case slider combination (v0=50, theta=90, g=0.5, y0=50 → ~214s TOF). |
| F22 | Dependency advisories | PARTIAL | 5,7,9,14 | Upgraded vitest 2→5 (dev-only, resolves @vitest/mocker path traversal + vite/esbuild advisories). Upgraded eslint-config-next 14→15 (resolves glob CLI injection). Reduced from 23 to 15 vulnerable packages, 79 to 72 unique advisories. Remaining 15 packages (1 critical, 9 high, 5 moderate) all in next 14.x (23 advisories + postcss) and prisma chain (hono/valibot/lodash). Both require major framework upgrades (next 14→16, prisma 7). Per-advisory reachability analysis in `DEPENDENCY_AUDIT.md`. |
| F23 | Animation performance | PARTIAL | 12,16 | Playwright-based performance profiling test added. `clearScene()` in fieldView3D.ts now disposes label textures/materials via `disposeSprite()` and force arrow geometries/materials via `disposeGroup()`, preventing GPU memory leaks on topic change. Browser profiling not performed. |
| F24 | Teaching preset gaps | PARTIAL | 11,16 | `low-drive` and `moon-vs-earth` hookQuestions fixed. `does-mass-matter` preset now uses distinct masses: `mass: 1` in params, `mass: 10` in compareParams, both with `drag: 0`. hookQuestion updated to "A 1 kg ball and a 10 kg ball are launched identically (no air resistance). Do their paths differ?". Mass symbol added to renderer2d `PARAM_SYMBOLS` and `getDiffLabel`. Not browser-verified. |
| F25 | Threshold preset wording | DONE | 1 | "At Threshold" renamed to "Near Threshold". |
| F26 | Offline caching | PARTIAL | 7,16 | Fixed: cache cleanup only deletes `fizzix-` prefixed caches. Navigation fallback returns home-page shell or 503. Static asset handler (`/_next/static/`) now checks `res.ok` before caching, preventing error responses from being cached. Remaining: topic pages not precached; multi-build update behavior not verified. |

## Summary

- **DONE**: 16 findings (F01, F02, F04, F05, F07, F08, F09, F10, F13, F16, F17, F18, F19, F20, F21, F25)
- **PARTIAL**: 10 findings (F03, F06, F11, F12, F14, F15, F22, F23, F24, F26)

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
