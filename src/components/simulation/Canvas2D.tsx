'use client'

import { useRef, useEffect, useCallback } from 'react'
import { useSimulationStore } from '@/store/simulationStore'
import { usePlaybackStore } from '@/store/playbackStore'
import { useUIStore } from '@/store/uiStore'
import { useToolStore } from '@/store/toolStore'
import { getCanvasTransforms } from '@/lib/canvas/renderer2d'
import { hitTestRulerHandle, hitTestProtractorHandle } from '@/lib/canvas/measurementTools'
import { useTopic } from '@/simulations/TopicContext'

export default function Canvas2D() {
  const topic = useTopic()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const liveRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const prevVyRef = useRef<number | null>(null)
  const params = useSimulationStore((s) => s.params)
  const compareMode = useSimulationStore((s) => s.compareMode)
  const paramsB = useSimulationStore((s) => s.paramsB)
  const ghostTrails = useSimulationStore((s) => s.ghostTrails)
  const canvasBackground = useSimulationStore((s) => s.canvasBackground)
  const playbackState = usePlaybackStore((s) => s.playbackState)
  const currentTime = usePlaybackStore((s) => s.currentTime)
  const speedMultiplier = usePlaybackStore((s) => s.speedMultiplier)
  const pauseAtKeyPoints = usePlaybackStore((s) => s.pauseAtKeyPoints)
  const setCurrentTime = usePlaybackStore((s) => s.setCurrentTime)
  const setPlaybackState = usePlaybackStore((s) => s.setPlaybackState)
  const activeLayers = useUIStore((s) => s.activeLayers)
  const activeTab = useUIStore((s) => s.activeTab)
  const lang = useUIStore((s) => s.lang)
  const activeTools = useUIStore((s) => s.activeTools)
  const ruler = useToolStore((s) => s.ruler)
  const protractor = useToolStore((s) => s.protractor)
  const dragTarget = useToolStore((s) => s.dragTarget)
  const dragOffset = useToolStore((s) => s.dragOffset)
  const setRuler = useToolStore((s) => s.setRuler)
  const setProtractor = useToolStore((s) => s.setProtractor)
  const startDrag = useToolStore((s) => s.startDrag)
  const stopDrag = useToolStore((s) => s.stopDrag)

  const isDark =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const dpr = window.devicePixelRatio || 1
    const rect = container.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`
  }, [])

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const bounds = topic.computeBounds(
      params,
      compareMode,
      paramsB,
      ghostTrails
    )

    const showVectors = activeTab === 'vectors' || activeTab === 'free-play'

    topic.renderCanvas(ctx, canvas, {
      params,
      currentTime,
      bounds,
      activeLayers: {
        ...activeLayers,
        velocity: activeLayers.velocity && showVectors,
        acceleration: activeLayers.acceleration && showVectors,
        components: activeLayers.components && showVectors,
      },
      isDark,
      background: canvasBackground,
      ghostTrails,
      compareMode: compareMode && (activeTab === 'compare' || activeTab === 'free-play' || activeTab === 'pendulum' || activeTab === 'spring'),
      paramsB,
      dragHandles: activeTab === 'free-play'
        ? { angleArc: true, speedArrow: true }
        : undefined,
      lang,
      tools: {
        ruler: activeTools.ruler ? ruler : null,
        protractor: activeTools.protractor ? protractor : null,
      },
    })
  }, [topic, params, currentTime, activeLayers, isDark, compareMode, paramsB, ghostTrails, activeTab, canvasBackground, lang, activeTools, ruler, protractor])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const ro = new ResizeObserver(() => {
      resizeCanvas()
      render()
    })
    ro.observe(container)
    resizeCanvas()
    return () => ro.disconnect()
  }, [resizeCanvas, render])

  useEffect(() => {
    render()
  }, [render])

  // Animation loop
  useEffect(() => {
    if (playbackState !== 'playing') return

    const tofA = topic.timeOfFlight(params)
    const tof = compareMode ? Math.max(tofA, topic.timeOfFlight(paramsB)) : tofA

    lastTimeRef.current = performance.now()
    prevVyRef.current = null

    const animate = (now: number) => {
      const deltaReal = Math.min(now - lastTimeRef.current, 33) / 1000
      lastTimeRef.current = now

      const curT = usePlaybackStore.getState().currentTime
      const newTime = curT + deltaReal * speedMultiplier
      if (newTime >= tof) {
        setCurrentTime(tof)
        setPlaybackState('landed')
        return
      }

      if (pauseAtKeyPoints) {
        const st = topic.stateAtTime(params, newTime)
        if (prevVyRef.current !== null && prevVyRef.current > 0 && st.vy <= 0) {
          setCurrentTime(newTime)
          setPlaybackState('paused')
          prevVyRef.current = st.vy
          return
        }
        prevVyRef.current = st.vy
      }

      setCurrentTime(newTime)
      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [playbackState, params, speedMultiplier, pauseAtKeyPoints, setCurrentTime, setPlaybackState, topic, compareMode, paramsB])

  // Aria-live updates
  useEffect(() => {
    if (playbackState !== 'playing') {
      const state = topic.stateAtTime(params, currentTime)
      const speed = Math.sqrt(state.vx * state.vx + state.vy * state.vy)
      if (liveRef.current) {
        liveRef.current.textContent = `Time: ${state.t.toFixed(2)} seconds. Position: x=${state.x.toFixed(2)}, y=${state.y.toFixed(2)} meters. Speed: ${speed.toFixed(1)} meters per second. Status: ${state.phase}.`
      }
      return
    }

    const interval = setInterval(() => {
      const t = usePlaybackStore.getState().currentTime
      const state = topic.stateAtTime(params, t)
      const speed = Math.sqrt(state.vx * state.vx + state.vy * state.vy)
      if (liveRef.current) {
        liveRef.current.textContent = `Time: ${state.t.toFixed(2)} seconds. Position: x=${state.x.toFixed(2)}, y=${state.y.toFixed(2)} meters. Speed: ${speed.toFixed(1)} meters per second. Status: ${state.phase}.`
      }
    }, 250)

    return () => clearInterval(interval)
  }, [playbackState, params, currentTime, topic])

  // Visibility change handler
  useEffect(() => {
    const handler = () => {
      if (document.hidden && playbackState === 'playing') {
        setPlaybackState('paused')
      }
    }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [playbackState, setPlaybackState])

  const getMousePhysics = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const bounds = topic.computeBounds(params, compareMode, paramsB, ghostTrails)
    const { toSX, toSY, fromSX, fromSY } = getCanvasTransforms(canvas, bounds)
    return { mx, my, toSX, toSY, fromSX, fromSY, physX: fromSX(mx), physY: fromSY(my) }
  }, [params, compareMode, paramsB, ghostTrails, topic])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const info = getMousePhysics(e)
    if (!info) return
    const { mx, my, toSX, toSY } = info

    if (activeTools.protractor) {
      const ph = hitTestProtractorHandle(mx, my, protractor, toSX, toSY)
      if (ph) {
        const dx = info.physX - protractor.cx
        const dy = info.physY - protractor.cy
        startDrag({ tool: 'protractor', handle: ph }, { dx, dy })
        e.preventDefault()
        return
      }
    }

    if (activeTools.ruler) {
      const rh = hitTestRulerHandle(mx, my, ruler, toSX, toSY)
      if (rh) {
        if (rh === 'body') {
          const dx = info.physX - ruler.x1
          const dy = info.physY - ruler.y1
          startDrag({ tool: 'ruler', handle: rh }, { dx, dy })
        } else {
          startDrag({ tool: 'ruler', handle: rh }, { dx: 0, dy: 0 })
        }
        e.preventDefault()
        return
      }
    }
  }, [getMousePhysics, activeTools, ruler, protractor, startDrag])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragTarget) {
      const canvas = canvasRef.current
      if (!canvas) return
      const info = getMousePhysics(e)
      if (!info) return
      let cursor = 'default'
      if (activeTools.protractor) {
        const ph = hitTestProtractorHandle(info.mx, info.my, protractor, info.toSX, info.toSY)
        if (ph) cursor = ph === 'arm' ? 'pointer' : 'grab'
      }
      if (cursor === 'default' && activeTools.ruler) {
        const rh = hitTestRulerHandle(info.mx, info.my, ruler, info.toSX, info.toSY)
        if (rh) cursor = rh === 'body' ? 'grab' : 'pointer'
      }
      canvas.style.cursor = cursor
      return
    }

    const info = getMousePhysics(e)
    if (!info) return

    if (dragTarget.tool === 'ruler') {
      if (dragTarget.handle === 'start') {
        setRuler({ x1: info.physX, y1: info.physY })
      } else if (dragTarget.handle === 'end') {
        setRuler({ x2: info.physX, y2: info.physY })
      } else {
        const dx = ruler.x2 - ruler.x1
        const dy = ruler.y2 - ruler.y1
        const newX1 = info.physX - dragOffset.dx
        const newY1 = info.physY - dragOffset.dy
        setRuler({ x1: newX1, y1: newY1, x2: newX1 + dx, y2: newY1 + dy })
      }
    } else if (dragTarget.tool === 'protractor') {
      if (dragTarget.handle === 'center') {
        setProtractor({ cx: info.physX - dragOffset.dx, cy: info.physY - dragOffset.dy })
      } else {
        const cx = protractor.cx
        const cy = protractor.cy
        const dx = info.physX - cx
        const dy = info.physY - cy
        let angle = Math.atan2(dy, dx) * 180 / Math.PI
        angle = Math.max(0, Math.min(180, angle))
        setProtractor({ armAngle: Math.round(angle) })
      }
    }
  }, [dragTarget, dragOffset, getMousePhysics, activeTools, ruler, protractor, setRuler, setProtractor])

  const handleMouseUp = useCallback(() => {
    if (dragTarget) {
      stopDrag()
      const canvas = canvasRef.current
      if (canvas) canvas.style.cursor = 'default'
    }
  }, [dragTarget, stopDrag])

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-0">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`${topic.name} simulation. Use controls on the right to adjust parameters.`}
        className="block w-full h-full"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      <div ref={liveRef} className="sr-only" aria-live="polite" />
    </div>
  )
}
