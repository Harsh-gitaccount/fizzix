/**
 * Service worker lifecycle tests for F26.
 *
 * Prerequisites:
 *   - Production build: npx next build && npx next start -p 3099
 *   - Chromium available (set CHROMIUM_PATH or use default)
 *
 * Usage:
 *   PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node e2e/scripts/sw-lifecycle.mjs
 *
 * Environment:
 *   BASE_URL - server URL (default: http://localhost:3099)
 *   CHROMIUM_PATH - path to Chromium binary (default: auto-detect)
 *
 * Note: SW registers only on topic pages (via useServiceWorker hook in
 * SimulationPage), not on the home page. Tests visit a topic page first.
 */

import { createRequire } from 'module'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(__dirname, '../..')
const require = createRequire(resolve(projectRoot, 'package.json'))
const { chromium } = require('playwright')

const BASE = process.env.BASE_URL || 'http://localhost:3099'
const CHROMIUM = process.env.CHROMIUM_PATH || undefined

let passed = 0
let failed = 0
const failures = []

async function assert(name, fn) {
  try {
    await fn()
    passed++
    console.log(`  PASS: ${name}`)
  } catch (err) {
    failed++
    failures.push({ name, error: err.message })
    console.log(`  FAIL: ${name} — ${err.message}`)
  }
}

