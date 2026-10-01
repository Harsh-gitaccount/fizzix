'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import * as THREE from 'three'
import { usePlaybackStore } from '@/store/playbackStore'
import { useSimulationStore } from '@/store/simulationStore'
import { useUIStore } from '@/store/uiStore'
import { useTopic } from '@/simulations/TopicContext'
import { createGasBox3D } from '@/lib/three/gasBox3D'
import { t } from '@/lib/i18n'
import { effectiveVolume } from '@/lib/physics/thermodynamics'

const GAS_NAMES: Record<number, string> = {
  2: 'H₂', 4: 'He', 28: 'N₂', 32: 'O₂', 44: 'CO₂', 40: 'Ar',
}

export default function Scene3DGas() {
  const topic = useTopic()
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const builderRef = useRef<ReturnType<typeof createGasBox3D> | null>(null)
  const rafRef = useRef<number>(0)
  const lastWallRef = useRef<number>(0)
  const isDraggingRef = useRef(false)
  const prevMouseRef = useRef({ x: 0, y: 0 })
  const cameraDirtyRef = useRef(false)
  const cameraAngleRef = useRef({ theta: Math.PI / 4, phi: Math.PI / 3, distance: 10 })

  const params = useSimulationStore((s) => s.params)
  const activeLayers = useUIStore((s) => s.activeLayers)
  const lang = useUIStore((s) => s.lang)

  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    setIsDark(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const positionCamera = useCallback(() => {
    const camera = cameraRef.current
    if (!camera) return
    const { theta, phi, distance } = cameraAngleRef.current
    camera.position.set(
      2.5 + distance * Math.sin(phi) * Math.cos(theta),
      2.5 + distance * Math.cos(phi),
      2.5 + distance * Math.sin(phi) * Math.sin(theta)
    )
    camera.lookAt(2.5, 2.5, 2.5)
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

    positionCamera()

    scene.add(new THREE.AmbientLight(0xffffff, 0.6))
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
    dirLight.position.set(5, 10, 7)
    scene.add(dirLight)

    const builder = createGasBox3D({ scene, camera, renderer, container })
    builderRef.current = builder

    const initParams = useSimulationStore.getState().params
    const initLayers = useUIStore.getState().activeLayers
    builder.update(initParams, isDark, initLayers)
    renderer.render(scene, camera)

    lastWallRef.current = performance.now()
    let prevPlayState = usePlaybackStore.getState().playbackState

    const animate = () => {
      rafRef.current = requestAnimationFrame(animate)

      const playState = usePlaybackStore.getState().playbackState
      let needsGLRender = false

      if (prevPlayState !== 'ready' && playState === 'ready') {
        const p = useSimulationStore.getState().params
        builder.reset(p)
        const l = useUIStore.getState().activeLayers
        builder.update(p, isDark, l)
        needsGLRender = true
      }
      prevPlayState = playState

      if (playState === 'playing') {
        const now = performance.now()
        const deltaReal = Math.min(now - lastWallRef.current, 33) / 1000
        lastWallRef.current = now

        const curT = usePlaybackStore.getState().currentTime
        const speed = usePlaybackStore.getState().speedMultiplier
        const newTime = curT + deltaReal * speed
        const tof = topic.timeOfFlight(useSimulationStore.getState().params)

        if (newTime >= tof) {
          usePlaybackStore.getState().setCurrentTime(tof)
          usePlaybackStore.getState().setPlaybackState('landed')
        } else {
          usePlaybackStore.getState().setCurrentTime(newTime)
        }

        const p = useSimulationStore.getState().params
        const l = useUIStore.getState().activeLayers
        builder.step(p, deltaReal)
        builder.update(p, isDark, l)
        needsGLRender = true
      } else {
        lastWallRef.current = performance.now()
      }

      if (builder.hasNewState) {
        builder.consumeNewState()
        if (!needsGLRender) {
          const p = useSimulationStore.getState().params
          const l = useUIStore.getState().activeLayers
          builder.update(p, isDark, l)
        }
        needsGLRender = true
      }

      if (cameraDirtyRef.current) {
        cameraDirtyRef.current = false
        needsGLRender = true
      }

      if (needsGLRender) {
        renderer.render(scene, camera)
      }
    }

    rafRef.current = requestAnimationFrame(animate)

    const ro = new ResizeObserver(() => {
      const w = container.clientWidth
      const h = container.clientHeight
      if (w === 0 || h === 0) return
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      cameraDirtyRef.current = true
    })
    ro.observe(container)

    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
      builder.dispose()
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
      rendererRef.current = null
      sceneRef.current = null
      cameraRef.current = null
      builderRef.current = null
    }
  }, [isDark, positionCamera, topic])

  useEffect(() => {
    if (!builderRef.current) return
    builderRef.current.update(params, isDark, activeLayers)
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current)
    }
  }, [params, isDark, activeLayers])

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

    positionCamera()
    cameraDirtyRef.current = true
  }, [positionCamera])

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    cameraAngleRef.current.distance = Math.max(4, Math.min(30,
      cameraAngleRef.current.distance + e.deltaY * 0.01
    ))
    positionCamera()
    cameraDirtyRef.current = true
  }, [positionCamera])

  const T = params.temperature ?? 300
  const n = params.moles ?? 1
  const V = effectiveVolume(params)
  const M = params.molarMass ?? 28
  const gasName = GAS_NAMES[M] ?? `M=${M}`

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Live values */}
      <div className="absolute bottom-10 left-2 px-3 py-2 bg-white/85 dark:bg-slate-900/85 backdrop-blur-sm rounded-lg pointer-events-none select-none shadow-sm border border-gray-200 dark:border-slate-700">
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">T = {T} K</p>
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">n = {n.toFixed(1)} mol</p>
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">V = {V.toFixed(1)} L</p>
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{lang === 'hi' ? 'गैस' : 'Gas'}: {gasName}</p>
      </div>

      {/* Speed legend */}
      <div className="absolute top-2 right-2 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-lg px-3 py-2 pointer-events-none select-none shadow-sm border border-gray-200 dark:border-slate-700">
        {activeLayers.speedColors !== false && (
          <>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
              <span className="text-[10px] text-gray-600 dark:text-gray-400">{lang === 'hi' ? 'धीमा' : 'Slow'}</span>
            </div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-[10px] text-gray-600 dark:text-gray-400">{lang === 'hi' ? 'मध्यम' : 'Medium'}</span>
            </div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
              <span className="text-[10px] text-gray-600 dark:text-gray-400">{lang === 'hi' ? 'तेज़' : 'Fast'}</span>
            </div>
          </>
        )}
        {(params.thermoType ?? 0) === 2 && (
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
            <span className="text-[10px] text-gray-600 dark:text-gray-400">{lang === 'hi' ? 'बड़ा कण' : 'Large Particle'}</span>
          </div>
        )}
      </div>

      {/* Controls hint */}
      <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/40 text-white text-[10px] rounded pointer-events-none select-none">
        {lang === 'hi' ? 'घुमाने के लिए खींचें | ज़ूम के लिए स्क्रॉल करें' : 'Drag to rotate | Scroll to zoom'}
      </div>
    </div>
  )
}
