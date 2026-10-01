# Continuation Checkpoint

## Session State
- **Branch**: `claude/brave-ramanujan-s4hhf9`
- **Base commit**: `7523ff0c2e3164d205036a85d81d12ae0312f997`
- **Last batch**: batch-13 (accessibility improvements)
- **TypeScript**: 0 errors
- **ESLint**: 0 errors, 0 warnings (src/)
- **Dash lint**: 0 violations
- **Unit tests**: 339/339 passing
- **Production build**: succeeds

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
13. (pending) -- Batch 13: F15 accessibility, F21 trajectory cap

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

## Remaining Work

### PARTIAL (7 findings)
- **F03**: Small-angle approximation disclosure; full nonlinear solver not implemented
- **F06**: `opt-e8` mirage TIR explanation simplified but curriculum-aligned; not changing
- **F11**: Visual box volume not proportional to physics volume (1D scaling with clamping); visualization simplification
- **F14**: True touch/zoom/assistive-technology verification; actual device testing
- **F15**: Arrow key tab navigation, 3D keyboard camera controls, full assistive technology testing
- **F22**: No package upgrades applied; vitest 2→5 and next 14→16 needed
- **F26**: Multi-build updates, truly uncached navigation, production offline verification

### Not verifiable in current environment
- Real mobile touch interaction
- True browser zoom
- Assistive technology compatibility
- Multi-build service worker lifecycle
- Database integration (no DATABASE_URL)
- Real-device performance profiling