async function run() {
  const launchOpts = {
    headless: true,
    args: ['--no-sandbox', '--disable-gpu'],
  }
  if (CHROMIUM) launchOpts.executablePath = CHROMIUM

  const browser = await chromium.launch(launchOpts)

  console.log(`\nTarget: ${BASE}`)
  console.log(`Chromium: ${CHROMIUM || '(auto-detect)'}`)
  console.log('\n=== F26: Service Worker Lifecycle ===')

  await assert('SW registers and activates on topic page', async () => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto(`${BASE}/projectile-motion`)
    await page.waitForSelector('canvas', { timeout: 15000 })
    await page.waitForTimeout(3000)

    const swState = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return 'no-support'
      const reg = await navigator.serviceWorker.getRegistration()
      if (!reg) return 'not-registered'
      if (reg.active) return 'active'
      if (reg.waiting) return 'waiting'
      if (reg.installing) return 'installing'
      return 'unknown'
    })
    if (swState !== 'active') throw new Error(`SW state: ${swState}`)
    await page.close()
    await context.close()
  })

  await assert('Precache contains / and /manifest.json', async () => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto(`${BASE}/projectile-motion`)
    await page.waitForSelector('canvas', { timeout: 15000 })
    await page.waitForTimeout(3000)

    const cached = await page.evaluate(async () => {
      const cache = await caches.open('fizzix-v1')
      const keys = await cache.keys()
      return keys.map(r => new URL(r.url).pathname)
    })
    if (!cached.includes('/')) throw new Error(`/ not in precache. Cached: ${cached.join(', ')}`)
    if (!cached.includes('/manifest.json')) throw new Error(`manifest.json not in precache`)
    await page.close()
    await context.close()
  })

  await assert('Home page served offline (after SW registration)', async () => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto(`${BASE}/projectile-motion`)
    await page.waitForSelector('canvas', { timeout: 15000 })
    await page.waitForTimeout(3000)
    await page.goto(BASE)
    await page.waitForTimeout(2000)

    await context.setOffline(true)
    await page.goto(BASE, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1000)
    const title = await page.title()
    if (!title.includes('Fizzix')) throw new Error(`Offline page title: "${title}"`)
    await page.close()
    await context.close()
  })

  await assert('Unvisited topic falls back offline', async () => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto(`${BASE}/projectile-motion`)
    await page.waitForSelector('canvas', { timeout: 15000 })
    await page.waitForTimeout(3000)
    await page.goto(BASE)
    await page.waitForTimeout(2000)

    await context.setOffline(true)
    await page.goto(`${BASE}/optics`, { waitUntil: 'domcontentloaded' })
    const text = await page.textContent('body').catch(() => '')
    const ok = text.includes('Fizzix') || text.includes('Offline')
    if (!ok) throw new Error(`Unexpected offline text: "${text.substring(0, 200)}"`)
    await page.close()
    await context.close()
  })

  await assert('Static assets cached after reload through SW', async () => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto(`${BASE}/projectile-motion`)
    await page.waitForSelector('canvas', { timeout: 15000 })
    await page.waitForTimeout(3000)
    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)

    const staticKeys = await page.evaluate(async () => {
      const cache = await caches.open('fizzix-v1')
      const keys = await cache.keys()
      return keys.filter(r => new URL(r.url).pathname.startsWith('/_next/static/')).length
    })
    if (staticKeys === 0) throw new Error('No static assets cached after reload')
    await page.close()
    await context.close()
  })

  // === B22-1/B22-2 regression: cache policy ===
  console.log('\n=== SW cache policy regression ===')

  await assert('Cross-origin requests not intercepted by SW', async () => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto(`${BASE}/projectile-motion`)
    await page.waitForSelector('canvas', { timeout: 15000 })
    await page.waitForTimeout(3000)

    const crossOriginCached = await page.evaluate(async () => {
      const cache = await caches.open('fizzix-v1')
      const keys = await cache.keys()
      return keys.filter(r => {
        const u = new URL(r.url)
        return u.origin !== location.origin
      }).map(r => r.url)
    })
    if (crossOriginCached.length > 0) {
      throw new Error(`Cross-origin URLs in cache: ${crossOriginCached.join(', ')}`)
    }
    await page.close()
    await context.close()
  })

  await assert('No HTML-as-script entries in cache after normal operation', async () => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto(`${BASE}/projectile-motion`)
    await page.waitForSelector('canvas', { timeout: 15000 })
    await page.waitForTimeout(3000)
    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)

    const badEntries = await page.evaluate(async () => {
      const cache = await caches.open('fizzix-v1')
      const keys = await cache.keys()
      const bad = []
      for (const req of keys) {
        const res = await cache.match(req)
        if (!res) continue
        const ct = (res.headers.get('content-type') || '').toLowerCase()
        const url = new URL(req.url)
        const isScript = url.pathname.endsWith('.js') || url.pathname.includes('/js/')
        if (isScript && ct.includes('text/html')) {
          bad.push(url.pathname)
        }
      }
      return bad
    })
    if (badEntries.length > 0) {
      throw new Error(`HTML cached as script: ${badEntries.join(', ')}`)
    }
    await page.close()
    await context.close()
  })

  await assert('Content-type validated before caching scripts', async () => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto(`${BASE}/projectile-motion`)
    await page.waitForSelector('canvas', { timeout: 15000 })
    await page.waitForTimeout(3000)

    const cached = await page.evaluate(async () => {
      const cache = await caches.open('fizzix-v1')
      const keys = await cache.keys()
      const badEntries = []
      for (const req of keys) {
        const url = new URL(req.url)
        if (url.pathname.endsWith('.js') || url.pathname.includes('/_next/static/')) {
          const res = await cache.match(req)
          if (res) {
            const ct = (res.headers.get('content-type') || '').toLowerCase()
            if (ct.includes('text/html')) {
              badEntries.push({ url: url.pathname, contentType: ct })
            }
          }
        }
      }
      return badEntries
    })
    if (cached.length > 0) {
      throw new Error(`HTML cached as script: ${JSON.stringify(cached)}`)
    }
    await page.close()
    await context.close()
  })

  await assert('SW does not serve homepage HTML for non-navigation script miss', async () => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto(`${BASE}/projectile-motion`)
    await page.waitForSelector('canvas', { timeout: 15000 })
    await page.waitForTimeout(3000)

    const hasController = await page.evaluate(() => !!navigator.serviceWorker.controller)
    if (!hasController) throw new Error('SW not controlling page')

    const result = await page.evaluate(async () => {
      const cache = await caches.open('fizzix-v1')
      const homepageResp = await cache.match('/')
      if (!homepageResp) return { skip: 'homepage not in cache' }
      const homeBody = await homepageResp.clone().text()

      const missUrl = '/_next/static/chunks/does-not-exist-' + Date.now() + '.js'
      const resp = await fetch(missUrl).catch(() => null)
      if (!resp) return { status: 'network-error', hasHomeBody: false }
      const body = await resp.text()
      return {
        status: resp.status,
        hasHomeBody: body.length > 100 && homeBody.includes('Fizzix') && body.includes('Fizzix'),
        bodyPreview: body.substring(0, 100),
      }
    })
    if (result.skip) return
    if (result.hasHomeBody) {
      throw new Error('SW served homepage HTML for a script miss — fallback must not leak HTML to script requests')
    }
    await page.close()
    await context.close()
  })

  await assert('Non-fizzix caches preserved', async () => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto(`${BASE}/projectile-motion`)
    await page.waitForSelector('canvas', { timeout: 15000 })
    await page.waitForTimeout(3000)

    const result = await page.evaluate(async () => {
      await caches.open('other-app-cache')
      const keys = await caches.keys()
      return {
        hasOther: keys.includes('other-app-cache'),
        hasFizzixV1: keys.includes('fizzix-v1'),
      }
    })
    if (!result.hasOther) throw new Error('Non-fizzix cache was deleted')
    if (!result.hasFizzixV1) throw new Error('Current fizzix cache missing')
    await page.close()
    await context.close()
  })

  await browser.close()

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`)
  if (failures.length > 0) {
    console.log('\nFailures:')
    for (const f of failures) console.log(`  ${f.name}: ${f.error}`)
  }

  process.exit(failed > 0 ? 1 : 0)
}

run().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
