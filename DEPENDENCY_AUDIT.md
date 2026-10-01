# Fizzix Dependency Audit

Date: 1 October 2026
Branch: `claude/brave-ramanujan-s4hhf9`

## Methodology

Generated from `npm audit --json` on the installed lockfile. Counts below distinguish **packages** (npm entries flagged by `npm audit`) from **individual advisories** (distinct GHSA entries, deduplicated across packages). A single package can aggregate many advisories; `npm audit` propagates the highest severity from any advisory to the package level. The audit environment is Node 24.19 on Linux. Production deployment is assumed to be Linux containers, but this has not been verified against production configuration.

## Summary

| Level | Packages | Unique Advisories (by own severity) |
|-------|----------|-------------------------------------|
| Critical | 2 (`next`, `vitest`) | 3 |
| High | 13 | 16 |
| Moderate | 8 | 55 |
| Low | 0 | 5 |
| **Total** | **23 packages** | **79 unique advisories** |

Note: GHSA-82fw-gwwq-j7x9 appears under both `vitest` and `@vitest/mocker` but is one advisory (moderate severity). Package-level severity is propagated by `npm audit` and does not reflect individual advisory severity. Most high/moderate packages are transitive dependencies of `next`, `prisma`, or `vitest`.

## Critical Advisories (3)

| Advisory | Package | Title | Own Severity | Exposure |
|----------|---------|-------|--------------|----------|
| GHSA-p293-qw3h-jr36 | next | RCE on Windows | Critical (CVSS 9.0) | **Not reachable** (assumes Linux deployment) |
| GHSA-2xp9-vwfh-vxw4 | next | RCE in Image Optimization API (AVIF) | Critical | **Low**: requires AVIF image processing; Fizzix uses no remote images |
| GHSA-5xrq-8626-4rwp | vitest | Arbitrary file read/execute via UI server | Critical (CVSS 9.8) | **Not reachable**: vitest is a dev dependency, UI server not exposed |

## Critical Packages (2)

### next 14.2.35 (direct dependency)

23 direct advisories (by own severity: 2 critical, 7 high, 11 moderate, 3 low) + 4 upstream (postcss, 2 high + 2 moderate).

| Advisory | Title | Own Severity | Exposure |
|----------|-------|--------------|----------|
| GHSA-p293-qw3h-jr36 | RCE on Windows | Critical | **Not reachable**: assumes Linux containers |
| GHSA-2xp9-vwfh-vxw4 | RCE in Image Optimization API (AVIF) | Critical | **Low**: no remote images used |
| GHSA-9g9p-9gw9-jx7f | DoS via Image Optimizer | Moderate | **Low**: no `remotePatterns` configured |
| GHSA-h25m-26qc-wcjf | DoS via RSC deserialization | High | **Partial**: reachable on self-hosted Next.js |
| GHSA-q4gf-8mx6-v5v3 | DoS with Server Components | High | **Partial**: reachable |
| GHSA-8h8q-6873-q5fj | DoS with Server Components | High | **Partial**: reachable |
| GHSA-c4j6-fc7j-m34r | SSRF via WebSocket upgrades | High | **Low**: no WebSocket upgrade usage |
| GHSA-36qx-fr4f-26g5 | Middleware bypass (i18n) | High | **Low**: no i18n middleware |
| GHSA-m99w-x7hq-7vfj | DoS via Server Actions | High | **Partial**: Server Actions used |
| GHSA-89xv-2m56-2m9x | SSRF in Server Actions (custom servers) | High | **Low**: no custom server |
| GHSA-p9j2-gv94-2wf4 | SSRF via rewrites | High | **Low**: no rewrites to attacker-controlled hosts |
| GHSA-ggv3-7p47-pfv8 | HTTP request smuggling in rewrites | Moderate | **Low**: no rewrites used |
| GHSA-3x4c-7xq6-9pq8 | Unbounded image disk cache | Moderate | **Low**: no next/image usage |
| GHSA-ffhc-5mcf-pf4q | XSS via CSP nonces | Moderate | **Not reachable**: no CSP nonces used |
| GHSA-gx5p-jg67-6x7h | XSS in beforeInteractive | Moderate | **Not reachable**: not used |
| GHSA-h64f-5h5j-jqjh | DoS in Image Optimization API | Moderate | **Low**: no remote image optimization |
| GHSA-wfc6-r584-vfw7 | Cache poisoning (RSC responses) | Moderate | **Partial**: RSC used |
| GHSA-68g3-v927-f742 | Cache confusion (request bodies) | Moderate | **Partial** |
| GHSA-4633-3j49-mh5q | Cache confusion (invalid UTF-8) | Moderate | **Partial** |
| GHSA-4c39-4ccg-62r3 | Unbounded Server Action payload (Edge) | Moderate | **Low**: no Edge runtime used |
| GHSA-955p-x3mx-jcvp | Server Function endpoint disclosure | Moderate | **Partial** |
| GHSA-3g8h-86w9-wvmq | Middleware cache poisoning | Low | **Low** |
| GHSA-vfv6-92ff-j949 | Cache poisoning (RSC cache-busting) | Low | **Low** |

