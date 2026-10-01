'use client'

import { useRef, useEffect, useCallback } from 'react'
import * as THREE from 'three'
import { usePlaybackStore } from '@/store/playbackStore'
import { useSimulationStore } from '@/store/simulationStore'

import { useTopic } from '@/simulations/TopicContext'

export interface Scene3DSetup {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  container: HTMLDivElement
}

export type Scene3DBuilder = (setup: Scene3DSetup) => {
  update: (params: Record<string, number>, currentTime: number, isDark: boolean) => void
  dispose: () => void
}

interface Scene3DProps {
  builder: Scene3DBuilder
}

export default function Scene3D({ builder }: Scene3DProps) {
  const topic = useTopic()
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const updateFnRef = useRef<ReturnType<Scene3DBuilder>['update'] | null>(null)
  const disposeFnRef = useRef<ReturnType<Scene3DBuilder>['dispose'] | null>(null)
  const rafRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const isDraggingRef = useRef(false)
  const prevMouseRef = useRef({ x: 0, y: 0 })
  const cameraAngleRef = useRef({ theta: Math.PI / 4, phi: Math.PI / 3, distance: 12 })

  const params = useSimulationStore((s) => s.params)
  const playbackState = usePlaybackStore((s) => s.playbackState)
  const currentTime = usePlaybackStore((s) => s.currentTime)
  const speedMultiplier = usePlaybackStore((s) => s.speedMultiplier)
  const setCurrentTime = usePlaybackStore((s) => s.setCurrentTime)
  const setPlaybackState = usePlaybackStore((s) => s.setPlaybackState)

  const isDark =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches

  const updateCamera = useCallback(() => {
    const camera = cameraRef.current
    if (!camera) return
    const { theta, phi, distance } = cameraAngleRef.current
    camera.position.set(
      distance * Math.sin(phi) * Math.cos(theta),
      distance * Math.cos(phi),
      distance * Math.sin(phi) * Math.sin(theta)
    )
    camera.lookAt(0, 0, 0)
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(container.clientWidth, container.clientHeight)
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(isDark ? '#0f172a' : '#fafafa')

    const camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.1,
      200
    )

    rendererRef.current = renderer
    sceneRef.current = scene
    cameraRef.current = camera

    updateCamera()

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
    dirLight.position.set(5, 10, 7)
    scene.add(dirLight)

    const result = builder({ scene, camera, renderer, container })
    updateFnRef.current = result.update
    disposeFnRef.current = result.dispose

    const ro = new ResizeObserver(() => {
      const w = container.clientWidth
      const h = container.clientHeight
      if (w === 0 || h === 0) return
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    })
    ro.observe(container)

    return () => {
      ro.disconnect()
      result.dispose()
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
      rendererRef.current = null
      sceneRef.current = null
      cameraRef.current = null
      updateFnRef.current = null
      disposeFnRef.current = null
    }
  }, [builder, isDark, updateCamera])

  useEffect(() => {
    if (updateFnRef.current) {
      updateFnRef.current(params, currentTime, isDark)
    }
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current)
    }
  }, [params, currentTime, isDark])

  useEffect(() => {
    if (playbackState !== 'playing') return

    const tof = topic.timeOfFlight(params)
    lastTimeRef.current = performance.now()

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

      setCurrentTime(newTime)

      if (updateFnRef.current) {
        updateFnRef.current(
          useSimulationStore.getState().params,
          newTime,
          isDark
        )
      }
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current)
      }

      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [playbackState, params, speedMultiplier, setCurrentTime, setPlaybackState, topic, isDark])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDraggingRef.current = true
    prevMouseRef.current = { x: e.clientX, y: e.clientY }
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingRef.current) return
    const dx = e.clientX - prevMouseRef.current.x
    const dy = e.clientY - prevMouseRef.current.y
    prevMouseRef.current = { x: e.clientX, y: e.clientY }

    cameraAngleRef.current.theta -= dx * 0.008
    cameraAngleRef.current.phi = Math.max(0.1, Math.min(Math.PI - 0.1,
      cameraAngleRef.current.phi - dy * 0.008
    ))

    updateCamera()
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current)
    }
  }, [updateCamera])

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    cameraAngleRef.current.distance = Math.max(4, Math.min(30,
      cameraAngleRef.current.distance + e.deltaY * 0.01
    ))
    updateCamera()
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current)
    }
  }, [updateCamera])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const ROTATE_STEP = 0.1
    const ZOOM_STEP = 1
    let handled = false

    if (e.key === 'ArrowLeft') {
      cameraAngleRef.current.theta += ROTATE_STEP
      handled = true
    } else if (e.key === 'ArrowRight') {
      cameraAngleRef.current.theta -= ROTATE_STEP
      handled = true
    } else if (e.key === 'ArrowUp') {
      cameraAngleRef.current.phi = Math.max(0.1, cameraAngleRef.current.phi - ROTATE_STEP)
      handled = true
    } else if (e.key === 'ArrowDown') {
      cameraAngleRef.current.phi = Math.min(Math.PI - 0.1, cameraAngleRef.current.phi + ROTATE_STEP)
      handled = true
    } else if (e.key === '+' || e.key === '=') {
      cameraAngleRef.current.distance = Math.max(4, cameraAngleRef.current.distance - ZOOM_STEP)
      handled = true
    } else if (e.key === '-') {
      cameraAngleRef.current.distance = Math.min(30, cameraAngleRef.current.distance + ZOOM_STEP)
      handled = true
    }

    if (handled) {
      e.preventDefault()
      e.stopPropagation()
      updateCamera()
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current)
      }
    }
  }, [updateCamera])

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label="3D simulation view - use arrow keys to rotate, plus/minus to zoom"
      tabIndex={0}
      data-keyboard-trap
      className="absolute inset-0 cursor-grab active:cursor-grabbing focus:outline-2 focus:outline-blue-500 focus:outline-offset-[-2px]"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onKeyDown={handleKeyDown}
    >
      <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/40 text-white text-[10px] rounded pointer-events-none select-none">
        Drag to rotate | Scroll to zoom | Arrow keys to rotate | +/- to zoom
      </div>
    </div>
  )
}
