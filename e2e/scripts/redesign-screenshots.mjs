import { chromium } from 'playwright-core'

const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const BASE = 'http://localhost:3100'

const viewports = [
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'mobile-320', width: 320, height: 568 },
]

async function run() {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true })

  for (const vp of viewports) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } })
    const page = await ctx.newPage()
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(1500)

    await page.screenshot({ path: `e2e/results/redesign/${vp.name}.png` })
    await page.screenshot({ path: `e2e/results/redesign/${vp.name}-full.png`, fullPage: true })

    // Check for overflow
    const bodyW = await page.evaluate(() => document.body.scrollWidth)
    const overflow = bodyW > vp.width
    console.log(`${vp.name}: ${vp.width}x${vp.height}, bodyW=${bodyW}, overflow=${overflow}`)

    // Check grid at atlas section
    if (vp.width >= 768) {
      const atlasSection = await page.$('#atlas')
      if (atlasSection) {
        await atlasSection.scrollIntoViewIfNeeded()
        await page.waitForTimeout(500)
        await page.screenshot({ path: `e2e/results/redesign/${vp.name}-atlas.png` })
      }
    }

    await ctx.close()
  }

  // Desktop: check all lesson links
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  const slugs = ['projectile-motion', 'shm', 'electrostatics', 'optics', 'thermodynamics', 'modern-physics']

  for (const slug of slugs) {
    const resp = await page.goto(`${BASE}/${slug}`, { waitUntil: 'domcontentloaded', timeout: 15000 })
    console.log(`/${slug}: ${resp?.status()}`)
  }

  // Check hero experiment interaction: verify slider exists
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 })
  const slider = await page.$('#hero-angle')
  console.log(`Hero slider present: ${!!slider}`)

  // Check that the "How it works" section exists
  const howItWorks = await page.$('#how-it-works')
  console.log(`"How it works" section present: ${!!howItWorks}`)

  // Check that atlas section exists
  const atlas = await page.$('#atlas')
  console.log(`Atlas section present: ${!!atlas}`)

  // Check header present
  const header = await page.$('header')
  console.log(`Header present: ${!!header}`)

  // Check warm section background
  const warmBg = await page.evaluate(() => {
    const el = document.querySelector('#how-it-works')
    if (!el) return null
    return getComputedStyle(el).backgroundColor
  })
  console.log(`Warm section bg: ${warmBg}`)

  // Keyboard navigation: tab to slider
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  const activeTag = await page.evaluate(() => document.activeElement?.tagName)
  console.log(`After 4 tabs, active element: ${activeTag}`)

  // Check console errors
  const errors = []
  page.on('pageerror', err => errors.push(err.message))
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(2000)
  console.log(`Console errors: ${errors.length}`)
  if (errors.length > 0) errors.forEach(e => console.log(`  - ${e}`))

  await ctx.close()
  await browser.close()
}

run().catch(e => { console.error(e); process.exit(1) })
