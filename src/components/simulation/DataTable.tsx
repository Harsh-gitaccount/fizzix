'use client'

import { useMemo } from 'react'
import { useSimulationStore } from '@/store/simulationStore'
import { useUIStore } from '@/store/uiStore'
import { useTopic } from '@/simulations/TopicContext'
import { showToast } from '@/components/ui/Toast'
import { t } from '@/lib/i18n'

interface Row {
  t: number
  x: number
  y: number
  vx: number
  vy: number
  speed: number
}

function generateRows(
  stateAtTime: (params: Record<string, number>, t: number) => { t: number; x: number; y: number; vx: number; vy: number },
  timeOfFlight: (params: Record<string, number>) => number,
  params: Record<string, number>,
): Row[] {
  const tof = timeOfFlight(params)
  if (tof <= 0) return []

  const steps = Math.min(Math.max(Math.ceil(tof / 0.05), 10), 500)
  const dt = tof / steps
  const rows: Row[] = []

  for (let i = 0; i <= steps; i++) {
    const t = Math.min(i * dt, tof)
    const s = stateAtTime(params, t)
    rows.push({
      t: s.t,
      x: s.x,
      y: s.y,
      vx: s.vx,
      vy: s.vy,
      speed: Math.sqrt(s.vx * s.vx + s.vy * s.vy),
    })
  }

  return rows
}

function toCSV(rows: Row[]): string {
  const header = 'Time (s),X (m),Y (m),Vx (m/s),Vy (m/s),Speed (m/s)'
  const lines = rows.map(
    (r) =>
      `${r.t.toFixed(4)},${r.x.toFixed(4)},${r.y.toFixed(4)},${r.vx.toFixed(4)},${r.vy.toFixed(4)},${r.speed.toFixed(4)}`
  )
  return header + '\n' + lines.join('\n')
}

function downloadCSV(rows: Row[]) {
  const csv = toCSV(rows)
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
  return n.toFixed(2)
}

export default function DataTable() {
  const topic = useTopic()
  const params = useSimulationStore((s) => s.params)
  const lang = useUIStore((s) => s.lang)
  const rows = useMemo(
    () => generateRows(topic.stateAtTime, topic.timeOfFlight, params),
    [topic, params]
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
          onClick={() => downloadCSV(rows)}
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
              <th className="px-2 py-1.5 text-right font-bold text-gray-600 dark:text-gray-400">x (m)</th>
              <th className="px-2 py-1.5 text-right font-bold text-gray-600 dark:text-gray-400">y (m)</th>
              <th className="px-2 py-1.5 text-right font-bold text-gray-600 dark:text-gray-400">v<sub>x</sub> (m/s)</th>
              <th className="px-2 py-1.5 text-right font-bold text-gray-600 dark:text-gray-400">v<sub>y</sub> (m/s)</th>
              <th className="px-2 py-1.5 text-right font-bold text-gray-600 dark:text-gray-400">|v| (m/s)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={i}
                className={i % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-gray-50/50 dark:bg-slate-800/50'}
              >
                <td className="px-2 py-1 text-gray-900 dark:text-gray-100">{fmt(r.t)}</td>
                <td className="px-2 py-1 text-right text-gray-900 dark:text-gray-100">{fmt(r.x)}</td>
                <td className="px-2 py-1 text-right text-gray-900 dark:text-gray-100">{fmt(r.y)}</td>
                <td className="px-2 py-1 text-right text-gray-900 dark:text-gray-100">{fmt(r.vx)}</td>
                <td className="px-2 py-1 text-right text-gray-900 dark:text-gray-100">{fmt(r.vy)}</td>
                <td className="px-2 py-1 text-right text-gray-900 dark:text-gray-100">{fmt(r.speed)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
