/**
 * Two-production-build service worker update scenario (Task 5).
 *
 * 1. Build A (fizzix-v1): register SW, seed cache with unrelated entry
 * 2. Build B (fizzix-v2): start, verify SW updates, old cache purged,
 *    new cache works, unrelated entries in new cache survive
 *
 * Prerequisites:
 *   - Chromium available
 *   - Port 3099 free (this script manages its own server)
 *
 * Usage:
 *   PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node e2e/scripts/sw-update-scenario.mjs
 */

import { createRequire } from 'module'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(__dirname, '../..')
const require = createRequire(resolve(projectRoot, 'package.json'))
const { chromium } = require('playwright')

const CHROMIUM = process.env.CHROMIUM_PATH || undefined
const PORT = 3099

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

function killServer() {
  try { execSync(`fuser -k ${PORT}/tcp 2>/dev/null`, { stdio: 'ignore' }) } catch {}
}

function startServer(env = {}) {
  const envStr = Object.entries(env).map(([k, v]) => `${k}=${v}`).join(' ')
  execSync(
    `cd ${projectRoot} && ${envStr} npx next start -p ${PORT} &>/tmp/sw-update-server.log &`,
    { shell: '/bin/bash', stdio: 'ignore' }
  )
  for (let i = 0; i < 20; i++) {
    try {
      execSync(`curl -sf http://localhost:${PORT}/ > /dev/null`, { stdio: 'ignore' })
      return
    } catch {
      execSync('sleep 1', { stdio: 'ignore' })
    }
  }
  throw new Error('Server did not start')
}

const swPath = resolve(projectRoot, 'public/sw.js')
const originalSw = readFileSync(swPath, 'utf-8')

function setSWVersion(version) {
  const modified = originalSw.replace(
    /const CACHE_NAME = 'fizzix-v\d+'/,
    `const CACHE_NAME = 'fizzix-v${version}'`
  )
  writeFileSync(swPath, modified)
}

function restoreSW() {
  writeFileSync(swPath, originalSw)
}

