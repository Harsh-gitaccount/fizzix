# Fizzix Audit Fix Status

Tracking fixes for audit findings F01-F26 from the comprehensive audit at commit `7523ff0`.
Reconciled against independent verification at commits `fcb3b41` and `6be4bac` (1 October 2026).
Current head includes batch 8 fixes (second verification response).

| Finding | Title | Status | Batch | Notes |
|---------|-------|--------|-------|-------|
| F01 | Type-check & lint errors | DONE | 1,7 | TS errors fixed. ESLint 53 errors fixed (unused vars/imports/prefer-const). 50 dash-lint violations fixed. E2E route corrected (`/projectile-motion`). Production build passes. |
| F02 | Damping model wrong frequency | DONE | 1 | Rewrote pendulum & spring to three-regime damped oscillator (underdamped/critical/overdamped). |
| F03 | Pendulum energy inconsistency | PARTIAL | 1 | PE switched to small-angle quadratic form. UI still allows 60deg without visible small-angle restriction or disclosure. |
| F04 | Bohr model ignores Z | DONE | 1 | modernStateAtTime passes Z to bohrRadiusPm, electronSpeed, bohrRadius. |
| F05 | Optics f=0 / virtual ray issues | PARTIAL | 1,6 | lensPower null for f=0; virtual ray rendering improved. `drawPrincipalRays` still receives animated `animImgH`; intermediate-frame geometry remains tied to changing image height during reveal. |
| F06 | Quiz answer errors | PARTIAL | 2 | Two numerical corrections applied (thermo-h1, opt-h1). Other conceptual wording/assumption issues not all addressed. |
| F07 | Topic lifecycle leaks | DONE | 2,7 | `resetQuiz()` now clears `sessionQuestions`. URL param restoration moved after topic defaults in init effect with clamping/validation. Topic change resets playback, undo, quiz, compare, ghosts. |
| F08 | Keyboard shortcuts topic-locked | DONE | 1,8 | Rewrote to accept SimulationModule, uses topic.tabs and topic.timeOfFlight. Keyboard stepping now uses compare-mode max(tofA, tofB) matching PlaybackBar and Canvas2D. |
| F09 | Compare mode truncated playback | DONE | 1,7,8 | PlaybackBar, Canvas2D animation loop, and keyboard stepping all use max(tofA, tofB) in compare mode. All input paths now share the same comparison time domain. |
| F10 | Gas worker sync | DONE | 3,7 | Worker reset handler added. `Scene3DGas` passes `deltaReal * speed` (scaled time) to `builder.step()` so simulation clock matches display at all playback speeds. |
| F11 | Gas PV/pressure inconsistency | PARTIAL | 3 | Pressure uses effectiveVolume for piston mode. Box-volume mapping and distribution/energy-label issues remain separate parts of original finding. |
| F12 | Disconnected controls | PARTIAL | 4,7 | Removed dead 'graph' layer toggle. Added Speed Distribution histogram overlay to 3D gas scene (`Scene3DGas`) so `histogram` layer toggle now has visible effect. Canvas2D vector gating still uses projectile tab names; broader per-mode layer/tool capability gaps not fully addressed. |
| F13 | Generic data table | DONE | 2 | DataTable rewritten to use topic.derivedValues/derivedValueKeys. |
| F14 | Small-screen layout | PARTIAL | 2,7,8 | Canvas container given responsive height (`h-[50vw] min-h-[180px] max-h-[300px]`). Main content area scrollable on mobile (`overflow-y-auto`). Control panel no longer competes for flex space on mobile. Full touch/zoom/assistive-technology verification not performed. |
| F15 | Accessibility | PARTIAL | 2 | Slider ARIA attributes added. Viewport scaling fixed. Complete keyboard navigation, toggle/tab semantics, and nonvisual alternatives not demonstrated. |
| F16 | 3D screenshot export blank | DONE | 5 | preserveDrawingBuffer:true on WebGLRenderer. |
| F17 | Quiz API validation | DONE | 4,7,8 | Full envelope validation: null body/items return 400. `topicId` validated against 6 known topics. Question ID validated against actual quiz bank via `questionBank.ts`. Server derives correctness from bank's `correctIndex` rather than trusting client boolean. Sync acknowledgment contract: successful storage returns `{synced, stored:true, acceptedIds}`; no-storage returns `{synced:0, stored:false}`. |
| F18 | Offline sync chunking | DONE | 5,8 | Chunking with per-chunk markSynced and idempotency via skipDuplicates. Client now checks response body: only marks records synced when `stored:true` and `synced > 0`. Records remain unsynced when server returns `stored:false`. |
| F19 | Adaptive quiz label mismatch | DONE | 2,7 | Badge shows item difficulty. `saveQuizResult` and `trackEvent` now use `q.difficulty` (question's own difficulty) instead of `s.difficulty` (adaptive store difficulty). |
| F20 | Longitudinal wave speed | DONE | 4 | Correct spring-mass chain dispersion formula. |
| F21 | Drag coefficient units | PARTIAL | 2 | Symbol/unit renamed. Trajectory cap and acceleration-vs-gravity semantics remain unaddressed. |
| F22 | Dependency advisories | PARTIAL | 5,7 | 23 vulnerabilities (8 moderate, 13 high, 2 critical). All require breaking changes. Per-advisory reachability analysis completed in `DEPENDENCY_AUDIT.md`. Production-reachable: next framework DoS/cache advisories. Not reachable: hono/prisma chain, vitest/esbuild, glob CLI. Upgrade path: vitest first (dev-only), then next 14->16 (major). Inventory distinguishes package-level vs advisory-level counts. Critical section covers both next and vitest findings. |
| F23 | Animation performance | OPEN | - | No profiling performed. Requires representative animation and topic-switching measurement before claiming no regression exists. |
| F24 | Teaching preset gaps | PARTIAL | - | Original finding includes misleading existing preset questions/explanations, not only new-preset requests. Correcting misleading hooks is a code fix, not a pedagogical addition. |
| F25 | Threshold preset wording | DONE | 1 | "At Threshold" renamed to "Near Threshold". |
| F26 | Offline caching | PARTIAL | 7 | Fixed: cache cleanup now only deletes `fizzix-` prefixed caches (was deleting all). Navigation fallback returns home-page shell for uncached routes and 503 Response as last resort (was returning undefined). Remaining: topic pages not precached; full offline navigation requires visited-page caching which is already implemented via stale-while-revalidate. Multi-build update behavior and truly uncached navigation not verified. |

## Summary

- **DONE**: 14 findings (F01, F02, F04, F07, F08, F09, F10, F13, F16, F17, F18, F19, F20, F25)
- **PARTIAL**: 11 findings (F03, F05, F06, F11, F12, F14, F15, F21, F22, F24, F26)
- **OPEN**: 1 finding (F23 - requires profiling to demonstrate or rule out performance issue)

## Batch 8 changes (second verification response)

### Fixes
- **F17/F18**: End-to-end sync acknowledgment contract. Client (`offlineStorage.ts`) now checks response body for `stored:false` and `synced === 0` before marking records synced. Server returns explicit `{stored:true, acceptedIds:[...]}` on durable persistence and `{stored:false}` when no database is configured. Records remain in the unsynced queue when storage is unavailable.
- **F09/F08**: Keyboard stepping (`useKeyboardShortcuts.ts`) now reads `compareMode` and `paramsB` from the simulation store and computes `Math.max(tofA, tofB)` for the ArrowRight endpoint, matching PlaybackBar and Canvas2D. ArrowRight at t=5s in Moon/Earth compare no longer jumps backward to 2.886s.
- **F17**: Question-bank validation. New `src/lib/quiz/questionBank.ts` provides `isValidQuestion()`, `deriveCorrectness()`, and `lookupQuestion()` backed by all six topic quiz pools. API route rejects invented question IDs with 400. Server derives `correct` from the bank's `correctIndex` and submitted `selected`, ignoring client-supplied boolean.
- **F14**: Mobile layout. Main content area is `overflow-y-auto` on mobile so controls scroll into view rather than being clipped. Canvas has responsive height (`h-[50vw] min-h-[180px] max-h-[300px]`) on mobile. Control panel uses `shrink-0` instead of `flex-1` to avoid competing for viewport space.

### Regression tests rewritten
- `src/__tests__/regression-fixes.test.ts`: 13 tests (up from 6). Tests now exercise production code:
  - F07: Uses real `QUIZ_POOL` and `ELEC_QUIZ_POOL` instead of mock questions
  - F09: Tests compare-mode TOF logic and verifies the exact regression (ArrowRight at t=5 jumping to 2.886)
  - F17: Tests actual `isValidQuestion`, `deriveCorrectness`, `lookupQuestion` from `questionBank.ts`; verifies cross-topic rejection and server-derived correctness
  - F17/F18: Verifies sync response contract shape

### Verification results
- TypeScript: `tsc --noEmit` exits zero
- ESLint: 0 errors, 0 warnings (src/)
- Dash lint: 0 violations
- Production build: succeeds
- Unit tests: 288/288 pass (275 original + 13 regression)
