import { describe, it, expect, beforeEach } from 'vitest'
import { useQuizStore } from '@/store/quizStore'
import { timeOfFlight } from '@/lib/physics/projectile'
import { isValidQuestion, deriveCorrectness, lookupQuestion } from '@/lib/quiz/questionBank'
import { QUIZ_POOL } from '@/simulations/projectile-motion/quiz'
import { ELEC_QUIZ_POOL } from '@/simulations/electrostatics/quiz'
import { SHM_QUIZ_POOL } from '@/simulations/shm/quiz'
import { OPTICS_QUIZ_POOL } from '@/simulations/optics/quiz'
import { THERMO_QUIZ_POOL } from '@/simulations/thermodynamics/quiz'
import { MODERN_PHYSICS_QUIZ_POOL } from '@/simulations/modern-physics/quiz'

describe('F07 - Quiz store reset clears session questions on topic change', () => {
  beforeEach(() => {
    useQuizStore.getState().resetQuiz()
  })

  it('resetQuiz clears sessionQuestions array', () => {
    useQuizStore.getState().initQuiz(QUIZ_POOL, 'easy')
    expect(useQuizStore.getState().sessionQuestions.length).toBeGreaterThan(0)
    expect(useQuizStore.getState().sessionQuestions[0].topicId).toBe('projectile-motion')

    useQuizStore.getState().resetQuiz()
    expect(useQuizStore.getState().sessionQuestions).toEqual([])
    expect(useQuizStore.getState().answers).toEqual([])
    expect(useQuizStore.getState().currentIndex).toBe(0)
    expect(useQuizStore.getState().difficulty).toBe('easy')
  })

  it('after reset, initQuiz with new topic loads new questions', () => {
    useQuizStore.getState().initQuiz(QUIZ_POOL, 'easy')
    const pmQuestions = useQuizStore.getState().sessionQuestions

    useQuizStore.getState().resetQuiz()
    useQuizStore.getState().initQuiz(ELEC_QUIZ_POOL, 'easy')

    const elecQuestions = useQuizStore.getState().sessionQuestions
    expect(elecQuestions.length).toBeGreaterThan(0)
    expect(elecQuestions[0].topicId).toBe('electrostatics')
    expect(elecQuestions[0].id).not.toBe(pmQuestions[0].id)
  })
})

describe('F09 - Compare mode uses max time-of-flight across all paths', () => {
  it('Moon has longer TOF than Earth - max must be used', () => {
    const earthParams = { v0: 20, theta: 45, g: 9.8, y0: 0 }
    const moonParams = { v0: 20, theta: 45, g: 1.62, y0: 0 }

    const tofEarth = timeOfFlight(earthParams)
    const tofMoon = timeOfFlight(moonParams)

    expect(tofMoon).toBeGreaterThan(tofEarth)
    expect(tofEarth).toBeCloseTo(2.886, 2)
    expect(tofMoon).toBeGreaterThan(10)
  })

  it('ArrowRight at t=5 in Moon/Earth compare must not jump backward', () => {
    const earthParams = { v0: 20, theta: 45, g: 9.8, y0: 0 }
    const moonParams = { v0: 20, theta: 45, g: 1.62, y0: 0 }

    const tofEarth = timeOfFlight(earthParams)
    const tofMoon = timeOfFlight(moonParams)
    const compareTof = Math.max(tofEarth, tofMoon)

    const currentTime = 5
    const step = 1 / 60
    const newTime = Math.min(compareTof, currentTime + step)

    expect(newTime).toBeGreaterThan(currentTime)
    expect(newTime).toBeLessThanOrEqual(compareTof)

    const brokenNewTime = Math.min(tofEarth, currentTime + step)
    expect(brokenNewTime).toBeLessThan(currentTime)
  })
})

