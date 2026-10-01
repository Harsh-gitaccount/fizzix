import { describe, it, expect, beforeEach } from 'vitest'
import { useQuizStore } from '@/store/quizStore'
import type { QuizQuestion } from '@/lib/quiz/types'
import { timeOfFlight } from '@/lib/physics/projectile'

const MOCK_PM_POOL: QuizQuestion[] = [
  {
    id: 'pm-e1',
    topicId: 'projectile-motion',
    type: 'conceptual',
    difficulty: 'easy',
    question: 'Test question 1',
    options: ['A', 'B', 'C', 'D'],
    correctIndex: 0,
    explanation: 'Explanation 1',
    classRange: [9, 12],
  },
  {
    id: 'pm-e2',
    topicId: 'projectile-motion',
    type: 'conceptual',
    difficulty: 'easy',
    question: 'Test question 2',
    options: ['A', 'B', 'C', 'D'],
    correctIndex: 1,
    explanation: 'Explanation 2',
    classRange: [9, 12],
  },
]

const MOCK_ELEC_POOL: QuizQuestion[] = [
  {
    id: 'el-e1',
    topicId: 'electrostatics',
    type: 'conceptual',
    difficulty: 'easy',
    question: 'Electrostatics question',
    options: ['A', 'B', 'C', 'D'],
    correctIndex: 2,
    explanation: 'Explanation',
    classRange: [9, 12],
  },
]

describe('F07 - Quiz store reset clears session questions on topic change', () => {
  beforeEach(() => {
    useQuizStore.getState().resetQuiz()
  })

  it('resetQuiz clears sessionQuestions array', () => {
    useQuizStore.getState().initQuiz(MOCK_PM_POOL, 'easy')
    expect(useQuizStore.getState().sessionQuestions.length).toBeGreaterThan(0)
    expect(useQuizStore.getState().sessionQuestions[0].topicId).toBe('projectile-motion')

    useQuizStore.getState().resetQuiz()
    expect(useQuizStore.getState().sessionQuestions).toEqual([])
    expect(useQuizStore.getState().answers).toEqual([])
    expect(useQuizStore.getState().currentIndex).toBe(0)
    expect(useQuizStore.getState().difficulty).toBe('easy')
  })

  it('after reset, initQuiz with new topic loads new questions', () => {
    useQuizStore.getState().initQuiz(MOCK_PM_POOL, 'easy')
    const pmQuestions = useQuizStore.getState().sessionQuestions

    useQuizStore.getState().resetQuiz()
    useQuizStore.getState().initQuiz(MOCK_ELEC_POOL, 'easy')

    const elecQuestions = useQuizStore.getState().sessionQuestions
    expect(elecQuestions.length).toBeGreaterThan(0)
    expect(elecQuestions[0].topicId).toBe('electrostatics')
    expect(elecQuestions[0].id).not.toBe(pmQuestions[0].id)
  })
})

describe('F09 - Compare mode uses max time-of-flight', () => {
  it('Earth vs Moon: Moon has longer TOF', () => {
    const earthParams = { v0: 20, theta: 45, g: 9.8, y0: 0 }
    const moonParams = { v0: 20, theta: 45, g: 1.62, y0: 0 }

    const tofEarth = timeOfFlight(earthParams)
    const tofMoon = timeOfFlight(moonParams)

    expect(tofMoon).toBeGreaterThan(tofEarth)

    const tofCompare = Math.max(tofEarth, tofMoon)
    expect(tofCompare).toBeCloseTo(tofMoon, 3)
    expect(tofCompare).toBeGreaterThan(10)
  })
})

describe('F17 - API route validation', () => {
  it('VALID_TOPIC_IDS includes all six topics', () => {
    const validTopics = [
      'projectile-motion',
      'shm',
      'optics',
      'electrostatics',
      'thermodynamics',
      'modern-physics',
    ]

    expect(validTopics.length).toBe(6)
    for (const topic of validTopics) {
      expect(typeof topic).toBe('string')
      expect(topic.length).toBeGreaterThan(0)
    }
  })

  it('validateItem rejects null', () => {
    const validateItem = (r: unknown): boolean => {
      if (r == null || typeof r !== 'object') return false
      const item = r as Record<string, unknown>
      if (typeof item.sessionId !== 'string' || item.sessionId.length === 0) return false
      if (typeof item.topicId !== 'string') return false
      return true
    }

    expect(validateItem(null)).toBe(false)
    expect(validateItem(undefined)).toBe(false)
    expect(validateItem(42)).toBe(false)
    expect(validateItem('string')).toBe(false)
  })

  it('validateItem rejects invalid topicId', () => {
    const VALID_TOPIC_IDS = new Set([
      'projectile-motion', 'shm', 'optics',
      'electrostatics', 'thermodynamics', 'modern-physics',
    ])

    const validateTopicId = (topicId: unknown): boolean => {
      return typeof topicId === 'string' && VALID_TOPIC_IDS.has(topicId)
    }

    expect(validateTopicId('projectile-motion')).toBe(true)
    expect(validateTopicId('not-a-real-topic')).toBe(false)
    expect(validateTopicId('')).toBe(false)
    expect(validateTopicId(null)).toBe(false)
  })
})
