import type { CanvasBackground } from '@/lib/physics/types'

export interface TeachingPreset {
  id: string
  label: string
  hookQuestion: string
  params: Record<string, number>
  compareParams?: Record<string, number>
  specialMode?: 'split-view' | 'ghost-trails'
  defaultLayers: string[]
  defaultTab: string
  canvasBackground: CanvasBackground
}

export const PRESETS: TeachingPreset[] = [
  {
    id: 'free-fall',
    label: 'Free Fall',
    hookQuestion: 'How fast does it get?',
    params: { v0: 0, theta: 0, g: 9.8, y0: 20 },
    defaultLayers: ['grid', 'trajectory'],
    defaultTab: 'intro',
    canvasBackground: 'default-sky',
  },
  {
    id: 'horizontal-throw',
    label: 'Horizontal Throw',
    hookQuestion: 'Does horizontal speed affect fall time?',
    params: { v0: 15, theta: 0, g: 9.8, y0: 10 },
    defaultLayers: ['grid', 'trajectory'],
    defaultTab: 'intro',
    canvasBackground: 'default-sky',
  },
  {
    id: 'high-arc',
    label: 'High Arc',
    hookQuestion: 'How does the velocity vector change during a steep throw?',
    params: { v0: 20, theta: 75, g: 9.8, y0: 0 },
    defaultLayers: ['grid', 'trajectory', 'velocity'],
    defaultTab: 'vectors',
    canvasBackground: 'default-sky',
  },
  {
    id: 'low-drive',
    label: 'Low Drive',
    hookQuestion: 'How does a low angle change the trajectory shape?',
    params: { v0: 20, theta: 15, g: 9.8, y0: 0 },
    defaultLayers: ['grid', 'trajectory', 'velocity'],
    defaultTab: 'vectors',
    canvasBackground: 'default-sky',
  },
  {
    id: 'same-time',
    label: 'Same Time?',
    hookQuestion: 'Which hits the ground first?',
    params: { v0: 0, theta: 0, g: 9.8, y0: 10 },
    compareParams: { v0: 15, theta: 0, g: 9.8, y0: 10 },
    defaultLayers: ['grid', 'trajectory'],
    defaultTab: 'compare',
    canvasBackground: 'default-sky',
  },
  {
    id: 'best-angle',
    label: 'Best Angle?',
    hookQuestion: 'What angle sends it farthest?',
    params: { v0: 20, theta: 45, g: 9.8, y0: 0 },
    specialMode: 'ghost-trails',
    defaultLayers: ['grid', 'trajectory'],
    defaultTab: 'free-play',
    canvasBackground: 'default-sky',
  },
  {
    id: 'moon-vs-earth',
    label: 'Moon vs Earth',
    hookQuestion: 'How far would this same throw go on the Moon?',
    params: { v0: 20, theta: 45, g: 9.8, y0: 0 },
    compareParams: { v0: 20, theta: 45, g: 1.62, y0: 0 },
    specialMode: 'split-view',
    defaultLayers: ['grid', 'trajectory'],
    defaultTab: 'compare',
    canvasBackground: 'default-sky',
  },
  {
    id: 'does-mass-matter',
    label: 'Does Mass Matter?',
    hookQuestion: 'Does changing the mass change the trajectory?',
    params: { v0: 20, theta: 45, g: 9.8, y0: 0 },
    compareParams: { v0: 20, theta: 45, g: 9.8, y0: 0 },
    defaultLayers: ['grid', 'trajectory'],
    defaultTab: 'compare',
    canvasBackground: 'default-sky',
  },
  {
    id: 'cricket-ball',
    label: 'Cricket Ball',
    hookQuestion: 'How long to react?',
    params: { v0: 35, theta: 30, g: 9.8, y0: 0 },
    defaultLayers: ['grid', 'trajectory'],
    defaultTab: 'free-play',
    canvasBackground: 'cricket-field',
  },
  {
    id: 'air-resistance',
    label: 'Air Resistance',
    hookQuestion: 'Does air really slow it down?',
    params: { v0: 30, theta: 45, g: 9.8, y0: 0, drag: 0 },
    compareParams: { v0: 30, theta: 45, g: 9.8, y0: 0, drag: 0.01 },
    defaultLayers: ['grid', 'trajectory'],
    defaultTab: 'compare',
    canvasBackground: 'default-sky',
  },
]

import { stateAtTime, timeOfFlight } from '@/lib/physics/projectile'
import type { GhostTrail, ProjectileParams } from '@/lib/physics/types'

export function generateGhostTrails(params: Record<string, number>): GhostTrail[] {
  const angles = [15, 30, 45, 60, 75]
  const colors = ['#EF4444', '#F97316', '#3B82F6', '#8B5CF6', '#10B981']

  return angles.map((angle, i) => {
    const p: ProjectileParams = {
      v0: params.v0 ?? 20,
      theta: angle,
      g: params.g ?? 9.8,
      y0: params.y0 ?? 0,
    }
    const tof = timeOfFlight(p)
    const points: { x: number; y: number }[] = []
    for (let t = 0; t <= tof; t += 0.1) {
      const s = stateAtTime({ ...params, theta: angle }, t)
      points.push({ x: s.x, y: s.y })
    }
    const final = stateAtTime({ ...params, theta: angle }, tof)
    points.push({ x: final.x, y: final.y })

    return {
      id: `ghost-${angle}`,
      points,
      color: colors[i],
      label: `${angle}°`,
      pinned: true,
    }
  })
}
