const R = 8.314
const k_B = 1.38e-23

interface Particle {
  x: number; y: number; z: number
  vx: number; vy: number; vz: number
  radius: number; mass: number; isBig?: boolean
}

let particles: Particle[] = []
let brownianTrace: { x: number; y: number; z: number }[] = []

function initParticles3D(
  count: number, bx: number, by: number, bz: number,
  temperature: number, molarMass: number,
): Particle[] {
  const speedScale = 0.25 * Math.sqrt(temperature / molarMass)
  const r = 0.12
  const result: Particle[] = []
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    const speed = speedScale * (0.5 + Math.random())
    result.push({
      x: r + Math.random() * (bx - 2 * r),
      y: r + Math.random() * (by - 2 * r),
      z: r + Math.random() * (bz - 2 * r),
      vx: speed * Math.sin(phi) * Math.cos(theta),
      vy: speed * Math.sin(phi) * Math.sin(theta),
      vz: speed * Math.cos(phi),
      radius: r,
      mass: 1,
    })
  }
  return result
}

function initBrownianParticles3D(
  smallCount: number, bx: number, by: number, bz: number,
  temperature: number, molarMass: number,
): Particle[] {
  const ps = initParticles3D(smallCount, bx, by, bz, temperature, molarMass)
  const bigR = 0.4
  ps.push({
    x: bx / 2, y: by / 2, z: bz / 2,
    vx: 0, vy: 0, vz: 0,
    radius: bigR, mass: 20, isBig: true,
  })
  return ps
}

function stepParticles3D(
  ps: Particle[], dt: number,
  bx: number, by: number, bz: number,
  rightWall?: number,
): void {
  const rw = rightWall ?? bx
  for (const p of ps) {
    p.x += p.vx * dt
    p.y += p.vy * dt
    p.z += p.vz * dt
    if (p.x - p.radius < 0) { p.x = p.radius; p.vx = Math.abs(p.vx) }
    if (p.x + p.radius > rw) { p.x = rw - p.radius; p.vx = -Math.abs(p.vx) }
    if (p.y - p.radius < 0) { p.y = p.radius; p.vy = Math.abs(p.vy) }
    if (p.y + p.radius > by) { p.y = by - p.radius; p.vy = -Math.abs(p.vy) }
    if (p.z - p.radius < 0) { p.z = p.radius; p.vz = Math.abs(p.vz) }
    if (p.z + p.radius > bz) { p.z = bz - p.radius; p.vz = -Math.abs(p.vz) }
  }
  // Particle-particle elastic collisions
  for (let i = 0; i < ps.length; i++) {
    for (let j = i + 1; j < ps.length; j++) {
      const a = ps[i], b = ps[j]
      const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
      const minDist = a.radius + b.radius
      if (dist < minDist && dist > 0) {
        const nx = dx / dist, ny = dy / dist, nz = dz / dist
        const dvn = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny + (a.vz - b.vz) * nz
        if (dvn > 0) {
          const totalMass = a.mass + b.mass
          const impulse = (2 * dvn) / totalMass
          a.vx -= impulse * b.mass * nx
          a.vy -= impulse * b.mass * ny
          a.vz -= impulse * b.mass * nz
          b.vx += impulse * a.mass * nx
          b.vy += impulse * a.mass * ny
          b.vz += impulse * a.mass * nz
          const overlap = minDist - dist
          const sep = (overlap / 2 + 0.01)
          a.x -= sep * nx; a.y -= sep * ny; a.z -= sep * nz
          b.x += sep * nx; b.y += sep * ny; b.z += sep * nz
        }
      }
    }
  }
}

function rescaleSpeeds(ps: Particle[], oldT: number, newT: number) {
  if (oldT <= 0 || newT <= 0) return
  const factor = Math.sqrt(newT / oldT)
  for (const p of ps) {
    if (!p.isBig) { p.vx *= factor; p.vy *= factor; p.vz *= factor }
  }
}

let lastHash = ''
let lastTemp = 0
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

