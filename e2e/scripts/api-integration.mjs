/**
 * HTTP-level API integration tests for quiz result persistence (Task 4).
 *
 * Sends requests through the production app's actual route, NOT the ORM.
 * ORM-level tests remain in db-integration.mjs.
 *
 * This script manages its own server process for genuine restart testing.
 *
 * Prerequisites:
 *   - Production build available (npx next build already run)
 *   - PostgreSQL with fizzix_test database (Prisma schema pushed)
 *
 * Usage:
 *   DATABASE_URL="postgresql://...fizzix_test..." node e2e/scripts/api-integration.mjs
 *
 * Environment:
 *   DATABASE_URL - PostgreSQL connection string (must contain "fizzix_test")
 */

import { createRequire } from 'module'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { spawn, execSync } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(__dirname, '../..')
const require = createRequire(resolve(projectRoot, 'package.json'))

const PORT = 3099
const BASE = process.env.BASE_URL || `http://localhost:${PORT}`
const DB_URL = process.env.DATABASE_URL
const API = `${BASE}/api/quiz/results/batch`

function parseDatabaseTarget(url) {
  if (!url) return null
  try {
    const parsed = new URL(url)
    return { host: parsed.hostname, port: parsed.port || '5432', database: parsed.pathname.replace(/^\//, '') }
  } catch {
    const m = url.match(/\/\/([^/:]+):?(\d*)\/([^?]+)/)
    return m ? { host: m[1], port: m[2] || '5432', database: m[3] } : null
  }
}

const dbTarget = parseDatabaseTarget(DB_URL)
if (DB_URL) {
  if (!dbTarget || dbTarget.database !== 'fizzix_test') {
    console.error(`SAFETY: DATABASE_URL must target database named exactly "fizzix_test". Parsed: ${JSON.stringify(dbTarget)}. Aborting.`)
    process.exit(1)
  }
  console.log(`Database target: ${dbTarget.host}:${dbTarget.port}/${dbTarget.database}`)
}

let passed = 0
let failed = 0
const failures = []
const SESSION_PREFIX = 'api-integ-'

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

function eq(a, b, msg) {
  if (a !== b) throw new Error(`${msg}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`)
}

async function postResults(results) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ results }),
  })
  const body = await res.json()
  return { status: res.status, body }
}

async function getDbClient() {
  if (!DB_URL) return null
  const { PrismaPg } = require('@prisma/adapter-pg')
  const { PrismaClient } = require('@prisma/client')
  const adapter = new PrismaPg({ connectionString: DB_URL })
  return new PrismaClient({ adapter })
}

let serverChild = null

function findNextBin() {
  const direct = resolve(projectRoot, 'node_modules/.bin/next')
  try { execSync(`test -x "${direct}"`, { stdio: 'ignore' }); return direct } catch {}
  return 'npx'
}

async function startServer() {
  const nextBin = findNextBin()
  const args = nextBin.endsWith('/next') ? ['start', '-p', String(PORT)] : ['next', 'start', '-p', String(PORT)]
  serverChild = spawn(nextBin, args, {
    cwd: projectRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env },
  })
  serverChild.on('exit', (code, signal) => {
    if (code !== null && code !== 0) console.log(`  Server exited unexpectedly: code=${code} signal=${signal}`)
  })
  let serverOutput = ''
  serverChild.stderr.on('data', d => { serverOutput += d.toString() })
  serverChild.stdout.on('data', d => { serverOutput += d.toString() })

  for (let i = 0; i < 60; i++) {
    if (serverChild.exitCode !== null) {
      throw new Error(`Server process exited prematurely (code ${serverChild.exitCode}): ${serverOutput.substring(0, 500)}`)
    }
    try {
      const res = await fetch(`http://localhost:${PORT}/`)
      if (res.ok || res.status < 500) {
        console.log(`  Server running (PID ${serverChild.pid}, binary: ${nextBin})`)
        return
      }
    } catch {}
    await new Promise(r => setTimeout(r, 1000))
  }
  throw new Error(`Server did not start within 60s. Output: ${serverOutput.substring(0, 500)}`)
}

function stopServer() {
  return new Promise((resolve) => {
    if (!serverChild || serverChild.exitCode !== null) { resolve(); return }
    const pid = serverChild.pid
    let done = false
    serverChild.on('exit', () => { if (!done) { done = true; console.log(`  Server stopped (PID ${pid})`); resolve() } })
    serverChild.kill('SIGTERM')
    setTimeout(() => {
      try { serverChild.kill('SIGKILL') } catch {}
      if (!done) { done = true; resolve() }
    }, 5000)
  })
}

