'use client'

import { useCallback } from 'react'
import Scene3D, { type Scene3DSetup, type Scene3DBuilder } from './Scene3D'
import { createFieldView3D } from '@/lib/three/fieldView3D'
import { useUIStore } from '@/store/uiStore'
import { t } from '@/lib/i18n'

export default function Scene3DField() {
  const lang = useUIStore((s) => s.lang)
  const builder: Scene3DBuilder = useCallback((setup: Scene3DSetup) => {
    return createFieldView3D(setup)
  }, [])

  return (
    <>
      <Scene3D builder={builder} />
      <div className="absolute top-2 right-2 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-lg px-3 py-2 pointer-events-none select-none shadow-sm border border-gray-200 dark:border-slate-700">
        <p className="text-[10px] font-bold text-gray-700 dark:text-gray-300 mb-1.5">{t('legend.title', lang)}</p>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
            <span className="text-[10px] text-gray-600 dark:text-gray-400">{t('legend.positiveCharge', lang)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
            <span className="text-[10px] text-gray-600 dark:text-gray-400">{t('legend.negativeCharge', lang)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-1 rounded bg-purple-500 shrink-0" />
            <span className="text-[10px] text-gray-600 dark:text-gray-400">{t('legend.fieldLines', lang)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-amber-500 text-[10px] font-bold shrink-0">→</span>
            <span className="text-[10px] text-gray-600 dark:text-gray-400">{t('legend.coulombForce', lang)}</span>
          </div>
        </div>
      </div>
    </>
  )
}
