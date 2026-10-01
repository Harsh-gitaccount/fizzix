import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rateLimit'

interface QuizResultPayload {
  id?: string
  sessionId: string
  topicId: string
  questionId: string
  selected: number
  correct: boolean
  difficulty: string
  poolVersion?: number
  timestamp: number
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const { allowed, remaining } = rateLimit(ip)

  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': '60', 'X-RateLimit-Remaining': '0' } }
    )
  }

  let body: { results: QuizResultPayload[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!Array.isArray(body.results) || body.results.length === 0 || body.results.length > 100) {
    return NextResponse.json({ error: 'results must be an array of 1-100 items' }, { status: 400 })
  }

  const VALID_DIFFICULTIES = new Set(['easy', 'medium', 'hard'])
  const MAX_STR_LEN = 100

  for (const r of body.results) {
    if (!r.sessionId || !r.topicId || !r.questionId || typeof r.selected !== 'number' || typeof r.correct !== 'boolean') {
      return NextResponse.json({ error: 'Invalid result entry' }, { status: 400 })
    }
    if (typeof r.sessionId !== 'string' || r.sessionId.length > MAX_STR_LEN ||
        typeof r.topicId !== 'string' || r.topicId.length > MAX_STR_LEN ||
        typeof r.questionId !== 'string' || r.questionId.length > MAX_STR_LEN) {
      return NextResponse.json({ error: 'Invalid string field' }, { status: 400 })
    }
    if (!Number.isInteger(r.selected) || r.selected < 0 || r.selected > 3) {
      return NextResponse.json({ error: 'selected must be 0-3' }, { status: 400 })
    }
    if (typeof r.difficulty !== 'string' || !VALID_DIFFICULTIES.has(r.difficulty)) {
      return NextResponse.json({ error: 'difficulty must be easy, medium, or hard' }, { status: 400 })
    }
    if (typeof r.timestamp !== 'number' || !Number.isFinite(r.timestamp) || r.timestamp < 0) {
      return NextResponse.json({ error: 'Invalid timestamp' }, { status: 400 })
    }
  }

  // Persist to PostgreSQL when DATABASE_URL is configured
  if (process.env.DATABASE_URL) {
    try {
      const { getPrisma } = await import('@/lib/db')
      const prisma = await getPrisma()
      if (prisma) {
        await prisma.quizResult.createMany({
          data: body.results.map((r: QuizResultPayload) => ({
            ...(r.id ? { id: r.id } : {}),
            sessionId: r.sessionId,
            topicId: r.topicId,
            questionId: r.questionId,
            selected: r.selected,
            correct: r.correct,
            difficulty: r.difficulty,
            poolVersion: r.poolVersion ?? 1,
            timestamp: new Date(r.timestamp),
          })),
          skipDuplicates: true,
        })
      }
    } catch (err) {
      console.error('Failed to persist quiz results:', err)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }
  }

  return NextResponse.json(
    { synced: body.results.length },
    { headers: { 'X-RateLimit-Remaining': String(remaining) } }
  )
}
