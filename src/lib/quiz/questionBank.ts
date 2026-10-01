import { QUIZ_POOL } from '@/simulations/projectile-motion/quiz'
import { SHM_QUIZ_POOL } from '@/simulations/shm/quiz'
import { OPTICS_QUIZ_POOL } from '@/simulations/optics/quiz'
import { ELEC_QUIZ_POOL } from '@/simulations/electrostatics/quiz'
import { THERMO_QUIZ_POOL } from '@/simulations/thermodynamics/quiz'
import { MODERN_PHYSICS_QUIZ_POOL } from '@/simulations/modern-physics/quiz'
import type { QuizQuestion } from './types'

const POOLS: Record<string, QuizQuestion[]> = {
  'projectile-motion': QUIZ_POOL,
  'shm': SHM_QUIZ_POOL,
  'optics': OPTICS_QUIZ_POOL,
  'electrostatics': ELEC_QUIZ_POOL,
  'thermodynamics': THERMO_QUIZ_POOL,
  'modern-physics': MODERN_PHYSICS_QUIZ_POOL,
}

const questionIndex = new Map<string, QuizQuestion>()
for (const pool of Object.values(POOLS)) {
  for (const q of pool) {
    questionIndex.set(`${q.topicId}:${q.id}`, q)
  }
}

export function lookupQuestion(topicId: string, questionId: string): QuizQuestion | undefined {
  return questionIndex.get(`${topicId}:${questionId}`)
}

export function isValidQuestion(topicId: string, questionId: string): boolean {
  return questionIndex.has(`${topicId}:${questionId}`)
}

export function deriveCorrectness(topicId: string, questionId: string, selectedIndex: number): boolean | null {
  const q = lookupQuestion(topicId, questionId)
  if (!q) return null
  return q.correctIndex === selectedIndex
}
