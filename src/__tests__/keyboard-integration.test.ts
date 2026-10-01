import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { usePlaybackStore } from '@/store/playbackStore'
import { useSimulationStore } from '@/store/simulationStore'
import type { SimulationModule } from '@/simulations/types'

const stubTopic: SimulationModule = {
  id: 'projectile-motion',
  slug: 'projectile-motion',
  name: 'Projectile Motion',
  description: '',
  classRange: '6-8',
  icon: '',
  color: '',
  stateAtTime: () => ({ t: 0, x: 0, y: 0, vx: 0, vy: 0, phase: 'ready' }),
  timeOfFlight: () => 10,
  derivedValues: () => ({}),
  trajectoryBounds: () => ({ xMin: 0, xMax: 100, yMin: 0, yMax: 100, scale: 1 }),
  defaultParams: { v0: 20, theta: 45, g: 9.8, y0: 0, drag: 0 },
  paramLimits: { v0: [0, 50], theta: [0, 90], g: [0.5, 20], y0: [0, 50], drag: [0, 0.5] },
  paramDefs: [],
  tabs: [
    { id: 'intro', labelKey: 'tab.intro' },
    { id: 'vectors', labelKey: 'tab.vectors' },
  ],
  defaultTab: 'intro',
  defaultLayers: {},
  layerDefs: [],
  presets: [],
  renderCanvas: () => {},
  computeBounds: () => ({ xMin: 0, xMax: 100, yMin: 0, yMax: 100, scale: 1 }),
  derivedValueKeys: [],
  quizPool: [],
}

function dispatchKeyOnElement(el: Element, code: string, key: string) {
  const event = new KeyboardEvent('keydown', {
    code,
    key,
    bubbles: true,
    cancelable: true,
  })
  el.dispatchEvent(event)
}

describe('keyboard integration - global hook vs composite widgets', () => {
  beforeEach(() => {
    usePlaybackStore.setState({ playbackState: 'paused', currentTime: 1.0, speedMultiplier: 1 })
    useSimulationStore.setState({
      params: { v0: 20, theta: 45, g: 9.8, y0: 0, drag: 0 },
      compareMode: false,
    })
    document.body.innerHTML = ''
  })

  it('ArrowRight inside a tablist does NOT advance simulation time', () => {
    const tablist = document.createElement('div')
    tablist.setAttribute('role', 'tablist')
    const tab = document.createElement('button')
    tab.setAttribute('role', 'tab')
    tablist.appendChild(tab)
    document.body.appendChild(tablist)

    const { unmount } = renderHook(() => useKeyboardShortcuts(stubTopic))
    dispatchKeyOnElement(tab, 'ArrowRight', 'ArrowRight')

    expect(usePlaybackStore.getState().currentTime).toBe(1.0)
    unmount()
  })

  it('ArrowDown inside a radiogroup does NOT advance simulation time', () => {
    const radiogroup = document.createElement('div')
    radiogroup.setAttribute('role', 'radiogroup')
    const radio = document.createElement('button')
    radio.setAttribute('role', 'radio')
    radiogroup.appendChild(radio)
    document.body.appendChild(radiogroup)

    const { unmount } = renderHook(() => useKeyboardShortcuts(stubTopic))
    dispatchKeyOnElement(radio, 'ArrowDown', 'ArrowDown')

    expect(usePlaybackStore.getState().currentTime).toBe(1.0)
    unmount()
  })

  it('ArrowRight inside data-keyboard-trap does NOT advance simulation time', () => {
    const trap = document.createElement('div')
    trap.setAttribute('data-keyboard-trap', '')
    const inner = document.createElement('div')
    inner.tabIndex = 0
    trap.appendChild(inner)
    document.body.appendChild(trap)

    const { unmount } = renderHook(() => useKeyboardShortcuts(stubTopic))
    dispatchKeyOnElement(inner, 'ArrowRight', 'ArrowRight')

    expect(usePlaybackStore.getState().currentTime).toBe(1.0)
    unmount()
  })

  it('ArrowRight on a plain element still advances simulation time', () => {
    const div = document.createElement('div')
    document.body.appendChild(div)

    const { unmount } = renderHook(() => useKeyboardShortcuts(stubTopic))
    dispatchKeyOnElement(div, 'ArrowRight', 'ArrowRight')

    expect(usePlaybackStore.getState().currentTime).toBeCloseTo(1.0 + 1 / 60, 5)
    unmount()
  })

  it('Space on a button inside radiogroup does NOT toggle playback', () => {
    const radiogroup = document.createElement('div')
    radiogroup.setAttribute('role', 'radiogroup')
    const btn = document.createElement('button')
    btn.setAttribute('role', 'radio')
    radiogroup.appendChild(btn)
    document.body.appendChild(radiogroup)

    const { unmount } = renderHook(() => useKeyboardShortcuts(stubTopic))
    dispatchKeyOnElement(btn, 'Space', ' ')

    expect(usePlaybackStore.getState().playbackState).toBe('paused')
    unmount()
  })

  it('defaultPrevented events are ignored by the global hook', () => {
    const div = document.createElement('div')
    document.body.appendChild(div)

    const { unmount } = renderHook(() => useKeyboardShortcuts(stubTopic))

    const event = new KeyboardEvent('keydown', {
      code: 'ArrowRight',
      key: 'ArrowRight',
      bubbles: true,
      cancelable: true,
    })
    event.preventDefault()
    div.dispatchEvent(event)

    expect(usePlaybackStore.getState().currentTime).toBe(1.0)
    unmount()
  })

  it('input elements are excluded from global shortcuts', () => {
    const input = document.createElement('input')
    document.body.appendChild(input)

    const { unmount } = renderHook(() => useKeyboardShortcuts(stubTopic))
    dispatchKeyOnElement(input, 'Space', ' ')

    expect(usePlaybackStore.getState().playbackState).toBe('paused')
    unmount()
  })
})
