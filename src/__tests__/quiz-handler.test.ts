import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { QUIZ_POOL } from '@/simulations/projectile-motion/quiz'

vi.mock('@/lib/db', () => {
  const createMany = vi.fn().mockResolvedValue({ count: 0 })
  return {
    getPrisma: vi.fn().mockResolvedValue({
      quizResult: { createMany },
    }),
    __mockCreateMany: createMany,
  }
})

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/quiz/results/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '127.0.0.1' },
    body: JSON.stringify(body),
  })
}

function validPayload(overrides: Record<string, unknown> = {}) {
  const q = QUIZ_POOL[0]
  return {
    id: 'test-uuid-1',
    sessionId: 'test-session',
    topicId: q.topicId,
    questionId: q.id,
    selected: q.correctIndex,
    correct: true,
    difficulty: 'easy',
    poolVersion: 1,
    timestamp: Date.now(),
    ...overrides,
  }
}

describe('POST /api/quiz/results/batch - handler tests', () => {
  const originalEnv = process.env.DATABASE_URL

  beforeEach(() => {
    process.env.DATABASE_URL = 'postgres://test:test@localhost/test'
    vi.resetModules()
  })

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.DATABASE_URL = originalEnv
    } else {
      delete process.env.DATABASE_URL
    }
  })

  async function callHandler(body: unknown) {
    const { POST } = await import('@/app/api/quiz/results/batch/route')
    const req = makeRequest(body)
    return POST(req)
  }

  it('accepts valid payload and derives server-side correctness', async () => {
    const q = QUIZ_POOL[0]
    const res = await callHandler({ results: [validPayload({ correct: false, selected: q.correctIndex })] })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.stored).toBe(true)
    expect(body.acceptedIds).toContain('test-uuid-1')
  })

  it('rejects invented question ID with 400', async () => {
    const res = await callHandler({ results: [validPayload({ questionId: 'fake-question-id' })] })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('Unknown question')
  })

  it('rejects cross-topic question ID', async () => {
    const res = await callHandler({
      results: [validPayload({ topicId: 'optics', questionId: QUIZ_POOL[0].id })],
    })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('Unknown question')
  })

  it('rejects numeric id field', async () => {
    const res = await callHandler({ results: [validPayload({ id: 17 })] })
    expect(res.status).toBe(400)
  })

  it('rejects string poolVersion', async () => {
    const res = await callHandler({ results: [validPayload({ poolVersion: 'not-an-integer' })] })
    expect(res.status).toBe(400)
  })

  it('rejects out-of-range timestamp (1e30)', async () => {
    const res = await callHandler({ results: [validPayload({ timestamp: 1e30 })] })
    expect(res.status).toBe(400)
  })

  it('rejects negative timestamp', async () => {
    const res = await callHandler({ results: [validPayload({ timestamp: -1000 })] })
    expect(res.status).toBe(400)
  })

  it('rejects zero poolVersion', async () => {
    const res = await callHandler({ results: [validPayload({ poolVersion: 0 })] })
    expect(res.status).toBe(400)
  })

  it('accepts undefined id (no id field)', async () => {
    const payload = validPayload()
    delete (payload as Record<string, unknown>).id
    const res = await callHandler({ results: [payload] })
    expect(res.status).toBe(200)
  })

  it('accepts undefined poolVersion (defaults to 1)', async () => {
    const payload = validPayload()
    delete (payload as Record<string, unknown>).poolVersion
    const res = await callHandler({ results: [payload] })
    expect(res.status).toBe(200)
  })

  it('rejects poolVersion higher than current bank version', async () => {
    const res = await callHandler({ results: [validPayload({ poolVersion: 999 })] })
    expect(res.status).toBe(400)
  })

  it('accepts poolVersion equal to current bank version', async () => {
    const res = await callHandler({ results: [validPayload({ poolVersion: 1 })] })
    expect(res.status).toBe(200)
  })

  it('returns stored:false when DATABASE_URL is not set', async () => {
    delete process.env.DATABASE_URL
    const { POST } = await import('@/app/api/quiz/results/batch/route')
    const req = makeRequest({ results: [validPayload()] })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.stored).toBe(false)
    expect(body.synced).toBe(0)
  })

  it('rejects empty results array', async () => {
    const res = await callHandler({ results: [] })
    expect(res.status).toBe(400)
  })

  it('rejects invalid JSON body', async () => {
    const { POST } = await import('@/app/api/quiz/results/batch/route')
    const req = new NextRequest('http://localhost:3000/api/quiz/results/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '127.0.0.1' },
      body: 'not json',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('server overrides false client claim to true when answer is correct', async () => {
    const q = QUIZ_POOL[0]
    const { __mockCreateMany } = await import('@/lib/db') as unknown as { __mockCreateMany: ReturnType<typeof vi.fn> }
    __mockCreateMany.mockClear()
    __mockCreateMany.mockResolvedValue({ count: 1 })

    const res = await callHandler({
      results: [validPayload({ selected: q.correctIndex, correct: false })],
    })
    expect(res.status).toBe(200)

    expect(__mockCreateMany).toHaveBeenCalledTimes(1)
    const createManyArg = __mockCreateMany.mock.calls[0][0]
    expect(createManyArg.data[0].correct).toBe(true)
  })

  it('server overrides true client claim to false when answer is wrong', async () => {
    const q = QUIZ_POOL[0]
    const { __mockCreateMany } = await import('@/lib/db') as unknown as { __mockCreateMany: ReturnType<typeof vi.fn> }
    __mockCreateMany.mockClear()
    __mockCreateMany.mockResolvedValue({ count: 1 })

    const wrongIndex = (q.correctIndex + 1) % 4
    const res = await callHandler({
      results: [validPayload({ selected: wrongIndex, correct: true })],
    })
    expect(res.status).toBe(200)

    expect(__mockCreateMany).toHaveBeenCalledTimes(1)
    const createManyArg = __mockCreateMany.mock.calls[0][0]
    expect(createManyArg.data[0].correct).toBe(false)
  })
})
