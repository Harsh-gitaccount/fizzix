/**
 * Browser acceptance tests for F12, F14, F15, F23, F24.
 *
 * Prerequisites:
 *   - Production build: npx next build && npx next start -p 3099
 *   - Chromium available (set CHROMIUM_PATH or use default)
 *
 * Usage:
 *   PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node e2e/scripts/browser-acceptance.mjs
 *
 * Environment:
 *   BASE_URL - server URL (default: http://localhost:3099)
 *   CHROMIUM_PATH - path to Chromium binary (default: auto-detect)
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
const TOPICS = [
  'projectile-motion', 'shm', 'optics',
  'electrostatics', 'thermodynamics', 'modern-physics',
]

let passed = 0
let failed = 0
const failures = []
const rawErrors = []
const blockedScriptHosts = new Set(['plausible.io', 'analytics.'])

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

function collectErrors(page) {
  const allPageErrors = []
  let hasBlockedAnalyticsScript = false

  page.on('requestfailed', (req) => {
    if (req.resourceType() !== 'script') return
    try {
      const host = new URL(req.url()).hostname
      if ([...blockedScriptHosts].some(h => host.includes(h))) {
        hasBlockedAnalyticsScript = true
      }
    } catch { /* ignore malformed URLs */ }
  })

  page.on('response', (res) => {
    try {
      const host = new URL(res.url()).hostname
      const ct = res.headers()['content-type'] || ''
      if ([...blockedScriptHosts].some(h => host.includes(h)) && ct.includes('text/html')) {
        hasBlockedAnalyticsScript = true
      }
    } catch { /* ignore */ }
  })

  page.on('pageerror', (err) => {
    rawErrors.push({ page: page.url(), error: err.message })
    allPageErrors.push(err.message)
  })

  return {
    get length() {
      return this.filtered().length
    },
    join(sep) {
      return this.filtered().join(sep)
    },
    filtered() {
      if (!hasBlockedAnalyticsScript) return allPageErrors
      return allPageErrors.filter(msg => !msg.includes("Unexpected token '<'"))
    },
  }
}

