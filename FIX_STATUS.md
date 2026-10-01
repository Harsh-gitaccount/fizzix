# Fizzix Audit Fix Status

Tracking fixes for audit findings F01-F26 from the comprehensive audit at commit `7523ff0`.
Reconciled against independent verification at commits `fcb3b41`, `6be4bac`, `b9bf820`, and `e97d111`.
Current head includes batch 10 fixes (test gaps, poolVersion policy, physics/content corrections).

| Finding | Title | Status | Batch | Notes |
|---------|-------|--------|-------|-------|
| F01 | Type-check & lint errors | DONE | 1,7 | TS errors fixed. ESLint 53 errors fixed (unused vars/imports/prefer-const). 50 dash-lint violations fixed. E2E route corrected (`/projectile-motion`). Production build passes. |
| F02 | Damping model wrong frequency | DONE | 1 | Rewrote pendulum & spring to three-regime damped oscillator (underdamped/critical/overdamped). |
| F03 | Pendulum energy inconsistency | PARTIAL | 1 | PE switched to small-angle quadratic form. UI still allows 60deg without visible small-angle restriction or disclosure. |
| F04 | Bohr model ignores Z | DONE | 1 | modernStateAtTime passes Z to bohrRadiusPm, electronSpeed, bohrRadius. |
| F05 | Optics f=0 / virtual ray issues | PARTIAL | 1,6 | lensPower null for f=0; virtual ray rendering improved. `drawPrincipalRays` still receives animated `animImgH`; intermediate-frame geometry remains tied to changing image height during reveal. |
| F06 | Quiz answer errors | PARTIAL | 2 | Two numerical corrections applied (thermo-h1, opt-h1). Other conceptual wording/assumption issues not all addressed. |
| F07 | Topic lifecycle leaks | DONE | 2,7 | `resetQuiz()` now clears `sessionQuestions`. URL param restoration moved after topic defaults in init effect with clamping/validation. Topic change resets playback, undo, quiz, compare, ghosts. |
| F08 | Keyboard shortcuts topic-locked | DONE | 1,8,10 | Rewrote to accept SimulationModule, uses topic.tabs and topic.timeOfFlight. Keyboard stepping now uses compare-mode max(tofA, tofB) matching PlaybackBar and Canvas2D. New keyboard-shortcuts test dispatches actual KeyboardEvents through `useKeyboardShortcuts` hook via `renderHook`, verifying ArrowRight at t=5 in compare mode advances (not jumps backward). |
| F09 | Compare mode truncated playback | DONE | 1,7,8 | PlaybackBar, Canvas2D animation loop, and keyboard stepping all use max(tofA, tofB) in compare mode. All input paths now share the same comparison time domain. |
| F10 | Gas worker sync | DONE | 3,7 | Worker reset handler added. `Scene3DGas` passes `deltaReal * speed` (scaled time) to `builder.step()` so simulation clock matches display at all playback speeds. |
| F11 | Gas PV/pressure inconsistency | PARTIAL | 3 | Pressure uses effectiveVolume for piston mode. Box-volume mapping and distribution/energy-label issues remain separate parts of original finding. |
| F12 | Disconnected controls | PARTIAL | 4,7 | Removed dead 'graph' layer toggle. Added Speed Distribution histogram overlay to 3D gas scene (`Scene3DGas`) so `histogram` layer toggle now has visible effect. Canvas2D vector gating still uses projectile tab names; broader per-mode layer/tool capability gaps not fully addressed. |
| F13 | Generic data table | DONE | 2 | DataTable rewritten to use topic.derivedValues/derivedValueKeys. |
| F14 | Small-screen layout | PARTIAL | 2,7,8,9 | Canvas container given responsive height. Main content area scrollable on mobile. Control panel no longer competes for flex space. TopBar secondary actions (Screenshot, Share, Fullscreen, Language) moved into overflow menu on mobile. PlaybackBar condensed with responsive sizing, speed selector and time readout hidden on very narrow viewports. Full touch/zoom/assistive-technology verification not performed; header and playback no longer clip at 320/390px widths in layout, but actual device testing has not been done. |
| F15 | Accessibility | PARTIAL | 2 | Slider ARIA attributes added. Viewport scaling fixed. Complete keyboard navigation, toggle/tab semantics, and nonvisual alternatives not demonstrated. |
| F16 | 3D screenshot export blank | DONE | 5 | preserveDrawingBuffer:true on WebGLRenderer. |
| F17 | Quiz API validation | DONE | 4,7,8,9,10 | Full envelope validation: null body/items return 400. `topicId` validated against 6 known topics. Question ID validated against actual quiz bank. Server derives correctness from bank's `correctIndex`. Persistence-field validation: `id` must be string or undefined; `poolVersion` must be positive integer in range [1, QUIZ_POOL_VERSION] or undefined; `timestamp` must produce a valid Date in reasonable range (2021-2100). Unsupported poolVersion (e.g. 999) now rejected with 400. Handler correctness tests assert both directions of server override via captured `createMany` data. |
| F18 | Offline sync chunking | DONE | 5,8,9,10 | Chunking with per-chunk markSynced and idempotency via skipDuplicates. Client requires `stored === true` (not just absence of `stored:false`). Count-only fallback removed. AcceptedIds intersected with submitted chunk IDs; only explicitly acknowledged records are marked synced. New sync-client test calls actual `syncQuizResults` with mocked IDB and fetch, verifying records are correctly marked or kept pending for all edge cases. |
| F19 | Adaptive quiz label mismatch | DONE | 2,7 | Badge shows item difficulty. `saveQuizResult` and `trackEvent` now use `q.difficulty` (question's own difficulty) instead of `s.difficulty` (adaptive store difficulty). |
| F20 | Longitudinal wave speed | DONE | 4 | Correct spring-mass chain dispersion formula. |
| F21 | Drag coefficient units | PARTIAL | 2 | Symbol/unit renamed. Trajectory cap and acceleration-vs-gravity semantics remain unaddressed. |
| F22 | Dependency advisories | PARTIAL | 5,7,9 | 23 packages, 79 unique advisories (3 critical, 16 high, 55 moderate, 5 low by own severity). Advisory counts now use deduplicated GHSA URLs with each advisory's own severity. All require breaking changes. Per-advisory reachability analysis in `DEPENDENCY_AUDIT.md`. Production-reachable: next framework DoS/cache advisories. Not reachable (assumed Linux deployment, not verified): hono/prisma chain, vitest/esbuild, glob CLI. Upgrade path: vitest first (dev-only), then next 14->16 (major). Deployment assumptions documented. |
| F23 | Animation performance | OPEN | - | No profiling performed. Requires representative animation and topic-switching measurement before claiming no regression exists. |
| F24 | Teaching preset gaps | PARTIAL | - | Original finding includes misleading existing preset questions/explanations, not only new-preset requests. Correcting misleading hooks is a code fix, not a pedagogical addition. |
| F25 | Threshold preset wording | DONE | 1 | "At Threshold" renamed to "Near Threshold". |
| F26 | Offline caching | PARTIAL | 7 | Fixed: cache cleanup now only deletes `fizzix-` prefixed caches (was deleting all). Navigation fallback returns home-page shell for uncached routes and 503 Response as last resort (was returning undefined). Remaining: topic pages not precached; full offline navigation requires visited-page caching which is already implemented via stale-while-revalidate. Multi-build update behavior and truly uncached navigation not verified. |

## Summary

- **DONE**: 14 findings (F01, F02, F04, F07, F08, F09, F10, F13, F16, F17, F18, F19, F20, F25)
- **PARTIAL**: 11 findings (F03, F05, F06, F11, F12, F14, F15, F21, F22, F24, F26)
- **OPEN**: 1 finding (F23 - requires profiling to demonstrate or rule out performance issue)

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
