import * as THREE from 'three'

const BOX_SIZE = 5

function getBoxDims(params: Record<string, number>): [number, number, number] {
  const thermoType = params.thermoType ?? 0
  if (thermoType === 1) {
    const pistonFrac = params.pistonPos ?? 0.7
    return [BOX_SIZE * pistonFrac, BOX_SIZE, BOX_SIZE]
  }
  const vol = params.volume ?? 22.4
  const scale = Math.cbrt(vol / 22.4)
  const s = Math.max(2, Math.min(8, BOX_SIZE * scale))
  return [s, BOX_SIZE, BOX_SIZE]
}

function speedToColor(ratio: number): THREE.Color {
  if (ratio < 0.33) {
    const t = ratio / 0.33
    return new THREE.Color(
      (59 + t * (16 - 59)) / 255,
      (130 + t * (185 - 130)) / 255,
      (246 + t * (129 - 246)) / 255,
    )
  }
  if (ratio < 0.66) {
    const t = (ratio - 0.33) / 0.33
    return new THREE.Color(
      (16 + t * (234 - 16)) / 255,
      (185 + t * (179 - 185)) / 255,
      (129 + t * (8 - 129)) / 255,
    )
  }
  const t = (ratio - 0.66) / 0.34
  return new THREE.Color(
    (234 + t * (239 - 234)) / 255,
    (179 + t * (68 - 179)) / 255,
    (8 + t * (68 - 8)) / 255,
  )
}

interface GasBox3DSetup {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  container: HTMLDivElement
}

