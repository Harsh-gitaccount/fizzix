import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rateLimit'

const VALID_TOPIC_IDS = new Set([
  'projectile-motion',
  'shm',
  'optics',
  'electrostatics',
  'thermodynamics',
  'modern-physics',
])

const VALID_DIFFICULTIES = new Set(['easy', 'medium', 'hard'])
const MAX_STR_LEN = 100

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

function validateItem(r: unknown): r is QuizResultPayload {
  if (r == null || typeof r !== 'object') return false
  const item = r as Record<string, unknown>

  if (typeof item.sessionId !== 'string' || item.sessionId.length === 0 || item.sessionId.length > MAX_STR_LEN) return false
  if (typeof item.topicId !== 'string' || !VALID_TOPIC_IDS.has(item.topicId)) return false
  if (typeof item.questionId !== 'string' || item.questionId.length === 0 || item.questionId.length > MAX_STR_LEN) return false
  if (typeof item.selected !== 'number' || !Number.isInteger(item.selected) || item.selected < 0 || item.selected > 3) return false
  if (typeof item.correct !== 'boolean') return false
  if (typeof item.difficulty !== 'string' || !VALID_DIFFICULTIES.has(item.difficulty)) return false
  if (typeof item.timestamp !== 'number' || !Number.isFinite(item.timestamp) || item.timestamp < 0) return false

  return true
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

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (body == null || typeof body !== 'object') {
    return NextResponse.json({ error: 'Request body must be an object' }, { status: 400 })
  }

  const envelope = body as Record<string, unknown>
  if (!Array.isArray(envelope.results) || envelope.results.length === 0 || envelope.results.length > 100) {
    return NextResponse.json({ error: 'results must be an array of 1-100 items' }, { status: 400 })
  }

  const validated: QuizResultPayload[] = []
  for (let i = 0; i < envelope.results.length; i++) {
    if (!validateItem(envelope.results[i])) {
      return NextResponse.json({ error: `Invalid result entry at index ${i}` }, { status: 400 })
    }
    validated.push(envelope.results[i] as QuizResultPayload)
  }

  if (process.env.DATABASE_URL) {
    try {
      const { getPrisma } = await import('@/lib/db')
      const prisma = await getPrisma()
      if (prisma) {
        await prisma.quizResult.createMany({
          data: validated.map((r) => ({
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
        return NextResponse.json(
          { synced: validated.length },
          { headers: { 'X-RateLimit-Remaining': String(remaining) } }
        )
      }
    } catch (err) {
      console.error('Failed to persist quiz results:', err)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }
  }

  return NextResponse.json(
    { synced: 0, stored: false, message: 'No database configured; results accepted but not persisted' },
    { headers: { 'X-RateLimit-Remaining': String(remaining) } }
  )
}