**Remediation**: Upgrade `next` to >=16.3.8. **Breaking**: requires React 19, App Router API changes, middleware changes. Largest blast radius.

### vitest 2.1.9 (direct dev dependency)

1 direct critical advisory + 1 moderate advisory (path traversal via @vitest/mocker) + 3 upstream (esbuild, vite).

| Advisory | Title | Own Severity | Exposure |
|----------|-------|--------------|----------|
| GHSA-5xrq-8626-4rwp | Arbitrary file read/execute via UI server | Critical | **Not reachable**: dev dependency, UI server not exposed |
| GHSA-82fw-gwwq-j7x9 | Path traversal via @vitest/mocker | Moderate | **Not reachable**: dev dependency |

**Remediation**: Upgrade `vitest` to >=5.0.3. **Breaking**: requires API changes in test config. Dev-only, no production impact.

## High Packages (13)

| Package | Advisories (own severity) | Dependency Path | Exposure | Remediation |
|---------|--------------------------|-----------------|----------|-------------|
| postcss <=8.5.22 | 2 high, 2 moderate | next -> postcss | **Build-time only**: runs at build, not in browser | Upgrades with next |
| @hono/node-server | 1 high, 2 moderate | prisma -> @prisma/dev -> @hono/node-server | **Not reachable**: serveStatic not used | Upgrade prisma >=7.10.0 |
| hono <=4.13.6 | 2 high, 29 moderate, 3 low | prisma -> @prisma/dev -> hono | **Not reachable**: transitive dev dep, hono not used | Same prisma upgrade |
| glob 10.x | 1 high | eslint-config-next -> glob | **Dev-only**: glob CLI not invoked at runtime | Upgrade eslint-config-next >=16.x |
| lodash <=4.17.21 | 1 high, 2 moderate | prisma -> ... -> chevrotain -> lodash | **Transitive dev dep**: not used at runtime | Upgrade prisma |
| vite | 1 high, 2 moderate | vitest -> vite | **Dev-only**: dev server not exposed | Upgrades with vitest |
| prisma | 0 direct, upstream | direct | **Dev tooling**: prisma CLI and dev tools | Upgrade prisma >=7.10.0 |
| eslint-config-next | 0 direct, upstream (glob) | direct | **Dev-only**: lint-time | Upgrade eslint-config-next |
| @prisma/dev, @prisma/composer, @prisma/composer-cli, alchemy, @next/eslint-plugin-next | 0 direct each | transitive | **Not reachable**: inherit from parents above | Upgrade parent packages |

## Moderate Packages (8)