function getParticleCount(params: Record<string, number>): number {
  const tt = params.thermoType ?? 0
  if (tt === 2) return Math.round(params.numSmall ?? 80)
  const moles = params.moles ?? 1
  return Math.max(10, Math.min(200, Math.round(moles * 40)))
}

function makeHash(params: Record<string, number>): string {
  const tt = params.thermoType ?? 0
  const n = getParticleCount(params)
  const T = params.temperature ?? 300
  const M = params.molarMass ?? 28
  const [bx] = getBoxDims(params)
  return `${tt}-${n}-${T.toFixed(0)}-${M}-${bx.toFixed(2)}`
}

function handleInit(params: Record<string, number>) {
  const hash = makeHash(params)
  if (hash === lastHash && particles.length > 0) {
    const newT = params.temperature ?? 300
    if (newT !== lastTemp && lastTemp > 0) {
      rescaleSpeeds(particles, lastTemp, newT)
      lastTemp = newT
      lastHash = hash
    }
    return
  }

  const tt = params.thermoType ?? 0
  const n = getParticleCount(params)
  const T = params.temperature ?? 300
  const M = params.molarMass ?? 28
  const [bx, by, bz] = getBoxDims(params)

  if (tt === 2) {
    particles = initBrownianParticles3D(n, bx, by, bz, T, M)
    brownianTrace = [{ x: bx / 2, y: by / 2, z: bz / 2 }]
  } else {
    particles = initParticles3D(n, bx, by, bz, T, M)
    brownianTrace = []
  }
  lastHash = hash
  lastTemp = T
}

function handleStep(params: Record<string, number>, dt: number) {
  if (particles.length === 0) return
  const tt = params.thermoType ?? 0
  const [bx, by, bz] = getBoxDims(params)
  const rightWall = tt === 1 ? bx : undefined
  const subSteps = Math.min(Math.ceil(dt * 60), 4)
  const subDt = (dt / subSteps) * 60
  for (let s = 0; s < subSteps; s++) {
    stepParticles3D(particles, subDt, bx, by, bz, rightWall)
  }
  if (tt === 2) {
    const big = particles.find(p => p.isBig)
    if (big) {
      brownianTrace.push({ x: big.x, y: big.y, z: big.z })
      if (brownianTrace.length > 2000) brownianTrace.splice(0, brownianTrace.length - 2000)
    }
  }
}

function serializeState(): Float32Array {
  // Layout per particle: x, y, z, speed, radius, isBig(0/1) = 6 floats
  const arr = new Float32Array(particles.length * 6 + brownianTrace.length * 3 + 2)
  arr[0] = particles.length
  arr[1] = brownianTrace.length
  let offset = 2
  for (const p of particles) {
    arr[offset++] = p.x
    arr[offset++] = p.y
    arr[offset++] = p.z
    arr[offset++] = Math.sqrt(p.vx * p.vx + p.vy * p.vy + p.vz * p.vz)
    arr[offset++] = p.radius
    arr[offset++] = p.isBig ? 1 : 0
  }
  for (const pt of brownianTrace) {
    arr[offset++] = pt.x
    arr[offset++] = pt.y
    arr[offset++] = pt.z
  }
  return arr
}

self.onmessage = (e: MessageEvent) => {
  const { type, params, dt } = e.data
  if (type === 'init') {
    handleInit(params)
    const data = serializeState()
    ;(self as unknown as Worker).postMessage({ type: 'state', data }, [data.buffer])
  } else if (type === 'step') {
    handleInit(params)
    handleStep(params, dt)
    const data = serializeState()
    ;(self as unknown as Worker).postMessage({ type: 'state', data }, [data.buffer])
  } else if (type === 'reset') {
    particles = []
    brownianTrace = []
    lastHash = ''
    lastTemp = 0
    if (params) {
      handleInit(params)
      const data = serializeState()
      ;(self as unknown as Worker).postMessage({ type: 'state', data }, [data.buffer])
    }
  }
}
