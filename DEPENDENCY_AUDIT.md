# Fizzix Dependency Audit

Date: 2 October 2026 (updated)
Branch: `claude/brave-ramanujan-s4hhf9`

## Batch 20 Update (2 October 2026)

**Upgrades applied:** next 14.2.35 → 16.3.8, prisma CLI 8.0.0-rc.15 → 7.10.0, postcss 8.5.22 → 8.5.28 (via next 16).

| Level | Packages | Unique Advisories |
|-------|----------|-------------------|
| High | 4 | 3 |
| **Total** | **4 packages** | **3 unique advisories** |

**Resolved chains:**
- next 14.x: All 23 direct + 4 postcss advisories resolved by upgrading to next@16.3.8.
- prisma 8.0.0-rc chain: hono (28 advisories), lodash (3), valibot (1), @hono/node-server (3), @mrleebo/prisma-ast resolved by downgrading to prisma@7.10.0 stable.

**Remaining (4 packages, 3 unique advisories):**
- `deepmerge-ts <8.0.0` (GHSA-ggr8-5vv4-36mx, high): Stack exhaustion on crafted recursive object graphs. Transitive via prisma@7.10.0 → @prisma/config. **Not reachable**: requires attacker-controlled deeply nested input to prisma config; CLI-only usage.
- `mysql2 <=3.23.0` (GHSA-3f6p-5ww8-9rcr, GHSA-rgwj-5xj2-c3m3, high): Auth downgrade + decompression bomb. Transitive via prisma@7.10.0. **Not reachable**: project uses PostgreSQL datasource; mysql2 is never loaded at runtime.

**Fix path**: prisma@6.19.3 would resolve these but breaks @prisma/client@7.10.0 compatibility. No fix available within prisma 7.x.

---

*Original audit (1 October 2026) preserved below for reference. Counts reflect the pre-batch-20 state.*

## Methodology

Generated from `npm audit --json` on the installed lockfile. Counts below distinguish **packages** (npm entries flagged by `npm audit`) from **individual advisories** (distinct GHSA entries, deduplicated across packages). A single package can aggregate many advisories; `npm audit` propagates the highest severity from any advisory to the package level. The audit environment is Node 24.19 on Linux. Production deployment is assumed to be Linux containers, but this has not been verified against production configuration.

## Summary

| Level | Packages | Unique Advisories (by own severity) |
|-------|----------|-------------------------------------|
| Critical | 1 (`next`) | 2 |
| High | 9 | 13 |
| Moderate | 5 | 52 |
| Low | 0 | 5 |
| **Total** | **15 packages** | **72 unique advisories** |

**Upgrades applied (batch 14):** vitest 2.1.9 → 5.0.3 (with vite 6.x), eslint-config-next 14.2.35 → 15.5.27. Resolved 8 packages and 7 unique advisories (vitest critical, @vitest/mocker moderate, esbuild moderate, vite high+moderate, vite-node, glob high, eslint-config-next, @next/eslint-plugin-next).

Note: Package-level severity is propagated by `npm audit` and does not reflect individual advisory severity. Remaining packages are transitive dependencies of `next` and `prisma`.

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

### ~~vitest 2.1.9~~ → RESOLVED (upgraded to 5.0.3)

Upgraded in batch 14. All vitest/vite/esbuild advisories resolved. Required adding `vite@^6.4.0` and `@testing-library/dom` as explicit dev deps. `sync-client.test.ts` mock typing adapted for vitest 5's stricter `vi.fn()` types. All 339 tests pass.

## High Packages (13)

| Package | Advisories (own severity) | Dependency Path | Exposure | Remediation |
|---------|--------------------------|-----------------|----------|-------------|
| postcss <=8.5.22 | 2 high, 2 moderate | next -> postcss | **Build-time only**: runs at build, not in browser | Upgrades with next |
| @hono/node-server | 1 high, 2 moderate | prisma -> @prisma/dev -> @hono/node-server | **Not reachable**: serveStatic not used | Upgrade prisma >=7.10.0 |
| hono <=4.13.6 | 2 high, 29 moderate, 3 low | prisma -> @prisma/dev -> hono | **Not reachable**: transitive dev dep, hono not used | Same prisma upgrade |
| lodash <=4.17.21 | 1 high, 2 moderate | prisma -> ... -> chevrotain -> lodash | **Transitive dev dep**: not used at runtime | Upgrade prisma |
| prisma | 0 direct, upstream | direct | **Dev tooling**: prisma CLI and dev tools | Upgrade prisma >=7.10.0 |
| @prisma/dev, @prisma/composer, @prisma/composer-cli, alchemy | 0 direct each | transitive | **Not reachable**: inherit from parents above | Upgrade parent packages |
| ~~glob 10.x~~ | ~~1 high~~ | ~~eslint-config-next -> glob~~ | **RESOLVED**: eslint-config-next upgraded to 15.5.27 | |
| ~~vite~~ | ~~1 high, 2 moderate~~ | ~~vitest -> vite~~ | **RESOLVED**: vitest upgraded to 5.0.3, vite to 6.x | |
| ~~eslint-config-next~~ | ~~0 direct~~ | ~~direct~~ | **RESOLVED**: upgraded to 15.5.27 | |
| ~~@next/eslint-plugin-next~~ | ~~0 direct~~ | ~~transitive~~ | **RESOLVED**: upgraded with eslint-config-next | |

