# Fizzix Audit Fix Status

Tracking fixes for audit findings F01-F26 from the comprehensive audit at commit `7523ff0`.

| Finding | Title | Status | Batch | Notes |
|---------|-------|--------|-------|-------|
| F01 | Type-check & lint errors | DONE | 1 | Fixed 4 TS errors (thermoRenderer ghostTrails/tools, TabBar spread, unused import). Added min-h-[200px] canvas container. |
| F02 | Damping model wrong frequency | DONE | 1 | Rewrote pendulum & spring to three-regime damped oscillator (underdamped/critical/overdamped). Damping limit 0-5, unit kg/s. |
| F03 | Pendulum energy inconsistency | DONE | 1 | Switched PE to small-angle quadratic form (0.5·m·g·L·θ²) consistent with trajectory model. |
| F04 | Bohr model ignores Z | DONE | 1 | modernStateAtTime now passes Z to bohrRadiusPm, electronSpeed, bohrRadius. |
| F05 | Optics f=0 / virtual ray issues | DONE | 1,6 | lensPower returns null for f=0; lens nature labels corrected. Virtual ray rendering fixed: solid actual rays, dashed extensions for virtual images. Added diverging lens Ray 3. |
| F06 | Quiz answer errors | DONE | 2 | thermo-h1: 93nm→61nm (correct MFP calculation). opt-h1: 39.3°→38.8° (correct Snell's law). Both verified with independent calculations. |
| F07 | Topic lifecycle leaks | DONE | 2 | Topic change effect resets playback (time=0, state=ready), undo history, quiz state, compare mode, ghost trails. |
| F08 | Keyboard shortcuts topic-locked | DONE | 1 | Rewrote to accept SimulationModule, uses topic.tabs and topic.timeOfFlight. |
| F09 | Compare mode truncated playback | DONE | 1 | PlaybackBar uses max(tofA, tofB) in compare mode. |
| F10 | Gas worker sync | DONE | 3 | Added 'reset' message handler to worker. Scene3DGas detects ready-state transition and calls builder.reset(). |
| F11 | Gas PV/pressure inconsistency | DONE | 3 | Pressure now uses effectiveVolume for piston mode (V × pistonPos). Also fixed in thermoRenderer. |
| F12 | Disconnected controls | DONE | 4 | Removed dead 'graph' layer toggle from projectile module (no rendering code existed). |
| F13 | Generic data table | DONE | 2 | DataTable rewritten to use topic.derivedValues/derivedValueKeys. Dynamic columns, CSV export uses topic labels/units. |
| F14 | Small-screen layout | DONE | 2 | Added min-h-[200px] to canvas container in SimulationPage. |
| F15 | Accessibility | DONE | 2 | Added aria-label/aria-valuemin/aria-valuemax/aria-valuenow to sliders. Removed maximumScale:1 from viewport (WCAG 1.4.4). |
| F16 | 3D screenshot export blank | DONE | 5 | Added preserveDrawingBuffer:true to WebGLRenderer in Scene3D and Scene3DGas. |
| F17 | Quiz API validation | DONE | 4 | Added server-side validation: selected 0-3, difficulty enum, string length ≤100, timestamp finite non-negative. |
| F18 | Offline sync chunking | DONE | 5 | Added chunking (50 results per request) with per-chunk markSynced. Added idempotency via client-side id passed to API with skipDuplicates. |
| F19 | Adaptive quiz label mismatch | DONE | 2 | Difficulty badge shows currentQuestion.difficulty instead of adaptive target. |
| F20 | Longitudinal wave speed | DONE | 4 | Changed hardcoded waveSpeed=2.0 to SPACING·√(k/m) — correct spring-mass chain dispersion. |
| F21 | Drag coefficient units | DONE | 2 | Symbol Cd→b, unit ''→'1/m', help text updated to describe combined drag per unit mass. |
| F22 | Dependency advisories | PARTIAL | 5 | Ran npm audit fix for non-breaking updates. Breaking-change upgrades (next, prisma) deferred — require integration testing. |
| F23 | Animation performance | DEFERRED | — | requestAnimationFrame/GC optimizations are architectural. No specific regression identified. |
| F24 | Teaching preset gaps | DEFERRED | — | Recommendation-only finding. Adding presets requires pedagogical review beyond bug-fix scope. |
| F25 | Threshold preset wording | DONE | 1 | Renamed "At Threshold" to "Near Threshold". |
| F26 | Offline caching | DEFERRED | — | Service worker cache strategy is an architectural addition, not a bug fix. |

## Summary

- **DONE**: 21 findings
- **PARTIAL**: 1 finding (F22 breaking-change deps)
- **DEFERRED**: 3 findings (F23, F24, F26 — recommendations/architectural, not bugs)