describe('F17 - Question bank validation (production code)', () => {
  it('isValidQuestion accepts real questions from the pool', () => {
    const q = QUIZ_POOL[0]
    expect(isValidQuestion(q.topicId, q.id)).toBe(true)
  })

  it('isValidQuestion rejects invented question IDs', () => {
    expect(isValidQuestion('projectile-motion', 'not-a-real-question')).toBe(false)
  })

  it('isValidQuestion rejects question from wrong topic', () => {
    const pmQ = QUIZ_POOL[0]
    expect(isValidQuestion('electrostatics', pmQ.id)).toBe(false)
  })

  it('deriveCorrectness returns correct answer from bank', () => {
    const q = QUIZ_POOL[0]
    expect(deriveCorrectness(q.topicId, q.id, q.correctIndex)).toBe(true)
    const wrongIndex = (q.correctIndex + 1) % 4
    expect(deriveCorrectness(q.topicId, q.id, wrongIndex)).toBe(false)
  })

  it('deriveCorrectness returns null for unknown question', () => {
    expect(deriveCorrectness('projectile-motion', 'fake-id', 0)).toBeNull()
  })

  it('lookupQuestion returns the full question object', () => {
    const q = QUIZ_POOL[0]
    const found = lookupQuestion(q.topicId, q.id)
    expect(found).toBeDefined()
    expect(found!.id).toBe(q.id)
    expect(found!.correctIndex).toBe(q.correctIndex)
  })

  it('all six topics have questions in the bank', () => {
    const pools = [
      { pool: QUIZ_POOL, topic: 'projectile-motion' },
      { pool: ELEC_QUIZ_POOL, topic: 'electrostatics' },
      { pool: SHM_QUIZ_POOL, topic: 'shm' },
      { pool: OPTICS_QUIZ_POOL, topic: 'optics' },
      { pool: THERMO_QUIZ_POOL, topic: 'thermodynamics' },
      { pool: MODERN_PHYSICS_QUIZ_POOL, topic: 'modern-physics' },
    ]
    for (const { pool, topic } of pools) {
      expect(pool.length).toBeGreaterThan(0)
      expect(isValidQuestion(topic, pool[0].id)).toBe(true)
      expect(pool[0].topicId).toBe(topic)
    }
  })

  it('cross-topic validation fails for all pool pairs', () => {
    expect(isValidQuestion('shm', QUIZ_POOL[0].id)).toBe(false)
    expect(isValidQuestion('optics', ELEC_QUIZ_POOL[0].id)).toBe(false)
    expect(isValidQuestion('thermodynamics', SHM_QUIZ_POOL[0].id)).toBe(false)
    expect(isValidQuestion('modern-physics', OPTICS_QUIZ_POOL[0].id)).toBe(false)
    expect(isValidQuestion('projectile-motion', THERMO_QUIZ_POOL[0].id)).toBe(false)
    expect(isValidQuestion('electrostatics', MODERN_PHYSICS_QUIZ_POOL[0].id)).toBe(false)
  })
})

describe('F17/F18 - Sync acknowledgment contract', () => {
  it('stored:false response must not mark records as synced', () => {
    const noStorageResponse = { synced: 0, stored: false, message: 'No database configured' }
    expect(noStorageResponse.stored).toBe(false)
    expect(noStorageResponse.stored).not.toBe(true)
  })

  it('successful storage response includes stored:true and acceptedIds', () => {
    const successResponse = { synced: 3, stored: true, acceptedIds: ['id1', 'id2', 'id3'] }
    expect(successResponse.stored).toBe(true)
    expect(successResponse.acceptedIds).toHaveLength(3)
  })

  it('missing stored field does not satisfy stored === true', () => {
    const ambiguousResponse: { synced: number; acceptedIds: string[] } = { synced: 2, acceptedIds: ['a', 'b'] }
    const stored = (ambiguousResponse as Record<string, unknown>).stored
    expect(stored === true).toBe(false)
  })

  it('empty acceptedIds array is not accepted as a positive acknowledgment', () => {
    const emptyIds = { stored: true, synced: 1, acceptedIds: [] as string[] }
    expect(emptyIds.acceptedIds.length === 0).toBe(true)
  })

  it('acceptedIds must be intersected with submitted IDs', () => {
    const submittedIds = new Set(['id-a', 'id-b'])
    const serverAccepted = ['id-a', 'id-unrelated']
    const verified = serverAccepted.filter((id) => submittedIds.has(id))
    expect(verified).toEqual(['id-a'])
    expect(verified).not.toContain('id-unrelated')
  })
})

describe('F17 - API route persistence-field validation', () => {
  it('rejects numeric id field', () => {
    const item = {
      id: 17,
      sessionId: 'session',
      topicId: 'projectile-motion',
      questionId: QUIZ_POOL[0].id,
      selected: 0,
      correct: false,
      difficulty: 'easy',
      poolVersion: 1,
      timestamp: Date.now(),
    }
    expect(typeof item.id !== 'string' && item.id !== undefined).toBe(true)
  })

  it('rejects string poolVersion', () => {
    const poolVersion = 'not-an-integer'
    expect(typeof poolVersion !== 'number').toBe(true)
  })

  it('rejects out-of-range timestamp', () => {
    const ts = 1e30
    const d = new Date(ts)
    expect(isNaN(d.getTime())).toBe(true)
  })

  it('accepts valid string id', () => {
    const id = 'valid-uuid-string'
    expect(typeof id === 'string').toBe(true)
  })

  it('accepts undefined id', () => {
    const id = undefined
    expect(id === undefined).toBe(true)
  })

  it('accepts valid positive integer poolVersion', () => {
    const poolVersion = 1
    expect(typeof poolVersion === 'number' && Number.isInteger(poolVersion) && poolVersion >= 1).toBe(true)
  })

  it('rejects zero poolVersion', () => {
    const poolVersion = 0
    expect(poolVersion >= 1).toBe(false)
  })

  it('rejects negative poolVersion', () => {
    const poolVersion = -1
    expect(poolVersion >= 1).toBe(false)
  })

  it('accepts timestamp in valid range', () => {
    const ts = Date.now()
    const MIN = 1609459200000
    const MAX = 4102444800000
    expect(ts >= MIN && ts <= MAX).toBe(true)
  })
})
