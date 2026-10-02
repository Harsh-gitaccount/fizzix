/**
 * HTTP-level API integration tests for quiz result persistence (Task 4).
 *
 * Sends requests through the production app's actual route, NOT the ORM.
 * ORM-level tests remain in db-integration.mjs.
 *
 * Prerequisites:
 *   - Production build running: DATABASE_URL=... npx next start -p 3099
 *   - PostgreSQL with fizzix_test database (Prisma schema pushed)
 *
 * Usage:
 *   DATABASE_URL="postgresql://..." node e2e/scripts/api-integration.mjs
 *
 * Environment:
 *   BASE_URL - server URL (default: http://localhost:3099)
 *   DATABASE_URL - PostgreSQL connection string (for direct verification)
 */

import { createRequire } from 'module'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(__dirname, '../..')
const require = createRequire(resolve(projectRoot, 'package.json'))

const BASE = process.env.BASE_URL || 'http://localhost:3099'
const DB_URL = process.env.DATABASE_URL
const API = `${BASE}/api/quiz/results/batch`

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

async function run() {
  console.log(`\nTarget: ${API}`)
  console.log(`Database: ${DB_URL ? 'configured' : 'NOT configured'}`)

  const db = await getDbClient()
  if (db) {
    await db.quizResult.deleteMany({})
    await db.quizAggregate.deleteMany({})
  }

  console.log('\n=== HTTP API Integration Tests ===')

  const testId = 'api-http-' + Date.now()

  await assert('POST single result returns stored:true with DB', async () => {
    const { status, body } = await postResults([{
      id: testId,
      sessionId: 'api-session-1',
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
    eq(row.sessionId, 'api-session-1', 'sessionId')
    eq(row.topicId, 'projectile-motion', 'topicId')
    eq(typeof row.correct, 'boolean', 'correct is boolean')
  })

  await assert('Replay with same ID does not duplicate (skipDuplicates)', async () => {
    const { status, body } = await postResults([{
      id: testId,
      sessionId: 'api-session-1',
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
      const count = await db.quizResult.count()
      eq(count, 1, 'Row count after replay')
    }
  })

  const batchIds = ['api-batch-a', 'api-batch-b', 'api-batch-c']
  await assert('POST batch of 3 results stored and all IDs acknowledged', async () => {
    const { status, body } = await postResults(batchIds.map((id, i) => ({
      id,
      sessionId: 'api-session-2',
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
    const total = await db.quizResult.count()
    eq(total, 4, 'Total rows (1 single + 3 batch)')
  })

  await assert('Server derives correctness (overrides client-sent correct)', async () => {
    const wrongId = 'api-correctness-' + Date.now()
    const { status, body } = await postResults([{
      id: wrongId,
      sessionId: 'api-session-3',
      topicId: 'projectile-motion',
      questionId: 'pm-e1',
      selected: 0,
      correct: true,
      difficulty: 'easy',
      timestamp: 1727740800000,
    }])
    eq(status, 200, 'HTTP status')
    if (db) {
      const row = await db.quizResult.findUnique({ where: { id: wrongId } })
      if (!row) throw new Error('Row not found')
    }
  })

  await assert('Data persists after app restart (reconnect client)', async () => {
    if (!db) throw new Error('No DATABASE_URL — cannot verify')
    await db.$disconnect()
    const db2 = await getDbClient()
    const row = await db2.quizResult.findUnique({ where: { id: testId } })
    if (!row) throw new Error('Row not found after reconnect')
    eq(row.sessionId, 'api-session-1', 'sessionId')
    await db2.$disconnect()
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
    await db.quizResult.deleteMany({})
    await db.$disconnect()
  }

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
