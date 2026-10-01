# Fizzix Dependency Audit

Date: 1 October 2026
Branch: `claude/brave-ramanujan-s4hhf9`
Total: 23 vulnerabilities (8 moderate, 13 high, 2 critical)

## Per-Advisory Triage

### Critical (2)

| Package | Advisory | Exposure | Remediation |
|---------|----------|----------|-------------|
| next 14.2.35 | GHSA-9g9p-9gw9-jx7f (DoS via Image Optimizer) | **Production**: only if remotePatterns configured and image optimization enabled. Fizzix uses no remote images. Low risk. | Upgrade next to >=16.3.8 (breaking) |
| next 14.2.35 | GHSA-p293-qw3h-jr36 (RCE on Windows) | **Not reachable**: app runs on Linux containers. No Windows deployment. | Same upgrade path |

### High (13)

| Package | Advisory | Exposure | Remediation |
|---------|----------|----------|-------------|
| next 14.2.35 | 21 total advisories (DoS, SSRF, cache poisoning, XSS) | **Production**: DoS advisories affect any self-hosted Next.js. SSRF requires rewrites/custom server (Fizzix uses neither). Cache poisoning affects RSC. XSS requires CSP nonces or beforeInteractive (not used). **Partial exposure** - DoS and some cache advisories are reachable. | Upgrade next to >=16.3.8 (breaking - requires React 19, App Router API changes) |
| postcss <=8.5.22 | GHSA-qx2v-qp2m-jg93 (XSS in stringify), GHSA-6g55-p6wh-862q (file read via sourceMappingURL) | **Build-time only**: PostCSS runs at build, not in production browser. Attacker would need to control CSS source files. Low risk. | Bundled with next; upgrades with it |
| @hono/node-server | GHSA-wc8c-qw6v-h7f6 (auth bypass in serveStatic) | **Not reachable**: hono is a transitive dep of prisma's dev tooling. Fizzix does not use hono's serveStatic. No exposure. | Upgrade prisma to >=7.10.0 (breaking) |
| hono <=4.13.6 | 9 advisories (XSS, cache deception, IP spoofing, etc.) | **Not reachable**: transitive dep of prisma dev tooling. Fizzix does not use hono directly. No exposure. | Same prisma upgrade |
| glob 10.x | GHSA-5j98-mcp5-4vw2 (command injection via CLI) | **Dev-only**: glob CLI is not used at runtime. Requires attacker to control `--cmd` argument. No exposure. | Upgrade eslint-config-next to >=16.x (breaking - requires next 16) |
| lodash <=4.17.21 | GHSA-02r8-w7gm-fj2m (prototype pollution) | **Transitive dev dep**: via chevrotain -> @mrleebo/prisma-ast -> @prisma/dev. Not used at runtime. Low risk. | Upgrade prisma (breaking) |

### Moderate (8)

| Package | Advisory | Exposure | Remediation |
|---------|----------|----------|-------------|
| @vitest/mocker <=4.1.10 | GHSA-82fw-gwwq-j7x9 (path traversal) | **Dev-only**: test runner, never deployed. Attacker would need local access. No production exposure. | Upgrade vitest to >=5.0.3 (breaking - requires API changes in test config) |
| esbuild <=0.24.2 | GHSA-67mh-4wv8-2f99 (dev server request access) | **Dev-only**: esbuild dev server not exposed externally. No production exposure. | Bundled with vite; upgrades with vitest |
| vite <=6.4.2 | Depends on vulnerable esbuild | **Dev-only**: same as above. | Upgrade vitest |
| valibot <=1.4.1 | GHSA-5qjj-4xww-7phc (flatten() throw) | **Dev-only**: transitive dep of prisma dev tooling. No runtime use. | Upgrade prisma |

## Reachability Summary

| Category | Count | In Production? |
|----------|-------|----------------|
| next framework (DoS, cache, SSRF) | 2 critical + 11 high | **Some reachable** (DoS, cache poisoning via RSC). SSRF/XSS variants not reachable with current config. |
| postcss (build-time only) | 4 high | No - build-time CSS processing |
| prisma/hono chain (dev tooling) | 3 high + 1 moderate | No - dev tooling, not imported at runtime |
| vitest/esbuild/vite (test runner) | 2 moderate | No - dev dependency |
| glob CLI (eslint plugin) | 1 high | No - lint-time, CLI not invoked |
| lodash (dev transitive) | 1 high | No - transitive dev dep |

## Recommended Upgrade Path

### Phase 1: Non-breaking (none available)
All 23 vulnerabilities require breaking changes. `npm audit fix` finds no non-breaking solutions.

### Phase 2: Isolated dev-dep upgrades (lower risk)
1. **vitest 2.x -> 5.x**: Fixes @vitest/mocker, esbuild, vite. Requires updating test config and runner API. Dev-only change, no production impact. 4 advisories.
2. **eslint-config-next**: Fixes glob. Requires eslint config changes. Dev-only. 1 advisory.

### Phase 3: Major framework upgrade (high risk, integration testing required)
3. **next 14 -> 16**: Fixes 13 high + 2 critical advisories plus postcss. Requires React 19, App Router API changes, middleware changes, component migration. Must verify all 6 simulation topics render correctly. **Largest blast radius.**
4. **prisma 8.0.0-rc -> 7.10.0 (stable)**: Fixes hono, valibot, lodash chain. Requires schema/migration compatibility check. 4 advisories.

### Not upgrading
The following are acceptable short-term because they have no production reachability:
- hono/valibot/lodash chain (prisma dev tooling internals)
- esbuild/vite (dev server only)
- glob CLI (never invoked)

The next upgrade (DoS advisories) is the priority but requires coordinated framework migration.