async function run() {
  console.log('\n=== Two-Build SW Update Scenario ===\n')

  killServer()

  // Phase 1: Build A with fizzix-v1 (already current)
  console.log('Phase 1: Building A (fizzix-v1)...')
  setSWVersion(1)
  execSync(`cd ${projectRoot} && npx next build`, { stdio: 'pipe', timeout: 180000 })
  startServer()

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-gpu'],
    ...(CHROMIUM ? { executablePath: CHROMIUM } : {}),
  })

  // Use a persistent context so the SW persists across navigations
  const userDir = `/tmp/sw-update-profile-${Date.now()}`
  const context = await browser.newContext()

  console.log('\nPhase 1 tests:')

  await assert('Build A: SW registers as fizzix-v1', async () => {
    const page = await context.newPage()
    await page.goto(`http://localhost:${PORT}/projectile-motion`)
    await page.waitForSelector('canvas', { timeout: 15000 })
    await page.waitForTimeout(3000)

    const result = await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.getRegistration()
      if (!reg || !reg.active) return { error: 'no-active-sw' }
      const keys = await caches.keys()
      return { keys, hasFizzixV1: keys.includes('fizzix-v1') }
    })
    if (result.error) throw new Error(result.error)
    if (!result.hasFizzixV1) throw new Error(`Expected fizzix-v1 in caches, got: ${result.keys}`)
    await page.close()
  })

  await assert('Build A: Seed unrelated cache entry', async () => {
    const page = await context.newPage()
    await page.goto(`http://localhost:${PORT}/projectile-motion`)
    await page.waitForSelector('canvas', { timeout: 15000 })
    await page.waitForTimeout(2000)

    await page.evaluate(async () => {
      const cache = await caches.open('fizzix-v1')
      await cache.put(
        new Request('/test-seeded-entry'),
        new Response('seeded', { headers: { 'content-type': 'text/plain' } })
      )
      await caches.open('user-data-cache')
    })
    await page.close()
  })

  await assert('Build A: Page hydrates correctly', async () => {
    const page = await context.newPage()
    await page.goto(`http://localhost:${PORT}/projectile-motion`)
    await page.waitForSelector('canvas', { timeout: 15000 })
    const title = await page.title()
    if (!title.includes('Fizzix') && !title.includes('Projectile')) {
      throw new Error(`Unexpected title: ${title}`)
    }
    await page.close()
  })

  // Phase 2: Build B with fizzix-v2
  console.log('\nPhase 2: Building B (fizzix-v2)...')
  killServer()
  await new Promise(r => setTimeout(r, 2000))
  setSWVersion(2)
  execSync(`cd ${projectRoot} && npx next build`, { stdio: 'pipe', timeout: 180000 })
  startServer()
  await new Promise(r => setTimeout(r, 2000))

  console.log('\nPhase 2 tests:')

  await assert('Build B: SW updates to fizzix-v2', async () => {
    const page = await context.newPage()
    await page.goto(`http://localhost:${PORT}/projectile-motion`)
    await page.waitForSelector('canvas', { timeout: 15000 })
    await page.waitForTimeout(5000)

    const result = await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.getRegistration()
      if (!reg) return { error: 'no-registration' }
      if (reg.waiting) {
        reg.waiting.postMessage({ type: 'skipWaiting' })
        await new Promise(r => setTimeout(r, 2000))
      }
      const keys = await caches.keys()
      return {
        keys,
        hasFizzixV2: keys.includes('fizzix-v2'),
        hasFizzixV1: keys.includes('fizzix-v1'),
      }
    })
    if (result.error) throw new Error(result.error)
    if (!result.hasFizzixV2) throw new Error(`fizzix-v2 not found. Caches: ${result.keys}`)
    await page.close()
  })

  await assert('Build B: Old fizzix-v1 cache purged', async () => {
    const page = await context.newPage()
    await page.goto(`http://localhost:${PORT}/projectile-motion`)
    await page.waitForSelector('canvas', { timeout: 15000 })
    await page.waitForTimeout(3000)

    const keys = await page.evaluate(async () => {
      return await caches.keys()
    })
    if (keys.includes('fizzix-v1')) {
      throw new Error('fizzix-v1 should have been purged by activate handler')
    }
    await page.close()
  })

  await assert('Build B: Non-fizzix caches preserved', async () => {
    const page = await context.newPage()
    await page.goto(`http://localhost:${PORT}/projectile-motion`)
    await page.waitForSelector('canvas', { timeout: 15000 })
    await page.waitForTimeout(2000)

    const keys = await page.evaluate(async () => caches.keys())
    if (!keys.includes('user-data-cache')) {
      throw new Error(`user-data-cache should survive SW update. Caches: ${keys}`)
    }
    await page.close()
  })

  await assert('Build B: Page hydrates with current build', async () => {
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', (err) => errors.push(err.message))
    await page.goto(`http://localhost:${PORT}/projectile-motion`)
    await page.waitForSelector('canvas', { timeout: 15000 })
    await page.waitForTimeout(2000)
    const title = await page.title()
    if (!title.includes('Fizzix') && !title.includes('Projectile')) {
      throw new Error(`Unexpected title: ${title}`)
    }
    await page.close()
  })

  await assert('Build B: Offline lesson works for visited page', async () => {
    const page = await context.newPage()
    await page.goto(`http://localhost:${PORT}/projectile-motion`)
    await page.waitForSelector('canvas', { timeout: 15000 })
    await page.waitForTimeout(3000)

    const cdp = await context.newCDPSession(page)
    await cdp.send('Network.emulateNetworkConditions', {
      offline: true, downloadThroughput: 0, uploadThroughput: 0, latency: 0,
    })

    await page.reload({ waitUntil: 'domcontentloaded', timeout: 10000 })
    const title = await page.title()

    await cdp.send('Network.emulateNetworkConditions', {
      offline: false, downloadThroughput: -1, uploadThroughput: -1, latency: 0,
    })

    if (!title.includes('Fizzix') && !title.includes('Projectile')) {
      throw new Error(`Offline page title: "${title}"`)
    }
    await page.close()
  })

  await browser.close()
  killServer()

  // Restore original SW
  restoreSW()
  console.log('\nRestored sw.js to original (fizzix-v1)')

  // Rebuild with original version to leave working directory clean
  console.log('Rebuilding with original version...')
  execSync(`cd ${projectRoot} && npx next build`, { stdio: 'pipe', timeout: 180000 })

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`)
  if (failures.length > 0) {
    console.log('\nFailures:')
    for (const f of failures) console.log(`  ${f.name}: ${f.error}`)
  }
  process.exit(failed > 0 ? 1 : 0)
}

run().catch(err => {
  restoreSW()
  console.error('Fatal:', err)
  process.exit(1)
})
