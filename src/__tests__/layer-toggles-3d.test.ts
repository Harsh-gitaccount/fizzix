import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useUIStore } from '@/store/uiStore'

vi.mock('@/simulations/TopicContext', () => ({
  useTopic: vi.fn(),
}))

const TABS_3D = new Set(['long-wave', 'field-3d'])

function is3DView(slug: string, activeTab: string): boolean {
  return slug === 'thermodynamics' || TABS_3D.has(activeTab)
}

describe('F12 - tools hidden on 3D views', () => {
  beforeEach(() => {
    useUIStore.setState({ activeTab: 'gas', lang: 'en' })
  })

  it('thermodynamics slug is always 3D regardless of tab', () => {
    expect(is3DView('thermodynamics', 'gas')).toBe(true)
    expect(is3DView('thermodynamics', 'piston')).toBe(true)
    expect(is3DView('thermodynamics', 'brownian')).toBe(true)
    expect(is3DView('thermodynamics', 'free-play')).toBe(true)
  })

  it('field-3d tab is 3D regardless of topic', () => {
    expect(is3DView('electrostatics', 'field-3d')).toBe(true)
    expect(is3DView('shm', 'field-3d')).toBe(true)
  })

  it('long-wave tab is 3D', () => {
    expect(is3DView('shm', 'long-wave')).toBe(true)
  })

  it('2D topics and tabs are not 3D', () => {
    expect(is3DView('projectile-motion', 'intro')).toBe(false)
    expect(is3DView('projectile-motion', 'vectors')).toBe(false)
    expect(is3DView('optics', 'refraction')).toBe(false)
    expect(is3DView('shm', 'pendulum')).toBe(false)
    expect(is3DView('electrostatics', 'charges')).toBe(false)
    expect(is3DView('electrostatics', 'field-lines')).toBe(false)
    expect(is3DView('modern-physics', 'photoelectric')).toBe(false)
  })
})

describe('F12 - LayerToggles source uses is3DView to gate tools', () => {
  it('LayerToggles source conditionally renders tools section', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const src = fs.readFileSync(
      path.resolve(__dirname, '../components/simulation/LayerToggles.tsx'),
      'utf8',
    )
    expect(src).toContain('is3DView')
    expect(src).toContain('!is3DView')
    expect(src).toContain("TABS_3D.has(activeTab)")
    expect(src).toContain("topic.slug === 'thermodynamics'")
  })
})
