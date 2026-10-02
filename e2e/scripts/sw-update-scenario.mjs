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

function findNextBin() {
  const direct = resolve(projectRoot, 'node_modules/.bin/next')
  try { execSync(`test -x "${direct}"`, { stdio: 'ignore' }); return direct } catch {}
  return 'npx'
}

async function startServer(env = {}) {
  const nextBin = findNextBin()
  const args = nextBin.endsWith('/next') ? ['start', '-p', String(PORT)] : ['next', 'start', '-p', String(PORT)]
  const child = spawn(nextBin, args, {
    cwd: projectRoot,
    stdio: 'pipe',
    detached: true,
    env: { ...process.env, ...env },
  })
  serverChild = child
  let serverOutput = ''
  child.stdout.on('data', d => { serverOutput += d.toString() })
  child.stderr.on('data', d => { serverOutput += d.toString() })
  let exited = false
  child.on('exit', (code, signal) => {
    exited = true
    if (code !== null && code !== 0 && code !== 143) console.log(`  Server exited unexpectedly: code=${code} signal=${signal}`)
  })
  for (let i = 0; i < 90; i++) {
    if (exited) throw new Error(`Server process exited prematurely: ${serverOutput.substring(0, 500)}`)
    try {
      const res = await fetch(`http://localhost:${PORT}/`)
      if (res.ok || res.status < 500) {
        console.log(`  Server running (PID ${child.pid}, binary: ${nextBin})`)
        return
      }
    } catch {}
    await new Promise(r => setTimeout(r, 1000))
  }
  throw new Error(`Server did not start within 90s. Output: ${serverOutput.substring(0, 500)}`)
}

