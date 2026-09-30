'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuizStore } from '@/store/quizStore'
import { useUIStore } from '@/store/uiStore'
import { useSimulationStore } from '@/store/simulationStore'
import { usePlaybackStore } from '@/store/playbackStore'
import { useTopic } from '@/simulations/TopicContext'
import type { GhostTrail } from '@/lib/physics/types'
import type { ShowMeConfig } from '@/lib/quiz/types'
import { t } from '@/lib/i18n'
import MisconceptionCallout from './MisconceptionCallout'

const DIFFICULTY_COLORS = {
  easy: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  medium: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  hard: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D']

const GHOST_COLORS = ['#EF4444', '#F97316', '#3B82F6', '#8B5CF6', '#10B981', '#EC4899', '#14B8A6']

function generateGhostTrailsForAngles(
  stateAtTimeFn: (params: Record<string, number>, t: number) => { x: number; y: number },
  timeOfFlightFn: (params: Record<string, number>) => number,
  baseParams: Record<string, number>,
  angles: number[],
): GhostTrail[] {
  return angles.map((angle, i) => {
    const p = { ...baseParams, theta: angle }
    const tof = timeOfFlightFn(p)
    const points: { x: number; y: number }[] = []
    for (let t = 0; t <= tof; t += 0.1) {
      const s = stateAtTimeFn(p, t)
      points.push({ x: s.x, y: s.y })
    }
    const final = stateAtTimeFn(p, tof)
    points.push({ x: final.x, y: final.y })
    return {
      id: `quiz-ghost-${angle}`,
      points,
      color: GHOST_COLORS[i % GHOST_COLORS.length],
      label: `${angle}°`,
      pinned: true,
    }
  })
}

export default function QuizPanel() {
  const topic = useTopic()
  const {
    currentIndex,
    answers,
    difficulty,
    sessionQuestions,
    completed,
    initQuiz,
    submitAnswer,
    nextQuestion,
    resetQuiz,
  } = useQuizStore()

  const lang = useUIStore((s) => s.lang)
  const setSimQuizMode = useUIStore((s) => s.setSimQuizMode)
  const setActiveTab = useUIStore((s) => s.setActiveTab)
  const setActiveLayers = useUIStore((s) => s.setActiveLayers)
  const setParams = useSimulationStore((s) => s.setParams)
  const setCompareMode = useSimulationStore((s) => s.setCompareMode)
  const addGhostTrail = useSimulationStore((s) => s.addGhostTrail)
  const clearGhostTrails = useSimulationStore((s) => s.clearGhostTrails)
  const setPlaybackState = usePlaybackStore((s) => s.setPlaybackState)
  const setCurrentTime = usePlaybackStore((s) => s.setCurrentTime)

  const [selected, setSelected] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)

  useEffect(() => {
    if (sessionQuestions.length === 0 && topic.quizPool.length > 0) {
      initQuiz(topic.quizPool, 'easy')
    }
  }, [sessionQuestions.length, initQuiz, topic.quizPool])

  useEffect(() => {
    const existing = answers[currentIndex]
    if (existing) {
      setSelected(existing.selectedIndex)
      setShowResult(true)
    } else {
      setSelected(null)
      setShowResult(false)
    }
  }, [currentIndex, answers])

  const currentQuestion = sessionQuestions[currentIndex]
  const currentAnswer = answers[currentIndex]

  const handleSelect = useCallback(
    (idx: number) => {
      if (showResult) return
      setSelected(idx)
    },
    [showResult]
  )

  const handleSubmit = useCallback(() => {
    if (selected === null) return
    submitAnswer(selected)
    setShowResult(true)
  }, [selected, submitAnswer])

  const handleNext = useCallback(() => {
    nextQuestion()
  }, [nextQuestion])

  const handleShowMe = useCallback(() => {
    const config: ShowMeConfig | undefined = currentQuestion?.showMe
    if (!config) return

    setParams(config.params)
    setPlaybackState('ready')
    setCurrentTime(0)
    setActiveTab(config.tab)

    const layerMap: Record<string, boolean> = {}
    for (const ld of topic.layerDefs) layerMap[ld.key] = false
    for (const l of config.layers) layerMap[l] = true
    setActiveLayers(layerMap)

    if (config.compareParams) {
      setCompareMode(true)
      useSimulationStore.setState({ paramsB: { ...config.compareParams } })
    } else {
      setCompareMode(false)
    }

    clearGhostTrails()
    if (config.ghostAngles) {
      const ghosts = generateGhostTrailsForAngles(topic.stateAtTime, topic.timeOfFlight, config.params, config.ghostAngles)
      ghosts.forEach((g) => addGhostTrail(g))
    }

    if (config.autoPlay) {
      setTimeout(() => setPlaybackState('playing'), 300)
    }

    const hint = lang === 'hi' && config.hintHi ? config.hintHi : config.hint
    useUIStore.setState({ showMeHint: hint })
    setSimQuizMode('sim')
  }, [currentQuestion, topic, lang, setParams, setPlaybackState, setCurrentTime, setActiveTab, setActiveLayers, setCompareMode, clearGhostTrails, addGhostTrail, setSimQuizMode])

  const handleRestart = useCallback(() => {
    resetQuiz()
    initQuiz(topic.quizPool, 'easy')
  }, [resetQuiz, initQuiz, topic.quizPool])

  if (!currentQuestion) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-4 bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-700">
        <p className="text-sm text-gray-500">{t('quiz.loading', lang)}</p>
      </div>
    )
  }

  if (completed) {
    const correct = answers.filter((a) => a.correct).length
    const total = answers.length
    const pct = Math.round((correct / total) * 100)

    return (
      <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-700 overflow-y-auto">
        <div className="p-6 flex-1 flex flex-col items-center justify-center text-center">
          <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
            {correct}/{total}
          </div>
          <p className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">
            {pct >= 75 ? t('quiz.greatJob', lang) : pct >= 50 ? t('quiz.goodEffort', lang) : t('quiz.keepPracticing', lang)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            {pct}% {t('quiz.percentCorrect', lang)}
          </p>
          <button
            onClick={handleRestart}
            className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            {t('quiz.tryAgain', lang)}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-700 overflow-y-auto">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            {t('quiz.question', lang)} {currentIndex + 1} {t('quiz.of', lang)} {sessionQuestions.length}
          </span>
          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${DIFFICULTY_COLORS[difficulty]}`}>
            {lang === 'hi' ? (difficulty === 'easy' ? 'आसान' : difficulty === 'medium' ? 'मध्यम' : 'कठिन') : difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-gray-200 dark:bg-slate-700 rounded-full">
          <div
            className="h-1 bg-blue-600 rounded-full transition-all"
            style={{ width: `${((currentIndex + (showResult ? 1 : 0)) / sessionQuestions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="p-4 flex-1">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4 leading-relaxed">
          {currentQuestion.question}
        </p>

        {/* Options */}
        <div className="space-y-2">
          {currentQuestion.options.map((opt, idx) => {
            let optClass = 'border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-800'
            if (showResult) {
              if (idx === currentQuestion.correctIndex) {
                optClass = 'border-green-500 bg-green-50 dark:bg-green-900/30'
              } else if (idx === selected && idx !== currentQuestion.correctIndex) {
                optClass = 'border-red-500 bg-red-50 dark:bg-red-900/30'
              }
            } else if (idx === selected) {
              optClass = 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                disabled={showResult}
                className={`w-full flex items-start gap-3 p-3 rounded-lg border-2 transition-colors text-left ${optClass} ${
                  !showResult ? 'hover:border-blue-300 dark:hover:border-blue-500 cursor-pointer' : ''
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    showResult && idx === currentQuestion.correctIndex
                      ? 'border-green-500 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-400'
                      : 'border-gray-300 dark:border-slate-500 text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {OPTION_LETTERS[idx]}
                </span>
                <span className="text-sm text-gray-700 dark:text-gray-300">{opt}</span>
              </button>
            )
          })}
        </div>

        {/* Result feedback */}
        {showResult && currentAnswer && (
          <div className="mt-4">
            <div
              className={`p-3 rounded-lg text-xs ${
                currentAnswer.correct
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'
              }`}
            >
              <p className="font-semibold mb-1">
                {currentAnswer.correct ? t('quiz.correct', lang) : t('quiz.incorrect', lang)}
              </p>
              <p>{currentQuestion.explanation}</p>
            </div>

            {/* Solution steps for calculation questions */}
            {currentQuestion.solutionSteps && (
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2">
                  {t('quiz.stepByStep', lang)}
                </p>
                <ol className="space-y-1">
                  {currentQuestion.solutionSteps.map((step, i) => (
                    <li key={i} className="text-xs text-blue-800 dark:text-blue-300 flex gap-2">
                      <span className="text-blue-400 dark:text-blue-500 font-bold shrink-0">{i + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Misconception callout */}
            {!currentAnswer.correct &&
              currentQuestion.misconception &&
              currentAnswer.selectedIndex === currentQuestion.misconception.wrongIndex && (
                <MisconceptionCallout
                  belief={currentQuestion.misconception.belief}
                  correction={currentQuestion.misconception.correction}
                />
              )}

            {/* Actions */}
            <div className="flex gap-2 mt-3">
              {currentQuestion.showMe && (
                <button
                  onClick={handleShowMe}
                  className="px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                >
                  {t('quiz.showMe', lang)}
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors ml-auto"
              >
                {currentIndex < sessionQuestions.length - 1 ? t('quiz.next', lang) : t('quiz.seeResults', lang)}
              </button>
            </div>
          </div>
        )}

        {/* Submit button */}
        {!showResult && (
          <button
            onClick={handleSubmit}
            disabled={selected === null}
            className={`mt-4 w-full py-2 text-sm font-semibold rounded-lg transition-colors ${
              selected !== null
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-200 dark:bg-slate-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            }`}
          >
            {t('quiz.checkAnswer', lang)}
          </button>
        )}
      </div>
    </div>
  )
}