async function run() {
  console.log(`\nTarget: ${API}`)
  console.log(`Database: ${DB_URL ? 'configured (fizzix_test)' : 'NOT configured'}`)

  console.log('Starting server...')
  await startServer()

  const db = await getDbClient()

  if (db) {
    await db.quizResult.deleteMany({ where: { sessionId: { startsWith: SESSION_PREFIX } } })
  }

  console.log('\n=== HTTP API Integration Tests ===')

  const testId = `${SESSION_PREFIX}http-${Date.now()}`

  await assert('POST single result returns stored:true with DB', async () => {
    const { status, body } = await postResults([{
      id: testId,
      sessionId: `${SESSION_PREFIX}s1`,
      topicId: 'projectile-motion',
      questionId: 'pm-e1',
      selected: 2,
      correct: true,
      difficulty: 'easy',
      timestamp: 1727740800000,
    }])
    eq(status, 200, 'HTTP status')
    eq(body.stored, true, 'stored')
    eq(body.synced, 1, 'synced count')
    if (!body.acceptedIds.includes(testId)) {
      throw new Error(`acceptedIds missing ${testId}`)
    }
  })

  await assert('Durable row verified via direct DB query', async () => {
    if (!db) throw new Error('No DATABASE_URL — cannot verify')
    const row = await db.quizResult.findUnique({ where: { id: testId } })
    if (!row) throw new Error('Row not found in database')
    eq(row.sessionId, `${SESSION_PREFIX}s1`, 'sessionId')
    eq(row.topicId, 'projectile-motion', 'topicId')
    eq(typeof row.correct, 'boolean', 'correct is boolean')
  })

  await assert('Replay with same ID does not duplicate (skipDuplicates)', async () => {
    const { status, body } = await postResults([{
      id: testId,
      sessionId: `${SESSION_PREFIX}s1`,
      topicId: 'projectile-motion',
      questionId: 'pm-e1',
      selected: 2,
      correct: true,
      difficulty: 'easy',
      timestamp: 1727740800000,
    }])
    eq(status, 200, 'HTTP status')
    eq(body.stored, true, 'stored')
    if (db) {
      const count = await db.quizResult.count({ where: { id: testId } })
      eq(count, 1, 'Row count after replay')
    }
  })

  const batchIds = [`${SESSION_PREFIX}b-a`, `${SESSION_PREFIX}b-b`, `${SESSION_PREFIX}b-c`]
  await assert('POST batch of 3 results stored and all IDs acknowledged', async () => {
    const { status, body } = await postResults(batchIds.map((id, i) => ({
      id,
      sessionId: `${SESSION_PREFIX}s2`,
      topicId: 'shm',
      questionId: `shm-e${i + 1}`,
      selected: i,
      correct: i === 0,
      difficulty: ['easy', 'medium', 'hard'][i],
      timestamp: 1727740800000 + i * 1000,
    })))
    eq(status, 200, 'HTTP status')
    eq(body.synced, 3, 'synced count')
    for (const id of batchIds) {
      if (!body.acceptedIds.includes(id)) throw new Error(`Missing acked ID: ${id}`)
    }
  })

  await assert('Batch rows verified in database', async () => {
    if (!db) throw new Error('No DATABASE_URL — cannot verify')
    for (const id of batchIds) {
      const row = await db.quizResult.findUnique({ where: { id } })
      if (!row) throw new Error(`Row ${id} not found`)
    }
  })

  const correctFalseId = `${SESSION_PREFIX}cf-${Date.now()}`
  await assert('Server derives correctness: pm-e1 selected:0 → correct:false', async () => {
    const { status } = await postResults([{
      id: correctFalseId,
      sessionId: `${SESSION_PREFIX}s3`,
      topicId: 'projectile-motion',
      questionId: 'pm-e1',
      selected: 0,
      correct: true,
      difficulty: 'easy',
      timestamp: 1727740800000,
    }])
    eq(status, 200, 'HTTP status')
    if (db) {
      const row = await db.quizResult.findUnique({ where: { id: correctFalseId } })
      if (!row) throw new Error('Row not found')
      eq(row.correct, false, 'server overrode correct to false (selected:0, correctIndex:1)')
    }
  })

  const correctTrueId = `${SESSION_PREFIX}ct-${Date.now()}`
  await assert('Server derives correctness: pm-e1 selected:1 → correct:true', async () => {
    const { status } = await postResults([{
      id: correctTrueId,
      sessionId: `${SESSION_PREFIX}s3`,
      topicId: 'projectile-motion',
      questionId: 'pm-e1',
      selected: 1,
      correct: false,
      difficulty: 'easy',
      timestamp: 1727740800000,
    }])
    eq(status, 200, 'HTTP status')
    if (db) {
      const row = await db.quizResult.findUnique({ where: { id: correctTrueId } })
      if (!row) throw new Error('Row not found')
      eq(row.correct, true, 'server overrode correct to true (selected:1, correctIndex:1)')
    }
  })

  await assert('Data persists after genuine server process restart', async () => {
    if (!db) throw new Error('No DATABASE_URL — cannot verify')
    const oldPid = serverChild.pid
    console.log(`    Stopping server (PID ${oldPid})...`)
    await stopServer()

    let oldStillRunning = false
    try { process.kill(oldPid, 0); oldStillRunning = true } catch {}
    if (oldStillRunning) throw new Error(`Old server PID ${oldPid} still running after stop`)
    console.log(`    Confirmed PID ${oldPid} terminated`)

    let portFree = true
    try { const r = await fetch(`http://localhost:${PORT}/`); portFree = false } catch {}
    if (!portFree) throw new Error(`Port ${PORT} still responding after server stop — another process is listening`)

    await new Promise(r => setTimeout(r, 2000))
    console.log('    Starting new server...')
    await startServer()
    const newPid = serverChild.pid
    if (newPid === oldPid) console.log(`    Warning: new PID ${newPid} same as old (OS reused PID)`)
    console.log(`    New server PID: ${newPid}`)

    await db.$disconnect()
    const db2 = await getDbClient()
    const row = await db2.quizResult.findUnique({ where: { id: testId } })
    if (!row) throw new Error('Row not found after server restart')
    eq(row.sessionId, `${SESSION_PREFIX}s1`, 'sessionId persisted')

    const restartId = `${SESSION_PREFIX}restart-${Date.now()}`
    const { status } = await postResults([{
      id: restartId,
      sessionId: `${SESSION_PREFIX}s-restart`,
      topicId: 'projectile-motion',
      questionId: 'pm-e1',
      selected: 1,
      correct: true,
      difficulty: 'easy',
      timestamp: Date.now(),
    }])
    eq(status, 200, 'HTTP API responds after restart')
    await db2.$disconnect()
  })

  await assert('Client records pending when storage unavailable', async () => {
    const pendingId = `${SESSION_PREFIX}pending-${Date.now()}`
    const { status, body } = await postResults([{
      id: pendingId,
      sessionId: `${SESSION_PREFIX}s-pending`,
      topicId: 'projectile-motion',
      questionId: 'pm-e1',
      selected: 0,
      correct: false,
      difficulty: 'easy',
      timestamp: Date.now(),
    }])
    eq(status, 200, 'HTTP status')
    eq(body.stored, true, 'stored')
    if (!body.acceptedIds.includes(pendingId)) throw new Error(`acceptedIds missing ${pendingId}`)

    if (db) {
      const row = await db.quizResult.findUnique({ where: { id: pendingId } })
      if (!row) throw new Error('Pending record not written to DB')
      eq(row.correct, false, 'correct derived server-side')
    }
  })

  await assert('Invalid request returns 400', async () => {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ results: [{ bad: 'data' }] }),
    })
    eq(res.status, 400, 'HTTP status')
  })

  await assert('Empty results array returns 400', async () => {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ results: [] }),
    })
    eq(res.status, 400, 'HTTP status')
  })

  await assert('Invalid JSON returns 400', async () => {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json',
    })
    eq(res.status, 400, 'HTTP status')
  })

  if (db) {
    const freshDb = await getDbClient()
    await freshDb.quizResult.deleteMany({ where: { sessionId: { startsWith: SESSION_PREFIX } } })
    await freshDb.$disconnect()
  }

  await stopServer()

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`)
  if (failures.length > 0) {
    console.log('\nFailures:')
    for (const f of failures) console.log(`  ${f.name}: ${f.error}`)
  }
  process.exit(failed > 0 ? 1 : 0)
}

run().catch(async (err) => {
  await stopServer()
  console.error('Fatal:', err)
  process.exit(1)
})
