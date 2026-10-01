# Fizzix Audit Fix Status

Tracking fixes for audit findings F01-F26 from the comprehensive audit at commit `7523ff0`.

| Finding | Title | Status | Commit | Notes |
|---------|-------|--------|--------|-------|
| F01 | Type-check & lint errors | DONE | batch-1 | Fixed 4 real TS errors (thermoRenderer ghostTrails/tools, TabBar spread, unused import). Tests updated. |
| F02 | Damping model wrong frequency | DONE | batch-1 | Rewrote pendulum & spring to three-regime damped oscillator (underdamped/critical/overdamped). Damping limit widened to 5, unit changed to kg/s. |
| F03 | Pendulum energy inconsistency | DONE | batch-1 | Switched PE to small-angle quadratic form (0.5*m*g*L*theta^2) consistent with trajectory model. |
| F04 | Bohr model ignores Z | DONE | batch-1 | modernStateAtTime now passes Z to bohrRadiusPm, electronSpeed, bohrRadius. |
| F05 | Optics f=0 / virtual ray issues | PARTIAL | batch-1 | lensPower returns null for f=0; lens nature labels corrected. Virtual ray rendering TBD. |
| F06 | Quiz answer errors | TODO | | thermo-h1 mean free path, opt-h1 Snell angle need correction. |
| F07 | Topic lifecycle leaks | TODO | | Quiz/undo state not reset on topic change; URL params overwrite shared links. |
| F08 | Keyboard shortcuts topic-locked | DONE | batch-1 | Rewrote to accept SimulationModule, uses topic.tabs and topic.timeOfFlight. |
| F09 | Compare mode truncated playback | DONE | batch-1 | PlaybackBar now uses max(tofA, tofB) in compare mode. |
| F10 | Gas worker sync | TODO | | Clock, reset, paused config issues. |
| F11 | Gas PV/speed distribution | TODO | | Pressure/volume/speed inconsistencies in thermodynamics. |
| F12 | Disconnected controls | TODO | | Graph toggle, SHM velocity, gas histogram, etc. |
| F13 | Generic state shape for data table | TODO | | Data table assumes projectile x/y/vx/vy shape. |
| F14 | Small-screen layout | TODO | | 0px canvas height on mobile. |
| F15 | Accessibility | TODO | | Unnamed sliders, zoom restriction, keyboard traps. |
| F16 | 3D screenshot export blank | TODO | | Three.js canvas not captured by export. |
| F17 | Quiz API validation | TODO | | Missing server-side validation on quiz submissions. |
| F18 | Offline sync chunking | TODO | | Large sync payloads, no idempotency. |
| F19 | Adaptive quiz label mismatch | TODO | | UI labels don't match adaptive algorithm state. |
| F20 | Longitudinal wave model | TODO | | Wave model physics issues. |
| F21 | Drag coefficient units | TODO | | Cd/b unit confusion in projectile drag. |
| F22 | Dependency advisories | TODO | | npm audit findings triage. |
| F23 | Animation performance | TODO | | requestAnimationFrame / GC pauses. |
| F24 | Teaching preset gaps | TODO | | Missing pedagogical presets. |
| F25 | Threshold preset wording | DONE | batch-1 | Renamed to "Near Threshold", updated hookQuestion. |
| F26 | Offline caching | TODO | | Service worker cache strategy gaps. |