async function run() {
  const launchOpts = {
    headless: true,
    args: ['--no-sandbox', '--disable-gpu'],
  }
  if (CHROMIUM) launchOpts.executablePath = CHROMIUM

  const browser = await chromium.launch(launchOpts)
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } })

  console.log(`\nTarget: ${BASE}`)
  console.log(`Chromium: ${CHROMIUM || '(auto-detect)'}`)

  console.log('\n=== Home page ===')
  await assert('Home loads all topics', async () => {
    const page = await context.newPage()
    await page.goto(BASE)
    for (const t of TOPICS) {
      const link = await page.locator(`a[href="/${t}"]`).count()
      if (link === 0) throw new Error(`Missing link for ${t}`)
    }
    await page.close()
  })

  console.log('\n=== F12: 3D tools hidden/shown ===')
  await assert('Tools hidden on thermodynamics (3D view)', async () => {
    const page = await context.newPage()
    await page.goto(`${BASE}/thermodynamics`)
    await page.waitForSelector('canvas', { timeout: 15000 })
    await page.waitForTimeout(1000)
    const text = await page.textContent('body')
    const hasRuler = text.includes('Ruler') || text.includes('📏')
    const hasProtractor = text.includes('Protractor') || text.includes('📐')
    if (hasRuler || hasProtractor) throw new Error('Tools should be hidden on 3D view')
    await page.close()
  })

  await assert('Tools visible on projectile-motion (2D view)', async () => {
    const page = await context.newPage()
    await page.goto(`${BASE}/projectile-motion`)
    await page.waitForSelector('canvas', { timeout: 15000 })
    await page.waitForTimeout(1000)
    const text = await page.textContent('body')
    if (!text.includes('Ruler') && !text.includes('📏')) throw new Error('Ruler not found')
    if (!text.includes('Protractor') && !text.includes('📐')) throw new Error('Protractor not found')
    await page.close()
  })

  console.log('\n=== F14: responsive layout ===')
  for (const width of [320, 390, 768, 1440]) {
    await assert(`No horizontal scroll at ${width}px`, async () => {
      const ctx = await browser.newContext({ viewport: { width, height: 800 } })
      const page = await ctx.newPage()
      await page.goto(`${BASE}/projectile-motion`)
      await page.waitForSelector('canvas', { timeout: 15000 })
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
      if (scrollWidth > width + 5) throw new Error(`scrollWidth ${scrollWidth} > viewport ${width}`)
      await page.close()
      await ctx.close()
    })
  }

  console.log('\n=== F15: ARIA structure ===')
  await assert('Tablist with tabs', async () => {
    const page = await context.newPage()
    await page.goto(`${BASE}/projectile-motion`)
    await page.waitForSelector('canvas', { timeout: 15000 })
    if (await page.locator('[role="tablist"]').count() === 0) throw new Error('No tablist')
    if (await page.locator('[role="tab"]').count() === 0) throw new Error('No tabs')
    await page.close()
  })

  await assert('Tabs have aria-controls', async () => {
    const page = await context.newPage()
    await page.goto(`${BASE}/projectile-motion`)
    await page.waitForSelector('canvas', { timeout: 15000 })
    const tabs = page.locator('[role="tablist"] [role="tab"]')
    let hasControls = 0
    for (let i = 0; i < await tabs.count(); i++) {
      if (await tabs.nth(i).getAttribute('aria-controls')) hasControls++
    }
    if (hasControls === 0) throw new Error('No tabs have aria-controls')
    await page.close()
  })

  await assert('aria-pressed on toggle buttons', async () => {
    const page = await context.newPage()
    await page.goto(`${BASE}/projectile-motion`)
    await page.waitForSelector('canvas', { timeout: 15000 })
    if (await page.locator('button[aria-pressed]').count() === 0) {
      throw new Error('No buttons with aria-pressed')
    }
    await page.close()
  })

  await assert('3D scene has role=img and aria-label', async () => {
    const page = await context.newPage()
    await page.goto(`${BASE}/thermodynamics`)
    await page.waitForSelector('canvas', { timeout: 15000 })
    await page.waitForTimeout(500)
    if (await page.locator('[role="img"][aria-label]').count() === 0) {
      throw new Error('No role=img with aria-label')
    }
    await page.close()
  })

  await assert('Tab keyboard navigation (ArrowRight moves focus)', async () => {
    const page = await context.newPage()
    await page.goto(`${BASE}/projectile-motion`)
    await page.waitForSelector('canvas', { timeout: 15000 })
    const tabs = page.locator('[role="tab"]')
    if (await tabs.count() < 2) { await page.close(); return }
    await tabs.first().focus()
    await page.keyboard.press('ArrowRight')
    const focusedRole = await page.evaluate(() => document.activeElement?.getAttribute('role'))
    if (focusedRole !== 'tab') throw new Error(`Focused role: ${focusedRole}`)
    await page.close()
  })

  await assert('Quiz panel has radiogroup', async () => {
    const page = await context.newPage()
    await page.goto(`${BASE}/projectile-motion`)
    await page.waitForSelector('canvas', { timeout: 15000 })
    const quizTab = page.locator('[role="tab"]').filter({ hasText: /quiz/i })
    if (await quizTab.count() > 0) {
      await quizTab.click()
      await page.waitForTimeout(1000)
      if (await page.locator('[role="radiogroup"]').count() === 0) {
        throw new Error('No radiogroup in quiz panel')
      }
      if (await page.locator('[role="radio"]').count() === 0) {
        throw new Error('No radio buttons')
      }
    }
    await page.close()
  })

  console.log('\n=== All topics render ===')
  for (const topic of TOPICS) {
    await assert(`${topic} renders without JS errors`, async () => {
      const page = await context.newPage()
      const errors = collectErrors(page)
      await page.goto(`${BASE}/${topic}`)
      await page.waitForSelector('canvas', { timeout: 15000 })
      await page.waitForTimeout(1500)
      if (errors.length > 0) throw new Error(`JS errors: ${errors.join('; ')}`)
      await page.close()
    })
  }

  console.log('\n=== F23: Scene transitions ===')
  await assert('Navigate thermo→projectile→thermo without errors', async () => {
    const page = await context.newPage()
    const errors = collectErrors(page)
    await page.goto(`${BASE}/thermodynamics`)
    await page.waitForSelector('canvas', { timeout: 15000 })
    await page.waitForTimeout(1000)
    await page.goto(`${BASE}/projectile-motion`)
    await page.waitForSelector('canvas', { timeout: 15000 })
    await page.waitForTimeout(500)
    await page.goto(`${BASE}/thermodynamics`)
    await page.waitForSelector('canvas', { timeout: 15000 })
    await page.waitForTimeout(1000)
    if (errors.length > 0) throw new Error(`JS errors: ${errors.join('; ')}`)
    await page.close()
  })

  await assert('Field-3d tab switching without errors', async () => {
    const page = await context.newPage()
    const errors = collectErrors(page)
    await page.goto(`${BASE}/electrostatics`)
    await page.waitForSelector('canvas', { timeout: 15000 })
    await page.waitForTimeout(500)
    const fieldTab = page.locator('#tab-field-3d')
    if (await fieldTab.count() > 0) {
      await fieldTab.click()
      await page.waitForTimeout(1500)
      await page.locator('[role="tab"]').first().click()
      await page.waitForTimeout(500)
      await fieldTab.click()
      await page.waitForTimeout(1000)
    }
    if (errors.length > 0) throw new Error(`JS errors: ${errors.join('; ')}`)
    await page.close()
  })

  console.log('\n=== F24: Mass preset ===')
  await assert('Mass preset activates compare mode', async () => {
    const page = await context.newPage()
    await page.goto(`${BASE}/projectile-motion`)
    await page.waitForSelector('canvas', { timeout: 15000 })
    await page.waitForTimeout(500)
    const massBtn = page.locator('button').filter({ hasText: /mass/i })
    if (await massBtn.count() > 0) {
      await massBtn.first().click()
      await page.waitForTimeout(500)
      const text = await page.textContent('body')
      if (!text.toLowerCase().includes('compare')) {
        throw new Error('Compare mode not activated')
      }
    }
    await page.close()
  })

  await browser.close()

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`)
  if (failures.length > 0) {
    console.log('\nFailures:')
    for (const f of failures) console.log(`  ${f.name}: ${f.error}`)
  }

  if (rawErrors.length > 0) {
    console.log(`\n=== Raw JS errors (${rawErrors.length}, including filtered) ===`)
    for (const e of rawErrors) console.log(`  [${e.page}] ${e.error.substring(0, 120)}`)
  }

  process.exit(failed > 0 ? 1 : 0)
}

run().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
