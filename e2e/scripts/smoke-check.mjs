import { chromium } from 'playwright-core'

const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const BASE = 'http://localhost:3100'

const TOPICS = [
  { slug: 'projectile-motion', expectedSlider: 'v0' },
  { slug: 'shm', expectedSlider: 'v0' },
  { slug: 'electrostatics', expectedSlider: 'v0' },
  { slug: 'optics', expectedSlider: 'v0' },
  { slug: 'thermodynamics', expectedSlider: 'v0' },
  { slug: 'modern-physics', expectedSlider: 'v0' },
]

async function run() {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true })
  const results = []

  for (const topic of TOPICS) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } })
    const page = await ctx.newPage()

    const errors = []
    page.on('pageerror', err => errors.push(err.message))

    try {
      const resp = await page.goto(`${BASE}/${topic.slug}`, { waitUntil: 'networkidle', timeout: 20000 })
      const status = resp?.status()

      // Check for canvas element (simulation renders on canvas)
      const hasCanvas = await page.$('canvas') !== null

      // Check for any range slider inputs (simulation parameters)
      const sliderCount = await page.$$eval('input[type="range"]', els => els.length)

      // Check that the page has a heading with the topic name
      const h1Text = await page.$eval('h1', el => el.textContent).catch(() => null)

      // Try to interact: change first slider and verify value actually changed
      let sliderWorked = false
      if (sliderCount > 0) {
        try {
          const slider = await page.$('input[type="range"]')
          if (slider) {
            const valueBefore = await slider.evaluate(el => el.value)
            const box = await slider.boundingBox()
            if (box) {
              await slider.click({ position: { x: box.width * 0.75, y: box.height / 2 } })
              await page.waitForTimeout(600)
              const valueAfter = await slider.evaluate(el => el.value)
              sliderWorked = valueBefore !== valueAfter
              if (!sliderWorked) {
                console.log(`       slider value unchanged: ${valueBefore} -> ${valueAfter}`)
              }
            }
          }
        } catch (e) {
          // slider interaction failed
        }
      }

      results.push({
        slug: topic.slug,
        status,
        hasCanvas,
        sliderCount,
        h1Text: h1Text?.trim()?.substring(0, 40),
        sliderWorked,
        jsErrors: errors.length,
        pass: status === 200 && hasCanvas && sliderCount > 0 && sliderWorked && errors.length === 0,
      })
    } catch (e) {
      results.push({ slug: topic.slug, error: e.message, pass: false })
    }

    await ctx.close()
  }

  console.log('\n=== Functional Smoke Check ===\n')
  for (const r of results) {
    const icon = r.pass ? 'PASS' : 'FAIL'
    console.log(`[${icon}] /${r.slug}`)
    if (r.error) {
      console.log(`       Error: ${r.error}`)
    } else {
      console.log(`       HTTP ${r.status} | canvas=${r.hasCanvas} | sliders=${r.sliderCount} | slider-interact=${r.sliderWorked} | jsErrors=${r.jsErrors}`)
      if (r.h1Text) console.log(`       h1: "${r.h1Text}"`)
    }
  }

  const allPass = results.every(r => r.pass)
  console.log(`\nOverall: ${allPass ? 'ALL PASS' : 'SOME FAILED'}`)

  await browser.close()
  process.exit(allPass ? 0 : 1)
}

run().catch(e => { console.error(e); process.exit(1) })
