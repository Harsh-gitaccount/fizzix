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
