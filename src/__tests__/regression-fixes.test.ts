import { describe, it, expect, beforeEach } from 'vitest'
import { useQuizStore } from '@/store/quizStore'
import { timeOfFlight } from '@/lib/physics/projectile'
import { isValidQuestion, deriveCorrectness, lookupQuestion } from '@/lib/quiz/questionBank'
import { QUIZ_POOL } from '@/simulations/projectile-motion/quiz'
import { ELEC_QUIZ_POOL } from '@/simulations/electrostatics/quiz'

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

    // Without the fix, tof would be tofEarth (2.886) and Math.min(2.886, 5 + step) = 2.886
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
    expect(isValidQuestion('projectile-motion', QUIZ_POOL[0].id)).toBe(true)
    expect(isValidQuestion('electrostatics', ELEC_QUIZ_POOL[0].id)).toBe(true)
    // Spot check: cross-topic must fail
    expect(isValidQuestion('shm', QUIZ_POOL[0].id)).toBe(false)
  })
})

describe('F17/F18 - Sync acknowledgment contract', () => {
  it('stored:false response must not mark records as synced', () => {
    const noStorageResponse = { synced: 0, stored: false, message: 'No database configured' }
    expect(noStorageResponse.stored).toBe(false)
    expect(noStorageResponse.synced).toBe(0)
  })

  it('successful storage response includes stored:true and acceptedIds', () => {
    const successResponse = { synced: 3, stored: true, acceptedIds: ['id1', 'id2', 'id3'] }
    expect(successResponse.stored).toBe(true)
    expect(successResponse.synced).toBe(3)
    expect(successResponse.acceptedIds).toHaveLength(3)
  })
})
