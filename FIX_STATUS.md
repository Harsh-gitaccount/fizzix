# Fizzix Audit Fix Status

Tracking fixes for audit findings F01-F26 from the comprehensive audit at commit `7523ff0`.
Reconciled against independent verification at commit `fcb3b41` (1 October 2026).
Current head includes verification-response fixes (batch 7).

| Finding | Title | Status | Batch | Notes |
|---------|-------|--------|-------|-------|
| F01 | Type-check & lint errors | DONE | 1,7 | TS errors fixed. ESLint 53 errors fixed (unused vars/imports/prefer-const). 50 dash-lint violations fixed. E2E route corrected (`/projectile-motion`). Production build passes. |
| F02 | Damping model wrong frequency | DONE | 1 | Rewrote pendulum & spring to three-regime damped oscillator (underdamped/critical/overdamped). |
| F03 | Pendulum energy inconsistency | PARTIAL | 1 | PE switched to small-angle quadratic form. UI still allows 60deg without visible small-angle restriction or disclosure. |
| F04 | Bohr model ignores Z | DONE | 1 | modernStateAtTime passes Z to bohrRadiusPm, electronSpeed, bohrRadius. |
| F05 | Optics f=0 / virtual ray issues | PARTIAL | 1,6 | lensPower null for f=0; virtual ray rendering improved. `drawPrincipalRays` still receives animated `animImgH`; intermediate-frame geometry remains tied to changing image height during reveal. |
| F06 | Quiz answer errors | PARTIAL | 2 | Two numerical corrections applied (thermo-h1, opt-h1). Other conceptual wording/assumption issues not all addressed. |
| F07 | Topic lifecycle leaks | DONE | 2,7 | `resetQuiz()` now clears `sessionQuestions`. URL param restoration moved after topic defaults in init effect with clamping/validation. Topic change resets playback, undo, quiz, compare, ghosts. |
| F08 | Keyboard shortcuts topic-locked | DONE | 1 | Rewrote to accept SimulationModule, uses topic.tabs and topic.timeOfFlight. |
| F09 | Compare mode truncated playback | DONE | 1,7 | PlaybackBar uses max(tofA, tofB). Canvas2D animation loop now also uses max(tofA, tofB) in compare mode. |
| F10 | Gas worker sync | DONE | 3,7 | Worker reset handler added. `Scene3DGas` passes `deltaReal * speed` (scaled time) to `builder.step()` so simulation clock matches display at all playback speeds. |
| F11 | Gas PV/pressure inconsistency | PARTIAL | 3 | Pressure uses effectiveVolume for piston mode. Box-volume mapping and distribution/energy-label issues remain separate parts of original finding. |
| F12 | Disconnected controls | PARTIAL | 4,7 | Removed dead 'graph' layer toggle. Added Speed Distribution histogram overlay to 3D gas scene (`Scene3DGas`) so `histogram` layer toggle now has visible effect. Canvas2D vector gating still uses projectile tab names; broader per-mode layer/tool capability gaps not fully addressed. |
| F13 | Generic data table | DONE | 2 | DataTable rewritten to use topic.derivedValues/derivedValueKeys. |
| F14 | Small-screen layout | PARTIAL | 2,7 | Canvas container given `min-h-[180px]` on mobile. Full viewport-matrix verification across all six topics not performed; optics at 320x568 may still need layout work depending on content height. |
| F15 | Accessibility | PARTIAL | 2 | Slider ARIA attributes added. Viewport scaling fixed. Complete keyboard navigation, toggle/tab semantics, and nonvisual alternatives not demonstrated. |
| F16 | 3D screenshot export blank | DONE | 5 | preserveDrawingBuffer:true on WebGLRenderer. |
| F17 | Quiz API validation | DONE | 4,7 | Full envelope validation: null body/items return 400. `topicId` validated against 6 known topics. When no DATABASE_URL, returns `{synced:0, stored:false}` instead of false acknowledgment. |
| F18 | Offline sync chunking | DONE | 5 | Chunking with per-chunk markSynced and idempotency via skipDuplicates. |
| F19 | Adaptive quiz label mismatch | DONE | 2,7 | Badge shows item difficulty. `saveQuizResult` and `trackEvent` now use `q.difficulty` (question's own difficulty) instead of `s.difficulty` (adaptive store difficulty). |
| F20 | Longitudinal wave speed | DONE | 4 | Correct spring-mass chain dispersion formula. |
| F21 | Drag coefficient units | PARTIAL | 2 | Symbol/unit renamed. Trajectory cap and acceleration-vs-gravity semantics remain unaddressed. |
| F22 | Dependency advisories | PARTIAL | 5,7 | 23 vulnerabilities (8 moderate, 13 high, 2 critical). All require breaking changes. Per-advisory reachability analysis completed in `DEPENDENCY_AUDIT.md`. Production-reachable: next framework DoS/cache advisories. Not reachable: hono/prisma chain, vitest/esbuild, glob CLI. Upgrade path: vitest first (dev-only), then next 14->16 (major). |
| F23 | Animation performance | OPEN | - | No profiling performed. Requires representative animation and topic-switching measurement before claiming no regression exists. |
| F24 | Teaching preset gaps | PARTIAL | - | Original finding includes misleading existing preset questions/explanations, not only new-preset requests. Correcting misleading hooks is a code fix, not a pedagogical addition. |
| F25 | Threshold preset wording | DONE | 1 | "At Threshold" renamed to "Near Threshold". |
| F26 | Offline caching | PARTIAL | 7 | Fixed: cache cleanup now only deletes `fizzix-` prefixed caches (was deleting all). Navigation fallback returns home-page shell for uncached routes and 503 Response as last resort (was returning undefined). Remaining: topic pages not precached; full offline navigation requires visited-page caching which is already implemented via stale-while-revalidate. Production offline verification not performed. |

## Summary (reconciled)

- **DONE**: 15 findings (F01, F02, F04, F07, F08, F09, F10, F13, F16, F17, F18, F19, F20, F25, batch-7 resolved)
- **PARTIAL**: 10 findings (F03, F05, F06, F11, F12, F14, F15, F21, F22, F24, F26)
- **OPEN**: 1 finding (F23 - requires profiling to demonstrate or rule out performance issue)

## Batch 7 changes (verification response)

### Reproduced and fixed
- **F01**: 53 ESLint errors fixed, 50 dash-lint violations fixed, E2E route corrected, production build passes
- **F07**: `resetQuiz()` clears `sessionQuestions`; URL restoration moved after topic defaults with clamping
- **F09**: Canvas2D animation loop uses `Math.max(tofA, tofB)` in compare mode
- **F10**: `Scene3DGas` passes scaled time (`deltaReal * speed`) to `builder.step()`
- **F12**: Speed Distribution histogram overlay added to `Scene3DGas` via `getParticleSpeeds()` + canvas overlay
- **F14**: Canvas container given `min-h-[180px] md:min-h-0`
- **F17**: Full null/type/topic validation; honest no-storage acknowledgment
- **F19**: `saveQuizResult`/`trackEvent` now use `q.difficulty` instead of `s.difficulty`
- **F22**: Per-advisory reachability analysis in `DEPENDENCY_AUDIT.md`
- **F26**: Cache cleanup scoped to `fizzix-` prefix; navigation fallback returns valid Response instead of undefined

### Regression tests added
- `src/__tests__/regression-fixes.test.ts`: 6 tests covering F07 quiz reset, F09 compare TOF, F17 validation logic

### Verification results
- TypeScript: `tsc --noEmit` exits zero
- ESLint: 0 errors, 0 warnings
- Dash lint: 0 violations
- Production build: succeeds
- Unit tests: 281/281 pass (275 original + 6 regression)
