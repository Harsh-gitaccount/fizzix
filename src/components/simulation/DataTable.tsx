'use client'

import { useMemo } from 'react'
import { useSimulationStore } from '@/store/simulationStore'
import { useUIStore } from '@/store/uiStore'
import { useTopic } from '@/simulations/TopicContext'
import { showToast } from '@/components/ui/Toast'
import { t } from '@/lib/i18n'
import type { PhysicsValue } from '@/lib/physics/types'
import type { SimulationModule } from '@/simulations/types'

interface DerivedRow {
  t: number
  values: Record<string, PhysicsValue>
}

function generateRows(
  topic: SimulationModule,
  params: Record<string, number>,
): DerivedRow[] {
  const tof = topic.timeOfFlight(params)
  if (tof <= 0) return []

  const steps = Math.min(Math.max(Math.ceil(tof / 0.05), 10), 500)
  const dt = tof / steps
  const rows: DerivedRow[] = []

  for (let i = 0; i <= steps; i++) {
    const time = Math.min(i * dt, tof)
    const state = topic.stateAtTime(params, time)
    const values = topic.derivedValues(params, state)
    rows.push({ t: state.t, values })
  }

  return rows
}

function getColumns(rows: DerivedRow[], keys: string[]): { key: string; label: string; unit: string }[] {
  if (rows.length === 0) return []
  const first = rows[0].values
  return keys
    .filter((k) => k in first && Number.isFinite(first[k].value))
    .map((k) => ({
      key: k,
      label: first[k].symbol || first[k].label,
      unit: first[k].unit,
    }))
}

function toCSV(rows: DerivedRow[], columns: { key: string; label: string; unit: string }[]): string {
  const header = ['Time (s)', ...columns.map((c) => `${c.label} (${c.unit})`)].join(',')
  const lines = rows.map((r) =>
    [r.t.toFixed(4), ...columns.map((c) => {
      const v = r.values[c.key]
      return v ? v.value.toFixed(4) : ''
    })].join(',')
  )
  return header + '\n' + lines.join('\n')
}

function downloadCSV(rows: DerivedRow[], columns: { key: string; label: string; unit: string }[]) {
  const csv = toCSV(rows, columns)
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `fizzix-data-${Date.now()}.csv`
  a.click()
  URL.revokeObjectURL(url)
  showToast('CSV downloaded', '✓')
}

function fmt(n: number): string {
  return Number.isFinite(n) ? n.toFixed(2) : '-'
}

export default function DataTable() {
  const topic = useTopic()
  const params = useSimulationStore((s) => s.params)
  const lang = useUIStore((s) => s.lang)
  const rows = useMemo(
    () => generateRows(topic, params),
    [topic, params]
  )
  const columns = useMemo(
    () => getColumns(rows, topic.derivedValueKeys),
    [rows, topic.derivedValueKeys]
  )

  if (rows.length === 0) {
    return (
      <div className="p-4 text-sm text-gray-500 dark:text-gray-400">
        {t('data.noData', lang)}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-slate-700">
        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
          {t('data.header', lang)} ({rows.length} {t('data.points', lang)})
        </span>
        <button
          onClick={() => downloadCSV(rows, columns)}
          className="px-3 py-1 text-[11px] font-bold rounded bg-blue-600 hover:bg-blue-700 text-white"
        >
          {t('data.export', lang)}
        </button>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs tabular-nums">
          <thead className="sticky top-0 bg-gray-50 dark:bg-slate-800">
            <tr>
              <th className="px-2 py-1.5 text-left font-bold text-gray-600 dark:text-gray-400">t (s)</th>
              {columns.map((c) => (
                <th key={c.key} className="px-2 py-1.5 text-right font-bold text-gray-600 dark:text-gray-400">
                  {c.label}{c.unit ? ` (${c.unit})` : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={i}
                className={i % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-gray-50/50 dark:bg-slate-800/50'}
              >
                <td className="px-2 py-1 text-gray-900 dark:text-gray-100">{fmt(r.t)}</td>
                {columns.map((c) => (
                  <td key={c.key} className="px-2 py-1 text-right text-gray-900 dark:text-gray-100">
                    {fmt(r.values[c.key]?.value ?? NaN)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
