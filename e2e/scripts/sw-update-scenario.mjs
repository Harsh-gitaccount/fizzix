/**
 * Two-production-build service worker update scenario (Task 5).
 *
 * 1. Build A (fizzix-v1): register SW, seed cache and IndexedDB entries
 * 2. Build B (fizzix-v2): verify SW updates, old cache purged,
 *    new cache works, IndexedDB survives, no hydration errors
 *
 * Server processes are managed via tracked child PIDs, not fuser -k.
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
import { spawn, execSync } from 'child_process'
import { readFileSync, writeFileSync, existsSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(__dirname, '../..')
const require = createRequire(resolve(projectRoot, 'package.json'))
const { chromium } = require('playwright')

const CHROMIUM = process.env.CHROMIUM_PATH || undefined
const PORT = 3099

let passed = 0
let failed = 0
const failures = []
const evidence = { buildA: {}, buildB: {} }

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

let serverChild = null

async function startServer(env = {}) {
  serverChild = spawn('npx', ['next', 'start', '-p', String(PORT)], {
    cwd: projectRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, ...env },
  })
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://localhost:${PORT}/`)
      if (res.ok || res.status < 500) {
        console.log(`  Server running (PID ${serverChild.pid})`)
        return
      }
    } catch {}
    await new Promise(r => setTimeout(r, 1000))
  }
  throw new Error('Server did not start within 60s')
}

function stopServer() {
  return new Promise((resolve) => {
    if (!serverChild || serverChild.exitCode !== null) { resolve(); return }
    let done = false
    serverChild.on('exit', () => { if (!done) { done = true; resolve() } })
    serverChild.kill('SIGTERM')
    setTimeout(() => {
      try { serverChild.kill('SIGKILL') } catch {}
      if (!done) { done = true; resolve() }
    }, 5000)
  })
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

function readBuildId() {
  const buildIdPath = resolve(projectRoot, '.next/BUILD_ID')
  return existsSync(buildIdPath) ? readFileSync(buildIdPath, 'utf-8').trim() : 'unknown'
}

async function run() {
  console.log('\n=== Two-Build SW Update Scenario ===\n')

  // Phase 1: Build A with fizzix-v1 (already current)
  console.log('Phase 1: Building A (fizzix-v1)...')
  setSWVersion(1)
  execSync(`cd ${projectRoot} && npx next build`, { stdio: 'pipe', timeout: 180000 })
  evidence.buildA.buildId = readBuildId()
  console.log(`  Build A identity: ${evidence.buildA.buildId}`)

  await startServer()

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-gpu'],
    ...(CHROMIUM ? { executablePath: CHROMIUM } : {}),
  })

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

  await assert('Build A: Seed IndexedDB quiz record', async () => {
    const page = await context.newPage()
    await page.goto(`http://localhost:${PORT}/projectile-motion`)
    await page.waitForSelector('canvas', { timeout: 15000 })

    await page.evaluate(() => {
      return new Promise((resolve, reject) => {
        const req = indexedDB.open('fizzix-sw-test', 1)
        req.onupgradeneeded = () => {
          req.result.createObjectStore('records', { keyPath: 'id' })
        }
        req.onsuccess = () => {
          const db = req.result
          const tx = db.transaction('records', 'readwrite')
          tx.objectStore('records').put({ id: 'persist-check', data: 'before-sw-update', ts: Date.now() })
          tx.oncomplete = () => { db.close(); resolve() }
          tx.onerror = () => reject(tx.error)
        }
        req.onerror = () => reject(req.error)
      })
    })
    await page.close()
  })

  await assert('Build A: Page hydrates correctly', async () => {
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', (err) => errors.push(err.message))
    await page.goto(`http://localhost:${PORT}/projectile-motion`)
    await page.waitForSelector('canvas', { timeout: 15000 })
    await page.waitForTimeout(1500)
    const title = await page.title()
    if (!title.includes('Fizzix') && !title.includes('Projectile')) {
      throw new Error(`Unexpected title: ${title}`)
    }
    if (errors.length > 0) throw new Error(`Build A hydration errors: ${errors.join('; ')}`)
    await page.close()
  })

  // Phase 2: Build B with fizzix-v2
  console.log('\nPhase 2: Building B (fizzix-v2)...')
  await stopServer()
  await new Promise(r => setTimeout(r, 2000))
  setSWVersion(2)
  execSync(`cd ${projectRoot} && npx next build`, { stdio: 'pipe', timeout: 180000 })
  evidence.buildB.buildId = readBuildId()
  console.log(`  Build B identity: ${evidence.buildB.buildId}`)

  await startServer()
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

  await assert('Build B: Page hydrates without JS errors', async () => {
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
    if (errors.length > 0) {
      throw new Error(`Build B hydration errors: ${errors.join('; ')}`)
    }
    await page.close()
  })

  await assert('Build B: IndexedDB quiz records survive SW update', async () => {
    const page = await context.newPage()
    await page.goto(`http://localhost:${PORT}/projectile-motion`)
    await page.waitForSelector('canvas', { timeout: 15000 })

    const record = await page.evaluate(() => {
      return new Promise((resolve, reject) => {
        const req = indexedDB.open('fizzix-sw-test', 1)
        req.onsuccess = () => {
          const db = req.result
          if (!db.objectStoreNames.contains('records')) { db.close(); resolve(null); return }
          const tx = db.transaction('records', 'readonly')
          const getReq = tx.objectStore('records').get('persist-check')
          getReq.onsuccess = () => { db.close(); resolve(getReq.result) }
          getReq.onerror = () => { db.close(); reject(getReq.error) }
        }
        req.onerror = () => reject(req.error)
      })
    })
    if (!record) throw new Error('IndexedDB record lost after SW update')
    if (record.data !== 'before-sw-update') throw new Error(`Record data corrupted: ${record.data}`)
    await page.close()
  })

  await assert('Build B: Offline lesson renders with canvas', async () => {
    const page = await context.newPage()
    await page.goto(`http://localhost:${PORT}/projectile-motion`)
    await page.waitForSelector('canvas', { timeout: 15000 })
    await page.waitForTimeout(3000)

    const cdp = await context.newCDPSession(page)
    await cdp.send('Network.emulateNetworkConditions', {
      offline: true, downloadThroughput: 0, uploadThroughput: 0, latency: 0,
    })

    await page.reload({ waitUntil: 'domcontentloaded', timeout: 10000 })

    const result = await page.evaluate(() => ({
      title: document.title,
      hasCanvas: !!document.querySelector('canvas'),
      hasControls: !!document.querySelector('button'),
    }))

    await cdp.send('Network.emulateNetworkConditions', {
      offline: false, downloadThroughput: -1, uploadThroughput: -1, latency: 0,
    })

    if (!result.title.includes('Fizzix') && !result.title.includes('Projectile')) {
      throw new Error(`Offline page title: "${result.title}"`)
    }
    if (!result.hasCanvas) {
      throw new Error('No canvas element in offline-served page')
    }
    if (!result.hasControls) {
      throw new Error('No interactive controls in offline-served page')
    }
    await page.close()
  })

  await browser.close()
  await stopServer()

  restoreSW()
  console.log('\nRestored sw.js to original (fizzix-v1)')

  console.log('Rebuilding with original version...')
  execSync(`cd ${projectRoot} && npx next build`, { stdio: 'pipe', timeout: 180000 })

  console.log('\n=== Evidence ===')
  console.log(`  Build A: ${evidence.buildA.buildId}`)
  console.log(`  Build B: ${evidence.buildB.buildId}`)

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`)
  if (failures.length > 0) {
    console.log('\nFailures:')
    for (const f of failures) console.log(`  ${f.name}: ${f.error}`)
  }
  process.exit(failed > 0 ? 1 : 0)
}

run().catch(async (err) => {
  restoreSW()
  await stopServer()
  console.error('Fatal:', err)
  process.exit(1)
})