| Package | Advisory | Own Severity | Exposure | Remediation |
|---------|----------|--------------|----------|-------------|
| @vitest/mocker <=4.1.10 | GHSA-82fw-gwwq-j7x9 | Moderate | **Dev-only**: test runner | Upgrade vitest >=5.0.3 |
| esbuild <=0.24.2 | GHSA-67mh-4wv8-2f99 | Moderate | **Dev-only**: dev server not exposed | Bundled with vite |
| valibot <=1.4.1 | GHSA-5qjj-4xww-7phc | Moderate | **Dev-only**: prisma dev tooling | Upgrade prisma |
| chevrotain, @chevrotain/gast, @chevrotain/cst-dts-gen, @mrleebo/prisma-ast, vite-node | 0 direct each | N/A | **Dev-only**: transitive | Upgrade parent packages |

## Reachability Summary

| Category | Packages | Advisories (by own severity) | In Production? |
|----------|----------|------------------------------|----------------|
| next framework | 1 critical + 1 high + transitive | 2 critical, 7 high, 11 moderate, 3 low (next) + 2 high, 2 moderate (postcss) | **Partial**: DoS and cache advisories reachable. SSRF/XSS/Windows-RCE not reachable with current configuration. |
| vitest/esbuild/vite chain | 1 critical + 2 high + 3 moderate | 1 critical, 1 high, 4 moderate | **No**: dev dependency only |
| prisma/hono chain | 3 high + 4 moderate | 2 high, 31 moderate, 3 low (hono) + 1 high, 2 moderate (@hono/node-server) + others | **No**: dev tooling, not imported at runtime |
| glob (eslint plugin) | 1 high | 1 high | **No**: lint-time, CLI not invoked |
| lodash (dev transitive) | 1 high | 1 high, 2 moderate | **No**: transitive dev dep |

## Recommended Upgrade Path

### Phase 1: Non-breaking (none available)
All vulnerabilities require breaking changes. `npm audit fix` finds no non-breaking solutions. This does not establish that every possible remediation requires a major upgrade; individual advisory/release notes should be verified before upgrading.

### Phase 2: Dev-dep upgrades (lower risk, no production impact)
1. **vitest 2.x -> 5.x**: Fixes vitest (1 critical), @vitest/mocker (1 moderate), esbuild, vite. Requires updating test config and runner API. Dev-only change.
2. **eslint-config-next**: Fixes glob. Requires eslint config changes. Dev-only.

### Phase 3: Major framework upgrade (high risk, integration testing required)
3. **next 14 -> 16**: Fixes 23 next advisories + 4 postcss. Requires React 19, App Router API changes, middleware changes, component migration. Must verify all 6 simulation topics render correctly. **Largest blast radius.**
4. **prisma -> 7.10.0 (stable)**: Fixes hono (34 advisories), @hono/node-server (3), valibot, lodash, chevrotain chain. Requires schema/migration compatibility check.

### Acceptable short-term deferrals
The following have no production reachability:
- hono/valibot/lodash/chevrotain chain (prisma dev tooling internals)
- esbuild/vite (dev server only, not exposed)
- glob CLI (never invoked at runtime)
- vitest UI server (dev dependency, critical severity but zero production exposure)

### Production priority
The `next` upgrade (DoS and cache poisoning advisories) is the only production-reachable remediation and requires coordinated framework migration.

## Limitations

- Advisory counts and severities are from `npm audit --json` on Node 24.19/Linux, deduplicated by GHSA URL. A different Node version or OS may show different results.
- "Not reachable" claims are based on Fizzix's current feature set and assumed deployment configuration. Deployment to Linux containers has not been verified against production evidence. Changes to deployment (Windows, custom server, remote image patterns) could change exposure.
- Package files (`package.json`, `package-lock.json`) are unchanged by this audit; no upgrades have been applied.
- "npm audit fix found no automatic fix" does not establish that every remediation requires a major upgrade. Verify proposed fixed versions against authoritative advisory/release information before upgrading.