function stopServer() {
  return new Promise((resolveStop) => {
    const child = serverChild
    serverChild = null
    if (!child || child.exitCode !== null) { resolveStop(); return }
    const pid = child.pid
    let done = false
    const finish = () => {
      if (done) return
      done = true
      try { child.stdout?.removeAllListeners(); child.stderr?.removeAllListeners() } catch {}
      try { child.stdout?.destroy(); child.stderr?.destroy() } catch {}
      child.removeAllListeners()
      child.unref()
      console.log(`  Server stopped (PID ${pid})`)
      resolveStop()
    }
    child.on('exit', finish)
    try { process.kill(-pid, 'SIGTERM') } catch { child.kill('SIGTERM') }
    setTimeout(() => {
      try { process.kill(-pid, 'SIGKILL') } catch {}
      try { child.kill('SIGKILL') } catch {}
      setTimeout(finish, 500)
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

  await assert('Build A: Seed unsynced quiz record in fizzix-quiz/results', async () => {
    const page = await context.newPage()
    await page.goto(`http://localhost:${PORT}/projectile-motion`)
    await page.waitForSelector('canvas', { timeout: 15000 })

    await page.evaluate(() => {
      return new Promise((resolve, reject) => {
        const req = indexedDB.open('fizzix-quiz', 1)
        req.onupgradeneeded = () => {
          const db = req.result
          if (!db.objectStoreNames.contains('results')) {
            const store = db.createObjectStore('results', { keyPath: 'id' })
            store.createIndex('synced', 'synced')
            store.createIndex('sessionId', 'sessionId')
          }
        }
        req.onsuccess = () => {
          const db = req.result
          const tx = db.transaction('results', 'readwrite')
          tx.objectStore('results').put({
            id: 'sw-update-persist-check',
            sessionId: 'sw-test-session',
            topicId: 'projectile-motion',
            questionId: 'pm-e1',
            selectedIndex: 1,
            correct: true,
            difficulty: 'easy',
            poolVersion: 1,
            timestamp: Date.now(),
            synced: 0,
          })
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
  for (let i = 0; i < 15; i++) {
    try { await fetch(`http://localhost:${PORT}/`); } catch { break }
    await new Promise(r => setTimeout(r, 1000))
  }
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

  await assert('Build B: Unsynced quiz record in fizzix-quiz/results survives SW update', async () => {
    const page = await context.newPage()
    await page.goto(`http://localhost:${PORT}/projectile-motion`)
    await page.waitForSelector('canvas', { timeout: 15000 })

    const record = await page.evaluate(() => {
      return new Promise((resolve, reject) => {
        const req = indexedDB.open('fizzix-quiz', 1)
        req.onsuccess = () => {
          const db = req.result
          if (!db.objectStoreNames.contains('results')) { db.close(); resolve(null); return }
          const tx = db.transaction('results', 'readonly')
          const getReq = tx.objectStore('results').get('sw-update-persist-check')
          getReq.onsuccess = () => { db.close(); resolve(getReq.result) }
          getReq.onerror = () => { db.close(); reject(getReq.error) }
        }
        req.onerror = () => reject(req.error)
      })
    })
    if (!record) throw new Error('Unsynced quiz record lost after SW update')
    if (record.synced !== 0) throw new Error(`Record synced flag changed: expected 0, got ${record.synced}`)
    if (record.questionId !== 'pm-e1') throw new Error(`Record questionId corrupted: ${record.questionId}`)
    if (record.sessionId !== 'sw-test-session') throw new Error(`Record sessionId corrupted: ${record.sessionId}`)
    console.log(`    (verified: id=${record.id}, synced=${record.synced}, questionId=${record.questionId})`)
    await page.close()
  })

  await assert('Build B: Offline simulation playback advances and pauses', async () => {
    const page = await context.newPage()
    await page.goto(`http://localhost:${PORT}/projectile-motion`)
    await page.waitForSelector('canvas', { timeout: 15000 })
    await page.waitForTimeout(3000)

    const cdp = await context.newCDPSession(page)
    await cdp.send('Network.emulateNetworkConditions', {
      offline: true, downloadThroughput: 0, uploadThroughput: 0, latency: 0,
    })

    await page.reload({ waitUntil: 'domcontentloaded', timeout: 10000 })
    await page.waitForSelector('canvas', { timeout: 10000 })

    const title = await page.title()
    if (!title.includes('Fizzix') && !title.includes('Projectile')) {
      throw new Error(`Offline page title: "${title}"`)
    }
    if (await page.locator('canvas').count() === 0) throw new Error('No canvas in offline page')

    const playBtn = page.locator('button[aria-label="Play"], button[aria-label="Replay"]').first()
    if (await playBtn.count() === 0) throw new Error('No Play/Replay button found by aria-label')

    const beforeLabel = await playBtn.getAttribute('aria-label')
    console.log(`    (play button before click: aria-label="${beforeLabel}")`)

    await playBtn.click()
    await page.waitForTimeout(600)

    const snap1 = await page.evaluate(() => {
      const c = document.querySelector('canvas')
      return c ? c.toDataURL('image/png') : null
    })
    if (!snap1) throw new Error('Canvas read failed after Play')

    await page.waitForTimeout(500)

    const snap2 = await page.evaluate(() => {
      const c = document.querySelector('canvas')
      return c ? c.toDataURL('image/png') : null
    })
    if (!snap2) throw new Error('Canvas read failed during playback')
    if (snap1 === snap2) throw new Error('Canvas did not change during playback — simulation not advancing')
    console.log(`    (canvas advanced: ${snap1.length} → ${snap2.length} chars)`)

    const pauseBtn = page.locator('button[aria-label="Pause"]').first()
    if (await pauseBtn.count() === 0) throw new Error('No Pause button found — Play did not switch to Pause')

    await pauseBtn.click()
    await page.waitForTimeout(300)

    const snap3 = await page.evaluate(() => {
      const c = document.querySelector('canvas')
      return c ? c.toDataURL('image/png') : null
    })
    await page.waitForTimeout(500)
    const snap4 = await page.evaluate(() => {
      const c = document.querySelector('canvas')
      return c ? c.toDataURL('image/png') : null
    })
    if (snap3 !== snap4) throw new Error('Canvas still changing after Pause — simulation did not stop')
    console.log(`    (canvas stable after Pause: ${snap3.length} chars, confirmed stopped)`)

    const afterPauseLabel = await page.locator('button[aria-label="Play"], button[aria-label="Replay"]').first().getAttribute('aria-label')
    console.log(`    (button after pause: aria-label="${afterPauseLabel}")`)

    await cdp.send('Network.emulateNetworkConditions', {
      offline: false, downloadThroughput: -1, uploadThroughput: -1, latency: 0,
    })
    await page.close()
  })

  await assert('Build B: Rendered page identifies as Build B', async () => {
    const page = await context.newPage()
    await page.goto(`http://localhost:${PORT}/projectile-motion`)
    await page.waitForSelector('canvas', { timeout: 15000 })

    const buildBId = evidence.buildB.buildId
    if (!buildBId || buildBId === 'unknown') throw new Error('Build B ID not recorded')

    const pageId = await page.evaluate(async (expectedId) => {
      const scripts = [...document.querySelectorAll('script[src*="/_next/"]')].map(s => s.src)
      const containsBuildId = scripts.some(s => s.includes(expectedId))
      let serverBuildId = null
      try {
        const r = await fetch('/_next/BUILD_ID')
        if (r.ok) serverBuildId = (await r.text()).trim()
      } catch {}
      const pageSource = document.documentElement.innerHTML
      const sourceHasBuildId = pageSource.includes(expectedId)
      return { scripts: scripts.length, containsBuildId, serverBuildId, sourceHasBuildId, expectedId }
    }, buildBId)

    const matched = pageId.containsBuildId || pageId.serverBuildId === buildBId || pageId.sourceHasBuildId
    if (!matched) {
      throw new Error(
        `Page does not identify as Build B (${buildBId}). ` +
        `Scripts contain ID: ${pageId.containsBuildId}, server BUILD_ID: ${pageId.serverBuildId}, ` +
        `source contains ID: ${pageId.sourceHasBuildId}`
      )
    }
    const method = pageId.containsBuildId ? 'script URLs' : pageId.serverBuildId === buildBId ? '/_next/BUILD_ID' : 'page source'
    console.log(`    (Build B identity ${buildBId} confirmed via ${method}, ${pageId.scripts} scripts loaded)`)
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
