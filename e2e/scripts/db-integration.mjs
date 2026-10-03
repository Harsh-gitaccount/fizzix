/**
 * Prisma 7 + PrismaPg integration tests against a disposable PostgreSQL database.
 *
 * Tests: client construction, durable writes, read-after-restart, idempotency,
 * acknowledged-ID correspondence, failure behavior, and no-database fallback.
 *
 * Prerequisites:
 *   - PostgreSQL running with a disposable database
 *   - prisma db push completed against that database
 *   - npm ci completed
 *
 * Usage:
 *   DATABASE_URL="postgresql://user:pass@localhost:5432/dbname" node e2e/scripts/db-integration.mjs
 */

import { createRequire } from 'module'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(__dirname, '../..')
const require = createRequire(resolve(projectRoot, 'package.json'))

const { PrismaPg } = require('@prisma/adapter-pg')
const { PrismaClient } = require('@prisma/client')

const DB_URL = process.env.DATABASE_URL
if (!DB_URL) {
  console.error('DATABASE_URL required')
  process.exit(1)
}

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

async function run() {
  console.log('\n=== Prisma 7 PostgreSQL Integration Tests ===\n')

  const cleanAdapter = new PrismaPg({ connectionString: DB_URL })
  const cleanClient = new PrismaClient({ adapter: cleanAdapter })
  await cleanClient.quizResult.deleteMany({})
  await cleanClient.quizAggregate.deleteMany({})
  await cleanClient.$disconnect()

  let client1
  await assert('Client construction with PrismaPg adapter', async () => {
    const adapter = new PrismaPg({ connectionString: DB_URL })
    client1 = new PrismaClient({ adapter })
    const count = await client1.quizResult.count()
    eq(count, 0, 'Initial count')
  })

  const testId = 'integration-test-' + Date.now()
  await assert('Durable write: quiz result stored and readable', async () => {
    await client1.quizResult.create({
      data: {
        id: testId,
        sessionId: 'test-session-1',
        topicId: 'projectile-motion',
        questionId: 'pm-e1',
        selected: 2,
        correct: true,
        difficulty: 'easy',
        poolVersion: 1,
        timestamp: new Date('2026-10-01T12:00:00Z'),
      },
    })
    const row = await client1.quizResult.findUnique({ where: { id: testId } })
    if (!row) throw new Error('Row not found after insert')
    eq(row.sessionId, 'test-session-1', 'sessionId')
    eq(row.correct, true, 'correct')
  })

  await assert('Read after restart: data persists across client instances', async () => {
    await client1.$disconnect()
    const adapter2 = new PrismaPg({ connectionString: DB_URL })
    const client2 = new PrismaClient({ adapter: adapter2 })
    const row = await client2.quizResult.findUnique({ where: { id: testId } })
    if (!row) throw new Error('Row not found after reconnect')
    eq(row.topicId, 'projectile-motion', 'topicId')
    await client2.$disconnect()
  })

  await assert('Idempotency: skipDuplicates prevents duplicate inserts', async () => {
    const adapter3 = new PrismaPg({ connectionString: DB_URL })
    const client3 = new PrismaClient({ adapter: adapter3 })
    await client3.quizResult.createMany({
      data: [{
        id: testId,
        sessionId: 'test-session-1',
        topicId: 'projectile-motion',
        questionId: 'pm-e1',
        selected: 2,
        correct: true,
        difficulty: 'easy',
        poolVersion: 1,
        timestamp: new Date('2026-10-01T12:00:00Z'),
      }],
      skipDuplicates: true,
    })
    eq(await client3.quizResult.count(), 1, 'Count after replay')
    await client3.$disconnect()
  })

  await assert('Acknowledged IDs correspond to durable records', async () => {
    const adapter4 = new PrismaPg({ connectionString: DB_URL })
    const client4 = new PrismaClient({ adapter: adapter4 })
    const newId = 'ack-test-' + Date.now()
    await client4.quizResult.createMany({
      data: [{
        id: newId,
        sessionId: 'test-session-2',
        topicId: 'shm',
        questionId: 'shm-e1',
        selected: 0,
        correct: true,
        difficulty: 'easy',
        poolVersion: 1,
        timestamp: new Date('2026-10-01T13:00:00Z'),
      }],
      skipDuplicates: true,
    })
    const stored = await client4.quizResult.findUnique({ where: { id: newId } })
    if (!stored) throw new Error('Acknowledged ID not found')
    eq(stored.questionId, 'shm-e1', 'Stored questionId')
    await client4.$disconnect()
  })

  await assert('Bad connection: query throws (not silent null)', async () => {
    try {
      const badAdapter = new PrismaPg({ connectionString: 'postgresql://bad:bad@127.0.0.1:1/x' })
      const badClient = new PrismaClient({ adapter: badAdapter })
      await badClient.quizResult.count()
      throw new Error('Should have thrown on bad connection')
    } catch (e) {
      if (e.message === 'Should have thrown on bad connection') throw e
    }
  })

  await assert('Missing DATABASE_URL: getPrisma returns null', async () => {
    const origUrl = process.env.DATABASE_URL
    delete process.env.DATABASE_URL
    const esbuild = require('esbuild')
    const result = esbuild.buildSync({
      entryPoints: [resolve(projectRoot, 'src/lib/db.ts')],
      bundle: true,
      platform: 'node',
      write: false,
      external: ['@prisma/client', '@prisma/adapter-pg'],
      format: 'cjs',
    })
    const mod = { exports: {} }
    new Function('require', 'module', 'exports', result.outputFiles[0].text)(require, mod, mod.exports)
    const prisma = await mod.exports.getPrisma()
    if (prisma !== null) throw new Error(`Expected null, got ${typeof prisma}`)
    process.env.DATABASE_URL = origUrl
  })

  const cleanAdapter2 = new PrismaPg({ connectionString: DB_URL })
  const cleanClient2 = new PrismaClient({ adapter: cleanAdapter2 })
  await cleanClient2.quizResult.deleteMany({})
  await cleanClient2.$disconnect()

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
