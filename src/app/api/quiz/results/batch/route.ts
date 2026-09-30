import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rateLimit'

interface QuizResultPayload {
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

  for (const r of body.results) {
    if (!r.sessionId || !r.topicId || !r.questionId || typeof r.selected !== 'number' || typeof r.correct !== 'boolean') {
      return NextResponse.json({ error: 'Invalid result entry' }, { status: 400 })
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
            sessionId: r.sessionId,
            topicId: r.topicId,
            questionId: r.questionId,
            selected: r.selected,
            correct: r.correct,
            difficulty: r.difficulty,
            poolVersion: r.poolVersion ?? 1,
            timestamp: new Date(r.timestamp),
          })),
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