## Moderate Packages (8)

| Package | Advisory | Own Severity | Exposure | Remediation |
|---------|----------|--------------|----------|-------------|
| valibot <=1.4.1 | GHSA-5qjj-4xww-7phc | Moderate | **Dev-only**: prisma dev tooling | Upgrade prisma |
| chevrotain, @chevrotain/gast, @chevrotain/cst-dts-gen, @mrleebo/prisma-ast | 0 direct each | N/A | **Dev-only**: transitive | Upgrade parent packages |
| ~~@vitest/mocker~~ | ~~GHSA-82fw-gwwq-j7x9~~ | ~~Moderate~~ | **RESOLVED**: vitest upgraded to 5.0.3 | |
| ~~esbuild~~ | ~~GHSA-67mh-4wv8-2f99~~ | ~~Moderate~~ | **RESOLVED**: bundled with vite 6.x | |
| ~~vite-node~~ | ~~0 direct~~ | ~~N/A~~ | **RESOLVED**: upgraded with vitest | |

## Reachability Summary

| Category | Packages | Advisories (by own severity) | In Production? |
|----------|----------|------------------------------|----------------|
| next framework | 1 critical + 1 high + transitive | 2 critical, 7 high, 11 moderate, 3 low (next) + 2 high, 2 moderate (postcss) | **Partial**: DoS and cache advisories reachable. SSRF/XSS/Windows-RCE not reachable with current configuration. |
| ~~vitest/esbuild/vite chain~~ | ~~1 critical + 2 high + 3 moderate~~ | ~~1 critical, 1 high, 4 moderate~~ | **RESOLVED** (batch 14) |
| prisma/hono chain | 3 high + 4 moderate | 2 high, 31 moderate, 3 low (hono) + 1 high, 2 moderate (@hono/node-server) + others | **No**: dev tooling, not imported at runtime |
| ~~glob (eslint plugin)~~ | ~~1 high~~ | ~~1 high~~ | **RESOLVED** (batch 14) |
| lodash (dev transitive) | 1 high | 1 high, 2 moderate | **No**: transitive dev dep |

## Recommended Upgrade Path

### Phase 1: Dev-dep upgrades — DONE (batch 14)
1. ~~**vitest 2.x -> 5.x**~~: **DONE**. Upgraded to 5.0.3 with vite 6.x. Resolved 5 packages (vitest, @vitest/mocker, esbuild, vite, vite-node) and 7 unique advisories.
2. ~~**eslint-config-next 14 -> 15**~~: **DONE**. Upgraded to 15.5.27. Resolved 3 packages (glob, eslint-config-next, @next/eslint-plugin-next) and 1 unique advisory.

### Phase 2: Major framework upgrade (high risk, integration testing required)
3. **next 14 -> 16**: Fixes 23 next advisories + 4 postcss. Requires React 19, App Router API changes, middleware changes, component migration. Must verify all 6 simulation topics render correctly. **Largest blast radius.**
4. **prisma -> 7.10.0 (stable)**: Fixes hono (34 advisories), @hono/node-server (3), valibot, lodash, chevrotain chain. Requires schema/migration compatibility check.

### Acceptable short-term deferrals
The following have no production reachability:
- hono/valibot/lodash/chevrotain chain (prisma dev tooling internals)

### Production priority
The `next` upgrade (DoS and cache poisoning advisories) is the only production-reachable remediation and requires coordinated framework migration.

## Limitations

- Advisory counts and severities are from `npm audit --json` on Node 24.19/Linux, deduplicated by GHSA URL. A different Node version or OS may show different results.
- "Not reachable" claims are based on Fizzix's current feature set and assumed deployment configuration. Deployment to Linux containers has not been verified against production evidence. Changes to deployment (Windows, custom server, remote image patterns) could change exposure.
- Batch 14 applied dev-dep upgrades (vitest 2→5, eslint-config-next 14→15). Major framework upgrades (next 14→16, prisma 7) not applied.
- "npm audit fix found no automatic fix" does not establish that every remediation requires a major upgrade. Verify proposed fixed versions against authoritative advisory/release information before upgrading.
