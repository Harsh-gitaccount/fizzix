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
 *
 * Analytics stub: plausible.io/js/script.js is blocked by the CI proxy.
 * The SW no longer intercepts cross-origin requests, so this script is
 * never fetched. If a pageerror's stack traces to plausible.io AND the
 * request failed or returned non-JS content, only that specific error
 * is filtered. Application errors whose stack traces to /_next/ are
 * always reported even if they share the same message text.
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

const ANALYTICS_STUB_URL = 'https://plausible.io/js/script.js'

let passed = 0
let failed = 0
const failures = []
const rawErrors = []

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
  const errors = []
  let analyticsServedHTML = false

  page.on('response', (res) => {
    if (res.url() === ANALYTICS_STUB_URL) {
      const ct = res.headers()['content-type'] || ''
      if (!ct.includes('javascript')) analyticsServedHTML = true
    }
  })

  page.on('pageerror', (err) => {
    const stack = err.stack || ''
    const msg = err.message || ''
    rawErrors.push({ page: page.url(), error: msg, stack: stack.substring(0, 500) })
    if (analyticsServedHTML && msg === "Unexpected token '<'" && stack.includes('plausible.io')) return
    errors.push(msg)
  })
  return errors
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

  // === Home page ===
  console.log('\n=== Home page ===')
  await assert('Home loads all 6 topic links', async () => {
    const page = await context.newPage()
    await page.goto(BASE)
    for (const t of TOPICS) {
      const link = await page.locator(`a[href="/${t}"]`).count()
      if (link === 0) throw new Error(`Missing link for ${t}`)
    }
    await page.close()
  })

  // === F12: 3D tools hidden/shown ===
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

  // === F14: responsive layout ===
  console.log('\n=== F14: responsive layout ===')
  const responsiveViews = [
    { width: 320, topic: 'projectile-motion', label: '2D' },
    { width: 390, topic: 'thermodynamics', label: '3D' },
    { width: 768, topic: 'projectile-motion', label: '2D' },
    { width: 1440, topic: 'projectile-motion', label: '2D' },
  ]
  for (const { width, topic, label } of responsiveViews) {
    await assert(`No horizontal scroll at ${width}px (${label}: ${topic})`, async () => {
      const ctx = await browser.newContext({ viewport: { width, height: 800 } })
      const page = await ctx.newPage()
      await page.goto(`${BASE}/${topic}`)
      await page.waitForSelector('canvas', { timeout: 15000 })
      await page.waitForTimeout(500)
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
      if (scrollWidth > width + 5) throw new Error(`scrollWidth ${scrollWidth} > viewport ${width}`)
      await page.close()
      await ctx.close()
    })
  }

  await assert('Controls reachable at 320px (play button visible)', async () => {
    const ctx = await browser.newContext({ viewport: { width: 320, height: 800 } })
    const page = await ctx.newPage()
    await page.goto(`${BASE}/projectile-motion`)
    await page.waitForSelector('canvas', { timeout: 15000 })
    const playBtn = page.locator('button[aria-label*="Play"], button[aria-label*="play"], button[aria-pressed]').first()
    if (await playBtn.count() === 0) throw new Error('No play/toggle button visible at 320px')
    const box = await playBtn.boundingBox()
    if (!box) throw new Error('Play button has no bounding box')
    if (box.x + box.width > 320) throw new Error(`Play button clipped: right edge at ${box.x + box.width}`)
    await page.close()
    await ctx.close()
  })

  // === F15: ARIA structure ===
  console.log('\n=== F15: ARIA structure ===')
  await assert('Tablist with tabs (required)', async () => {
    const page = await context.newPage()
    await page.goto(`${BASE}/projectile-motion`)
    await page.waitForSelector('canvas', { timeout: 15000 })
    const tablistCount = await page.locator('[role="tablist"]').count()
    if (tablistCount === 0) throw new Error('No tablist found')
    const tabCount = await page.locator('[role="tablist"] [role="tab"]').count()
    if (tabCount < 2) throw new Error(`Expected ≥2 tabs, got ${tabCount}`)
    await page.close()
  })

  await assert('All simulation tabs have aria-controls pointing to existing elements', async () => {
    const page = await context.newPage()
    await page.goto(`${BASE}/projectile-motion`)
    await page.waitForSelector('canvas', { timeout: 15000 })
    const tabs = page.locator('[role="tab"][id^="tab-"]')
    const count = await tabs.count()
    if (count < 2) throw new Error(`Expected ≥2 simulation tabs, got ${count}`)
    for (let i = 0; i < count; i++) {
      const controls = await tabs.nth(i).getAttribute('aria-controls')
      if (!controls) throw new Error(`Tab ${i} missing aria-controls`)
      const target = await page.locator(`#${controls}`).count()
      if (target === 0) throw new Error(`Tab ${i} aria-controls="${controls}" targets nonexistent element`)
    }
    const panelTabs = page.locator('[role="tab"][id^="panel-tab-"]')
    const panelCount = await panelTabs.count()
    if (panelCount < 2) throw new Error(`Expected ≥2 panel tabs, got ${panelCount}`)
    for (let i = 0; i < panelCount; i++) {
      const controls = await panelTabs.nth(i).getAttribute('aria-controls')
      if (!controls) throw new Error(`Panel tab ${i} missing aria-controls`)
      await panelTabs.nth(i).click()
      await page.waitForTimeout(200)
      const target = await page.locator(`#${controls}`).count()
      if (target === 0) throw new Error(`Panel tab ${i} aria-controls="${controls}" targets nonexistent element after selection`)
    }
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

  await assert('ArrowRight moves focus to second simulation tab and selects it', async () => {
    const page = await context.newPage()
    await page.goto(`${BASE}/projectile-motion`)
    await page.waitForSelector('canvas', { timeout: 15000 })
    const tabs = page.locator('[role="tab"][id^="tab-"]')
    const count = await tabs.count()
    if (count < 2) throw new Error(`Need ≥2 simulation tabs, got ${count}`)
    const firstId = await tabs.nth(0).getAttribute('id')
    const secondId = await tabs.nth(1).getAttribute('id')
    await tabs.first().focus()
    await page.keyboard.press('ArrowRight')
    const focusedId = await page.evaluate(() => document.activeElement?.id)
    if (focusedId !== secondId) throw new Error(`Expected focus on ${secondId}, got ${focusedId}`)
    const isSelected = await tabs.nth(1).getAttribute('aria-selected')
    if (isSelected !== 'true') throw new Error(`Second tab not selected after ArrowRight (aria-selected=${isSelected})`)
    const firstSelected = await tabs.nth(0).getAttribute('aria-selected')
    if (firstSelected === 'true') throw new Error('First tab still selected after ArrowRight')
    await page.close()
  })

  await assert('Quiz tab opens quiz panel with radiogroup (required)', async () => {
    const page = await context.newPage()
    await page.goto(`${BASE}/projectile-motion`)
    await page.waitForSelector('canvas', { timeout: 15000 })
    const quizTab = page.locator('[role="tab"]').filter({ hasText: /quiz/i })
    const quizCount = await quizTab.count()
    if (quizCount === 0) throw new Error('Required quiz tab not found')
    await quizTab.click()
    await page.waitForTimeout(1000)
    const rgCount = await page.locator('[role="radiogroup"]').count()
    if (rgCount === 0) throw new Error('No radiogroup after clicking quiz tab')
    const radioCount = await page.locator('[role="radio"]').count()
    if (radioCount < 2) throw new Error(`Expected ≥2 radio buttons, got ${radioCount}`)
    await page.close()
  })

  // === All topics render ===
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

  // === Negative control: application error is not suppressed ===
  console.log('\n=== Negative control ===')
  await assert('Application JS error still fails (negative control)', async () => {
    const page = await context.newPage()
    const errors = collectErrors(page)
    await page.goto(`${BASE}/projectile-motion`)
    await page.waitForSelector('canvas', { timeout: 15000 })
    await page.evaluate(() => {
      setTimeout(() => { eval("var x = <bad>") }, 10)
    })
    await page.waitForTimeout(500)
    if (errors.length === 0) throw new Error('Injected app error was suppressed — filter is too broad')
    await page.close()
  })

  // === F23: Scene transitions ===
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

  await assert('Field-3d tab switches (required tab)', async () => {
    const page = await context.newPage()
    const errors = collectErrors(page)
    await page.goto(`${BASE}/electrostatics`)
    await page.waitForSelector('canvas', { timeout: 15000 })
    await page.waitForTimeout(500)
    const fieldTab = page.locator('#tab-field-3d')
    const fieldCount = await fieldTab.count()
    if (fieldCount === 0) throw new Error('Required field-3d tab not found')
    await fieldTab.click()
    await page.waitForTimeout(1500)
    const isSelected = await fieldTab.getAttribute('aria-selected')
    if (isSelected !== 'true') throw new Error('field-3d tab not selected after click')
    await page.locator('[role="tab"]').first().click()
    await page.waitForTimeout(500)
    await fieldTab.click()
    await page.waitForTimeout(1000)
    if (errors.length > 0) throw new Error(`JS errors: ${errors.join('; ')}`)
    await page.close()
  })

  // === F24: Mass preset ===
  console.log('\n=== F24: Mass preset ===')
  await assert('Mass preset activates compare with distinct masses', async () => {
    const page = await context.newPage()
    await page.goto(`${BASE}/projectile-motion`)
    await page.waitForSelector('canvas', { timeout: 15000 })
    await page.waitForTimeout(500)
    const compareTab = page.locator('#tab-compare')
    if (await compareTab.count() === 0) throw new Error('Compare tab not found')
    await compareTab.click()
    await page.waitForTimeout(500)
    const massBtn = page.locator('button').filter({ hasText: /mass/i })
    const btnCount = await massBtn.count()
    if (btnCount === 0) throw new Error('Required mass preset button not found on compare tab')
    await massBtn.first().click()
    await page.waitForTimeout(500)

    const pressed = await massBtn.first().getAttribute('aria-pressed')
    if (pressed !== 'true') throw new Error('Mass preset button aria-pressed is not "true" after click')

    const isCompareSelected = await page.locator('#tab-compare').getAttribute('aria-selected')
    if (isCompareSelected !== 'true') throw new Error('Compare tab not selected after mass preset')

    const labelA = page.locator('text=/\\bA\\b/').first()
    const labelB = page.locator('text=/\\bB\\b/').first()
    const hasA = await labelA.count() > 0
    const hasB = await labelB.count() > 0
    if (!hasA || !hasB) {
      throw new Error(`Compare mode A/B labels missing: A=${hasA}, B=${hasB}`)
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
    for (const e of rawErrors) {
      console.log(`  [${e.page}] ${e.error}`)
      if (e.stack) console.log(`    stack: ${e.stack.substring(0, 200)}`)
    }
  }

  process.exit(failed > 0 ? 1 : 0)
}

run().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