export function createGasBox3D(setup: GasBox3DSetup) {
  const { scene } = setup

  let boxHelper: THREE.LineSegments | null = null
  let wallsMesh: THREE.Mesh | null = null
  let pistonMesh: THREE.Mesh | null = null
  let particleMeshes: THREE.Mesh[] = []
  let traceLine: THREE.Line | null = null
  let pressureArrows: THREE.Group | null = null

  const smallGeom = new THREE.SphereGeometry(0.12, 12, 8)
  const bigGeom = new THREE.SphereGeometry(0.4, 16, 12)

  let workerRef: Worker | null = null
  let latestState: Float32Array | null = null
  let workerReady = false
  let stateChanged = false

  function startWorker() {
    try {
      workerRef = new Worker(
        new URL('../../workers/gasParticles.worker.ts', import.meta.url)
      )
      workerRef.onmessage = (e: MessageEvent) => {
        if (e.data.type === 'state') {
          latestState = e.data.data
          stateChanged = true
        }
      }
      workerReady = true
    } catch {
      workerReady = false
    }
  }

  startWorker()

  let prevBx = 0
  let prevBy = 0
  let prevBz = 0

  function buildBox(bx: number, by: number, bz: number, isDark: boolean, thermoType: number) {
    if (boxHelper) { scene.remove(boxHelper); boxHelper.geometry.dispose(); (boxHelper.material as THREE.Material).dispose(); boxHelper = null }
    if (pistonMesh) { scene.remove(pistonMesh); pistonMesh.geometry.dispose(); (pistonMesh.material as THREE.Material).dispose(); pistonMesh = null }
    if (wallsMesh) { scene.remove(wallsMesh); wallsMesh.geometry.dispose(); (wallsMesh.material as THREE.Material).dispose(); wallsMesh = null }

    prevBx = bx; prevBy = by; prevBz = bz

    const edgeColor = isDark ? 0x94a3b8 : 0x6b7280
    const boxGeo = new THREE.BoxGeometry(bx, by, bz)
    const edges = new THREE.EdgesGeometry(boxGeo)
    boxHelper = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: edgeColor, linewidth: 2 })
    )
    boxHelper.position.set(bx / 2, by / 2, bz / 2)
    scene.add(boxHelper)
    boxGeo.dispose()

    if (thermoType === 1) {
      const pistonGeo = new THREE.BoxGeometry(0.08, by * 0.95, bz * 0.95)
      const pistonMat = new THREE.MeshPhongMaterial({
        color: isDark ? 0xf87171 : 0xef4444,
        transparent: true,
        opacity: 0.7,
      })
      pistonMesh = new THREE.Mesh(pistonGeo, pistonMat)
      pistonMesh.position.set(bx, by / 2, bz / 2)
      scene.add(pistonMesh)
    }

    const wallMat = new THREE.MeshPhongMaterial({
      color: isDark ? 0x1e293b : 0xdbeafe,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide,
    })
    const wallGeo = new THREE.BoxGeometry(bx, by, bz)
    wallsMesh = new THREE.Mesh(wallGeo, wallMat)
    wallsMesh.position.set(bx / 2, by / 2, bz / 2)
    wallsMesh.renderOrder = -1
    scene.add(wallsMesh)
  }

  let prevHash = ''

  function update(params: Record<string, number>, isDark: boolean, layers?: Record<string, boolean>) {
    const thermoType = params.thermoType ?? 0
    const [bx, by, bz] = getBoxDims(params)
    const hash = `${thermoType}-${bx.toFixed(2)}-${by}-${bz}-${isDark}`

    if (hash !== prevHash) {
      buildBox(bx, by, bz, isDark, thermoType)
      prevHash = hash
      if (workerReady && workerRef) {
        workerRef.postMessage({ type: 'init', params })
      }
    }

    scene.background = new THREE.Color(isDark ? '#0f172a' : '#fafafa')

    if (!latestState) return

    const numParticles = latestState[0]
    const numTrace = latestState[1]
    const showSpeedColors = layers?.speedColors !== false
    const showTrace = layers?.trace !== false
    const showPressure = layers?.pressure === true

    let maxSpeed = 0.01
    for (let i = 0; i < numParticles; i++) {
      const off = 2 + i * 6
      if (latestState[off + 5] < 0.5) {
        const spd = latestState[off + 3]
        if (spd > maxSpeed) maxSpeed = spd
      }
    }

    while (particleMeshes.length < numParticles) {
      const mat = new THREE.MeshPhongMaterial({ color: 0x3b82f6, shininess: 60 })
      const mesh = new THREE.Mesh(smallGeom, mat)
      scene.add(mesh)
      particleMeshes.push(mesh)
    }
    while (particleMeshes.length > numParticles) {
      const mesh = particleMeshes.pop()!
      scene.remove(mesh)
      ;(mesh.material as THREE.Material).dispose()
    }

    for (let i = 0; i < numParticles; i++) {
      const off = 2 + i * 6
      const x = latestState[off]
      const y = latestState[off + 1]
      const z = latestState[off + 2]
      const speed = latestState[off + 3]
      const isBig = latestState[off + 5] > 0.5

      const mesh = particleMeshes[i]
      mesh.position.set(x, y, z)

      if (isBig) {
        mesh.geometry = bigGeom
        ;(mesh.material as THREE.MeshPhongMaterial).color.setHex(isDark ? 0xa78bfa : 0x8b5cf6)
        ;(mesh.material as THREE.MeshPhongMaterial).shininess = 80
      } else {
        mesh.geometry = smallGeom
        if (showSpeedColors) {
          const ratio = Math.min(speed / maxSpeed, 1)
          ;(mesh.material as THREE.MeshPhongMaterial).color.copy(speedToColor(ratio))
        } else {
          ;(mesh.material as THREE.MeshPhongMaterial).color.setHex(isDark ? 0x60a5fa : 0x3b82f6)
        }
        ;(mesh.material as THREE.MeshPhongMaterial).shininess = 60
      }
    }

    if (traceLine) { scene.remove(traceLine); traceLine.geometry.dispose(); (traceLine.material as THREE.Material).dispose(); traceLine = null }
    if (thermoType === 2 && showTrace && numTrace > 1) {
      const traceOffset = 2 + numParticles * 6
      const points: THREE.Vector3[] = []
      for (let i = 0; i < numTrace; i++) {
        const off = traceOffset + i * 3
        points.push(new THREE.Vector3(latestState[off], latestState[off + 1], latestState[off + 2]))
      }
      const geom = new THREE.BufferGeometry().setFromPoints(points)
      traceLine = new THREE.Line(
        geom,
        new THREE.LineBasicMaterial({ color: isDark ? 0xa78bfa : 0x8b5cf6, transparent: true, opacity: 0.5 })
      )
      scene.add(traceLine)
    }

    if (pressureArrows) {
      pressureArrows.traverse(ch => {
        if (ch instanceof THREE.Mesh) { ch.geometry.dispose(); (ch.material as THREE.Material).dispose() }
      })
      scene.remove(pressureArrows)
      pressureArrows = null
    }
    if (showPressure) {
      const n = params.moles ?? 1
      const T = params.temperature ?? 300
      const V = params.volume ?? 22.4
      const effectiveV = (params.thermoType ?? 0) === 1 ? V * (params.pistonPos ?? 0.7) : V
      const P_kPa = (n * 8.314 * T) / (effectiveV / 1000) / 1000
      const arrowLen = Math.min(1.5, Math.max(0.3, P_kPa / 150))

      pressureArrows = new THREE.Group()
      const arrowColor = 0xef4444
      const coneGeo = new THREE.ConeGeometry(0.08, 0.2, 8)
      const shaftGeo = new THREE.CylinderGeometry(0.025, 0.025, arrowLen, 6)

      const faces = [
        { pos: [bx / 2, by / 2, -arrowLen / 2], rot: [0, 0, 0] },
        { pos: [bx / 2, by / 2, bz + arrowLen / 2], rot: [Math.PI, 0, 0] },
        { pos: [-arrowLen / 2, by / 2, bz / 2], rot: [0, 0, Math.PI / 2] },
        { pos: [bx + arrowLen / 2, by / 2, bz / 2], rot: [0, 0, -Math.PI / 2] },
        { pos: [bx / 2, -arrowLen / 2, bz / 2], rot: [Math.PI / 2, 0, 0] },
        { pos: [bx / 2, by + arrowLen / 2, bz / 2], rot: [-Math.PI / 2, 0, 0] },
      ]

      for (const f of faces) {
        const mat = new THREE.MeshPhongMaterial({ color: arrowColor })
        const shaft = new THREE.Mesh(shaftGeo, mat)
        shaft.position.set(f.pos[0], f.pos[1], f.pos[2])
        shaft.rotation.set(f.rot[0], f.rot[1], f.rot[2])
        pressureArrows.add(shaft)

        const coneMat = new THREE.MeshPhongMaterial({ color: arrowColor })
        const cone = new THREE.Mesh(coneGeo, coneMat)
        cone.position.set(f.pos[0], f.pos[1], f.pos[2])
        cone.rotation.set(f.rot[0], f.rot[1], f.rot[2])
        pressureArrows.add(cone)
      }
      scene.add(pressureArrows)
    }
  }

  function step(params: Record<string, number>, dt: number) {
    if (workerReady && workerRef && dt > 0 && dt < 0.5) {
      workerRef.postMessage({ type: 'step', params, dt })
    }
  }

  function dispose() {
    for (const m of particleMeshes) {
      scene.remove(m)
      ;(m.material as THREE.Material).dispose()
    }
    particleMeshes = []
    if (traceLine) { scene.remove(traceLine); traceLine.geometry.dispose(); (traceLine.material as THREE.Material).dispose(); traceLine = null }
    if (pressureArrows) {
      pressureArrows.traverse(ch => {
        if (ch instanceof THREE.Mesh) { ch.geometry.dispose(); (ch.material as THREE.Material).dispose() }
      })
      scene.remove(pressureArrows)
      pressureArrows = null
    }
    if (boxHelper) { scene.remove(boxHelper); boxHelper.geometry.dispose(); (boxHelper.material as THREE.Material).dispose(); boxHelper = null }
    if (pistonMesh) { scene.remove(pistonMesh); pistonMesh.geometry.dispose(); (pistonMesh.material as THREE.Material).dispose(); pistonMesh = null }
    if (wallsMesh) { scene.remove(wallsMesh); wallsMesh.geometry.dispose(); (wallsMesh.material as THREE.Material).dispose(); wallsMesh = null }
    smallGeom.dispose()
    bigGeom.dispose()
    if (workerRef) { workerRef.terminate(); workerRef = null }
  }

  function reset(params?: Record<string, number>) {
    if (workerReady && workerRef) {
      workerRef.postMessage({ type: 'reset', params: params ?? null })
    }
    latestState = null
    stateChanged = false
    prevHash = ''
  }

  return {
    update,
    step,
    reset,
    dispose,
    get hasNewState() { return stateChanged },
    consumeNewState() { stateChanged = false },
  }
}
