# Fizzix Dependency Audit

Date: 1 October 2026
Branch: `claude/brave-ramanujan-s4hhf9`

## Methodology

Generated from `npm audit --json` on the installed lockfile. Counts below distinguish **packages** (npm entries flagged by `npm audit`) from **individual advisories** (distinct GHSA entries). A single package can aggregate many advisories. The audit environment is Node 24.19 on Linux; production deployment is also Linux containers.

## Package-Level Summary

| Severity | Packages | Unique Advisories |
|----------|----------|-------------------|
| Critical | 2 (`next`, `vitest`) | 25 |
| High | 13 | 52 |
| Moderate | 8 | 3 |
| **Total** | **23 packages** | **80 unique advisories** |

Note: most high/moderate packages are transitive dependencies of `next`, `prisma`, or `vitest`. They inherit their parent's severity because `npm audit` propagates.

## Critical Packages (2)

### next 14.2.35 (direct dependency)

23 direct advisories + 1 upstream (postcss). Includes:

| Advisory | Title | Severity | Exposure |
|----------|-------|----------|----------|
| GHSA-9g9p-9gw9-jx7f | DoS via Image Optimizer | Critical | **Low**: Fizzix uses no remote images. Only reachable if `remotePatterns` configured. |
| GHSA-p293-qw3h-jr36 | RCE on Windows | Critical | **Not reachable**: production runs on Linux containers. |
| Multiple (21 high) | DoS, SSRF, cache poisoning, XSS | High | **Partial**: DoS advisories affect any self-hosted Next.js. SSRF requires rewrites/custom server (not used). Cache poisoning affects RSC. XSS requires CSP nonces or beforeInteractive (not used). |

**Remediation**: Upgrade `next` to >=16.3.8. **Breaking**: requires React 19, App Router API changes, middleware changes. Largest blast radius.

### vitest 2.1.9 (direct dev dependency)

2 direct advisories + 3 upstream (esbuild, vite, @vitest/mocker).

| Advisory | Title | Severity | Exposure |
|----------|-------|----------|----------|
| (vitest UI server) | Dev server vulnerability | Critical | **Not reachable**: vitest is a dev dependency, never deployed to production. Dev server not exposed externally. |
| (vitest UI server) | Second dev server advisory | Critical | **Not reachable**: same reasoning. |

**Remediation**: Upgrade `vitest` to >=5.0.3. **Breaking**: requires API changes in test config. Dev-only, no production impact.

## High Packages (13)

| Package | Advisories | Dependency Path | Exposure | Remediation |
|---------|------------|-----------------|----------|-------------|
| postcss <=8.5.22 | 4 (XSS in stringify, file read via sourceMappingURL) | next -> postcss | **Build-time only**: PostCSS runs at build, not in browser. Low risk. | Upgrades with next |
| @hono/node-server | 3 (auth bypass in serveStatic) | prisma -> @prisma/dev -> @hono/node-server | **Not reachable**: Fizzix does not use hono's serveStatic. | Upgrade prisma >=7.10.0 |
| hono <=4.13.6 | 38 (XSS, cache deception, IP spoofing, etc.) | prisma -> @prisma/dev -> hono | **Not reachable**: transitive dev dep. Fizzix does not use hono. | Same prisma upgrade |
| glob 10.x | 1 (command injection via CLI) | eslint-config-next -> glob | **Dev-only**: glob CLI not invoked at runtime. | Upgrade eslint-config-next >=16.x |
| lodash <=4.17.21 | 3 (prototype pollution) | prisma -> ... -> chevrotain -> lodash | **Transitive dev dep**: not used at runtime. | Upgrade prisma |
| vite | 3 direct + 1 upstream (esbuild) | vitest -> vite | **Dev-only**: dev server not exposed. | Upgrades with vitest |
| prisma | 0 direct, 1 upstream | direct | **Dev tooling**: prisma CLI and dev tools. | Upgrade prisma >=7.10.0 |
| eslint-config-next | 0 direct, 1 upstream (glob) | direct | **Dev-only**: lint-time. | Upgrade eslint-config-next |
| @prisma/dev, @prisma/composer, @prisma/composer-cli, alchemy, @next/eslint-plugin-next | 0 direct each | transitive | **Not reachable**: inherit from parents above. | Upgrade parent packages |

## Moderate Packages (8)

| Package | Advisory | Exposure | Remediation |
|---------|----------|----------|-------------|
| @vitest/mocker <=4.1.10 | GHSA-82fw-gwwq-j7x9 (path traversal) | **Dev-only**: test runner, never deployed. | Upgrade vitest >=5.0.3 |
| esbuild <=0.24.2 | GHSA-67mh-4wv8-2f99 (dev server request access) | **Dev-only**: dev server not exposed. | Bundled with vite |
| valibot <=1.4.1 | GHSA-5qjj-4xww-7phc (flatten() throw) | **Dev-only**: transitive dep of prisma dev tooling. | Upgrade prisma |
| chevrotain, @chevrotain/gast, @chevrotain/cst-dts-gen, @mrleebo/prisma-ast, vite-node | 0 direct each | **Dev-only**: transitive. | Upgrade parent packages |

## Reachability Summary

| Category | Packages | Advisories | In Production? |
|----------|----------|------------|----------------|
| next framework | 1 critical + 1 high + transitive | 23 + 4 postcss | **Partial**: DoS and cache poisoning reachable. SSRF/XSS/Windows-RCE not reachable. |
| vitest/esbuild/vite chain | 1 critical + 2 high + 3 moderate | ~7 | **No**: dev dependency only |
| prisma/hono chain | 3 high + 4 moderate | ~45 (mostly hono) | **No**: dev tooling, not imported at runtime |
| glob (eslint plugin) | 1 high | 1 | **No**: lint-time, CLI not invoked |
| lodash (dev transitive) | 1 high | 3 | **No**: transitive dev dep |

## Recommended Upgrade Path

### Phase 1: Non-breaking (none available)
All vulnerabilities require breaking changes. `npm audit fix` finds no non-breaking solutions.

### Phase 2: Dev-dep upgrades (lower risk, no production impact)
1. **vitest 2.x -> 5.x**: Fixes vitest (critical), @vitest/mocker, esbuild, vite. Requires updating test config and runner API. Dev-only change. ~7 advisories.
2. **eslint-config-next**: Fixes glob. Requires eslint config changes. Dev-only. 1 advisory.

### Phase 3: Major framework upgrade (high risk, integration testing required)
3. **next 14 -> 16**: Fixes 23 next advisories + 4 postcss. Requires React 19, App Router API changes, middleware changes, component migration. Must verify all 6 simulation topics render correctly. **Largest blast radius.**
4. **prisma -> 7.10.0 (stable)**: Fixes hono (38 advisories), @hono/node-server (3), valibot, lodash, chevrotain chain. Requires schema/migration compatibility check.

### Acceptable short-term deferrals
The following have no production reachability:
- hono/valibot/lodash/chevrotain chain (prisma dev tooling internals)
- esbuild/vite (dev server only, not exposed)
- glob CLI (never invoked at runtime)
- vitest UI server (dev dependency, critical severity but zero production exposure)

### Production priority
The `next` upgrade (DoS and cache poisoning advisories) is the only production-reachable remediation and requires coordinated framework migration.

## Limitations

- Advisory counts are from `npm audit` on Node 24.19/Linux. A different Node version or OS may show different results.
- "Not reachable" claims are based on Fizzix's current feature set and deployment configuration. Changes to deployment (Windows, custom server, remote image patterns) could change exposure.
- Package files (`package.json`, `package-lock.json`) are unchanged by this audit; no upgrades have been applied.
