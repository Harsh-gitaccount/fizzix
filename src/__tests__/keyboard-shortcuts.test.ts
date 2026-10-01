import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { usePlaybackStore } from '@/store/playbackStore'
import { useSimulationStore } from '@/store/simulationStore'
import type { SimulationModule } from '@/simulations/types'

const mockTimeOfFlight = vi.fn()

const stubTopic: SimulationModule = {
  id: 'projectile-motion',
  slug: 'projectile-motion',
  name: 'Projectile Motion',
  description: '',
  classRange: '6-8',
  icon: '',
  color: '',
  stateAtTime: () => ({ t: 0, x: 0, y: 0, vx: 0, vy: 0, phase: 'ready' }),
  timeOfFlight: (params: Record<string, number>) => mockTimeOfFlight(params),
  derivedValues: () => ({}),
  trajectoryBounds: () => ({ xMin: 0, xMax: 100, yMin: 0, yMax: 100, scale: 1 }),
  defaultParams: { v0: 20, theta: 45, g: 9.8, y0: 0, drag: 0 },
  paramLimits: { v0: [0, 50], theta: [0, 90], g: [0.5, 20], y0: [0, 50], drag: [0, 0.5] },
  paramDefs: [],
  tabs: [
    { id: 'intro', labelKey: 'tab.intro' },
    { id: 'vectors', labelKey: 'tab.vectors' },
    { id: 'compare', labelKey: 'tab.compare' },
    { id: 'free-play', labelKey: 'tab.freePlay' },
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

function dispatchKey(code: string, opts: Partial<KeyboardEventInit> = {}) {
  const event = new KeyboardEvent('keydown', { code, bubbles: true, ...opts })
  window.dispatchEvent(event)
}

describe('useKeyboardShortcuts - actual hook with dispatched KeyboardEvents', () => {
  beforeEach(() => {
    usePlaybackStore.setState({
      playbackState: 'ready',
      currentTime: 0,
      speedMultiplier: 1,
    })
    useSimulationStore.setState({
      params: { v0: 20, theta: 45, g: 9.8, y0: 0, drag: 0 },
      paramsB: { v0: 20, theta: 45, g: 1.62, y0: 0, drag: 0 },
      compareMode: false,
    })
    mockTimeOfFlight.mockReset()
  })

  it('ArrowRight advances time by 1/60 in normal mode', () => {
    mockTimeOfFlight.mockReturnValue(2.886)
    usePlaybackStore.setState({ currentTime: 0, playbackState: 'paused' })

    const { unmount } = renderHook(() => useKeyboardShortcuts(stubTopic))
    dispatchKey('ArrowRight')

    const newTime = usePlaybackStore.getState().currentTime
    expect(newTime).toBeCloseTo(1 / 60, 5)
    unmount()
  })

  it('ArrowRight at t=5 in compare mode uses max TOF and does not jump backward', () => {
    const earthTOF = 2.886
    const moonTOF = 17.46

    mockTimeOfFlight.mockImplementation((params: Record<string, number>) => {
      return params.g < 5 ? moonTOF : earthTOF
    })

    useSimulationStore.setState({ compareMode: true })
    usePlaybackStore.setState({ currentTime: 5, playbackState: 'paused' })

    const { unmount } = renderHook(() => useKeyboardShortcuts(stubTopic))
    dispatchKey('ArrowRight')

    const newTime = usePlaybackStore.getState().currentTime
    expect(newTime).toBeGreaterThan(5)
    expect(newTime).toBeCloseTo(5 + 1 / 60, 5)
    unmount()
  })

  it('ArrowRight at t=5 without compare mode clamps to Earth TOF', () => {
    const earthTOF = 2.886
    mockTimeOfFlight.mockReturnValue(earthTOF)

    useSimulationStore.setState({ compareMode: false })
    usePlaybackStore.setState({ currentTime: 5, playbackState: 'paused' })

    const { unmount } = renderHook(() => useKeyboardShortcuts(stubTopic))
    dispatchKey('ArrowRight')

    const newTime = usePlaybackStore.getState().currentTime
    expect(newTime).toBeLessThanOrEqual(earthTOF)
    unmount()
  })

  it('Space toggles play/pause', () => {
    mockTimeOfFlight.mockReturnValue(2.886)
    usePlaybackStore.setState({ playbackState: 'paused' })

    const { unmount } = renderHook(() => useKeyboardShortcuts(stubTopic))
    dispatchKey('Space')

    expect(usePlaybackStore.getState().playbackState).toBe('playing')

    dispatchKey('Space')
    expect(usePlaybackStore.getState().playbackState).toBe('paused')
    unmount()
  })

  it('Escape resets to time 0 and ready state', () => {
    mockTimeOfFlight.mockReturnValue(2.886)
    usePlaybackStore.setState({ currentTime: 1.5, playbackState: 'playing' })

    const { unmount } = renderHook(() => useKeyboardShortcuts(stubTopic))
    dispatchKey('Escape')

    expect(usePlaybackStore.getState().currentTime).toBe(0)
    expect(usePlaybackStore.getState().playbackState).toBe('ready')
    unmount()
  })

  it('ArrowLeft steps backward by 1/60', () => {
    mockTimeOfFlight.mockReturnValue(2.886)
    usePlaybackStore.setState({ currentTime: 1.0, playbackState: 'paused' })

    const { unmount } = renderHook(() => useKeyboardShortcuts(stubTopic))
    dispatchKey('ArrowLeft')

    expect(usePlaybackStore.getState().currentTime).toBeCloseTo(1.0 - 1 / 60, 5)
    unmount()
  })

  it('ArrowLeft does not go below 0', () => {
    mockTimeOfFlight.mockReturnValue(2.886)
    usePlaybackStore.setState({ currentTime: 0, playbackState: 'paused' })

    const { unmount } = renderHook(() => useKeyboardShortcuts(stubTopic))
    dispatchKey('ArrowLeft')

    expect(usePlaybackStore.getState().currentTime).toBe(0)
    unmount()
  })

  it('Shift+ArrowRight steps by 0.5 seconds', () => {
    mockTimeOfFlight.mockReturnValue(10)
    usePlaybackStore.setState({ currentTime: 1.0, playbackState: 'paused' })

    const { unmount } = renderHook(() => useKeyboardShortcuts(stubTopic))
    dispatchKey('ArrowRight', { shiftKey: true })

    expect(usePlaybackStore.getState().currentTime).toBeCloseTo(1.5, 5)
    unmount()
  })

  it('Equal key increases speed multiplier', () => {
    mockTimeOfFlight.mockReturnValue(2.886)
    usePlaybackStore.setState({ speedMultiplier: 1 })

    const { unmount } = renderHook(() => useKeyboardShortcuts(stubTopic))
    dispatchKey('Equal')

    expect(usePlaybackStore.getState().speedMultiplier).toBe(2)
    unmount()
  })

  it('Minus key decreases speed multiplier', () => {
    mockTimeOfFlight.mockReturnValue(2.886)
    usePlaybackStore.setState({ speedMultiplier: 1 })

    const { unmount } = renderHook(() => useKeyboardShortcuts(stubTopic))
    dispatchKey('Minus')

    expect(usePlaybackStore.getState().speedMultiplier).toBe(0.5)
    unmount()
  })

  it('sets landed state when ArrowRight reaches TOF', () => {
    mockTimeOfFlight.mockReturnValue(2.886)
    usePlaybackStore.setState({ currentTime: 2.886 - 0.001, playbackState: 'paused' })

    const { unmount } = renderHook(() => useKeyboardShortcuts(stubTopic))
    dispatchKey('ArrowRight')

    expect(usePlaybackStore.getState().playbackState).toBe('landed')
    unmount()
  })
})
