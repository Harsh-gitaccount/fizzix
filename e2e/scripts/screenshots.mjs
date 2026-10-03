import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

const BASE = process.env.SCREENSHOT_BASE_URL || 'http://localhost:3456'

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
  '/usr/bin/google-chrome',
].filter(Boolean)

const CHROME = CHROME_CANDIDATES.find(p => existsSync(p))
if (!CHROME) {
  console.error('No Chromium found. Set CHROME_PATH or install Chromium.')
  process.exit(1)
}

const pages = [
  { name: 'homepage', path: '/' },
  { name: 'guide', path: '/guide' },
  { name: 'teachers', path: '/guide/teachers' },
  { name: 'topics', path: '/guide/topics' },
]

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
]

async function run() {
  const browser = await chromium.launch({
    executablePath: CHROME,
    args: ['--no-sandbox', '--disable-gpu'],
  })

  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
    })

    for (const pg of pages) {
      const page = await context.newPage()
      await page.goto(`${BASE}${pg.path}`, { waitUntil: 'networkidle' })
      await page.waitForTimeout(500)

      const path = `e2e/results/${vp.name}-${pg.name}.png`
      await page.screenshot({ path, fullPage: true })
      console.log(`OK: ${path}`)
      await page.close()
    }

    await context.close()
  }

  await browser.close()
}

run().catch(e => { console.error(e); process.exit(1) })
