'use client'

import { useUIStore } from '@/store/uiStore'
import { t } from '@/lib/i18n'

interface MisconceptionCalloutProps {
  belief: string
  correction: string
}

export default function MisconceptionCallout({ belief, correction }: MisconceptionCalloutProps) {
  const lang = useUIStore((s) => s.lang)

  return (
    <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/30 border-l-3 border-amber-500 rounded-r-lg" role="alert">
      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">
        {t('quiz.commonMistake', lang)}
      </p>
      <p className="text-xs text-amber-800 dark:text-amber-200 mb-1">
        {belief}
      </p>
      <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
        {t('quiz.actually', lang)} {correction}
      </p>
    </div>
  )
}
