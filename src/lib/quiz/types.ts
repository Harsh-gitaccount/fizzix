export interface ShowMeConfig {
  params: Record<string, number>
  compareParams?: Record<string, number>
  tab: string
  layers: string[]
  ghostAngles?: number[]
  hint: string
  hintHi?: string
  autoPlay?: boolean
}

export interface QuizQuestion {
  id: string
  topicId: string
  type: 'conceptual' | 'prediction' | 'comparison' | 'calculation' | 'edge-case'
  question: string
  options: [string, string, string, string]
  correctIndex: 0 | 1 | 2 | 3
  explanation: string
  solutionSteps?: string[]
  misconception?: {
    wrongIndex: number
    belief: string
    correction: string
  }
  showMe?: ShowMeConfig
  linkedPresetId?: string
  difficulty: 'easy' | 'medium' | 'hard'
  classRange: [number, number]
}

export interface QuizState {
  currentIndex: number
  answers: Array<{
    questionId: string
    selectedIndex: number
    correct: boolean
  }>
  difficulty: 'easy' | 'medium' | 'hard'
  sessionQuestions: QuizQuestion[]
  streak: number
  completed: boolean
}
