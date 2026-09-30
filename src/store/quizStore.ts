import { create } from 'zustand'
import type { QuizQuestion, QuizState } from '@/lib/quiz/types'
import { saveQuizResult } from '@/lib/quiz/offlineStorage'
import { trackEvent } from '@/lib/analytics'

interface QuizStore extends QuizState {
  initQuiz: (pool: QuizQuestion[], startDifficulty: 'easy' | 'medium' | 'hard') => void
  submitAnswer: (selectedIndex: number) => void
  nextQuestion: () => void
  resetQuiz: () => void
}

function pickSessionQuestions(
  pool: QuizQuestion[],
  startDifficulty: 'easy' | 'medium' | 'hard',
  count: number
): QuizQuestion[] {
  const easy = pool.filter((q) => q.difficulty === 'easy')
  const medium = pool.filter((q) => q.difficulty === 'medium')
  const hard = pool.filter((q) => q.difficulty === 'hard')

  const buckets = { easy, medium, hard }
  const picked: QuizQuestion[] = []
  const used = new Set<string>()
  let difficulty = startDifficulty

  for (let i = 0; i < count; i++) {
    const bucket = buckets[difficulty].filter((q) => !used.has(q.id))
    if (bucket.length > 0) {
      const idx = Math.floor(Math.random() * bucket.length)
      picked.push(bucket[idx])
      used.add(bucket[idx].id)
    } else {
      const fallback = pool.filter((q) => !used.has(q.id))
      if (fallback.length > 0) {
        const idx = Math.floor(Math.random() * fallback.length)
        picked.push(fallback[idx])
        used.add(fallback[idx].id)
      }
    }

    // Simple progression preview: alternate difficulties for initial pick
    // Actual adaptive logic happens in submitAnswer
    if (i === 1 && difficulty === 'easy') difficulty = 'medium'
    else if (i === 3 && difficulty === 'medium') difficulty = 'hard'
  }

  return picked
}

export const useQuizStore = create<QuizStore>((set, get) => ({
  currentIndex: 0,
  answers: [],
  difficulty: 'easy',
  sessionQuestions: [],
  streak: 0,
  completed: false,

  initQuiz: (pool, startDifficulty) => {
    const questions = pickSessionQuestions(pool, startDifficulty, 8)
    set({
      currentIndex: 0,
      answers: [],
      difficulty: startDifficulty,
      sessionQuestions: questions,
      streak: 0,
      completed: false,
    })
  },

  submitAnswer: (selectedIndex) => {
    const s = get()
    if (s.answers[s.currentIndex]) return
    const q = s.sessionQuestions[s.currentIndex]
    if (!q) return

    const correct = selectedIndex === q.correctIndex
    const newStreak = correct ? s.streak + 1 : 0
    let newDifficulty = s.difficulty

    if (correct && newStreak >= 2) {
      if (s.difficulty === 'easy') newDifficulty = 'medium'
      else if (s.difficulty === 'medium') newDifficulty = 'hard'
    }

    const wrongStreak = s.answers.length > 0 && !correct && !s.answers[s.answers.length - 1]?.correct
    if (wrongStreak) {
      if (s.difficulty === 'hard') newDifficulty = 'medium'
      else if (s.difficulty === 'medium') newDifficulty = 'easy'
    }

    set({
      answers: [
        ...s.answers,
        { questionId: q.id, selectedIndex, correct },
      ],
      streak: newStreak,
      difficulty: newDifficulty,
    })

    saveQuizResult(q.topicId, q.id, selectedIndex, correct, s.difficulty)
    trackEvent('Quiz Answer', { topic: q.topicId, correct, difficulty: s.difficulty })
  },

  nextQuestion: () => {
    const s = get()
    if (s.currentIndex >= s.sessionQuestions.length - 1) {
      set({ completed: true })
      const correct = s.answers.filter((a) => a.correct).length
      trackEvent('Quiz Complete', {
        topic: s.sessionQuestions[0]?.topicId ?? 'unknown',
        score: correct,
      })
    } else {
      set({ currentIndex: s.currentIndex + 1 })
    }
  },

  resetQuiz: () => {
    set({
      currentIndex: 0,
      answers: [],
      streak: 0,
      completed: false,
    })
  },
}))
