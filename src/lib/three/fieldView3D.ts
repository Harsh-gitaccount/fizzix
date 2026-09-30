import * as THREE from 'three'
import type { Scene3DSetup, Scene3DBuilder } from '@/components/simulation/Scene3D'
import { coulombForce } from '@/lib/physics/electrostatics'

const FIELD_LINE_SEGMENTS = 60
const FIELD_LINE_STEP = 0.15
const FIELD_LINES_PER_CHARGE = 12

export function createFieldView3D(setup: Scene3DSetup): ReturnType<Scene3DBuilder> {
  const { scene } = setup

  let charge1Mesh: THREE.Mesh | null = null
  let charge2Mesh: THREE.Mesh | null = null
  let forceArrow1: THREE.Group | null = null
  let forceArrow2: THREE.Group | null = null
  let fieldLineGroup: THREE.Group | null = null
  let flowDotsGroup: THREE.Group | null = null
  let label1: THREE.Sprite | null = null
  let label2: THREE.Sprite | null = null

  const chargeGeom = new THREE.SphereGeometry(0.4, 32, 24)

  function buildScene(q1: number, q2: number, distance: number, isDark: boolean) {
    clearScene()

    const x1 = -distance * 2
    const x2 = distance * 2

    const mat1 = new THREE.MeshPhongMaterial({
      color: q1 === 0 ? 0x9ca3af : q1 > 0 ? 0xef4444 : 0x3b82f6,
      shininess: 80,
    })
    charge1Mesh = new THREE.Mesh(chargeGeom, mat1)
    charge1Mesh.position.set(x1, 0, 0)
    scene.add(charge1Mesh)

    const mat2 = new THREE.MeshPhongMaterial({
      color: q2 === 0 ? 0x9ca3af : q2 > 0 ? 0xef4444 : 0x3b82f6,
      shininess: 80,
    })
    charge2Mesh = new THREE.Mesh(chargeGeom, mat2)
    charge2Mesh.position.set(x2, 0, 0)
    scene.add(charge2Mesh)

    label1 = makeLabel(q1 === 0 ? '0' : q1 > 0 ? '+' : '−', q1 === 0 ? 0x9ca3af : q1 > 0 ? 0xfca5a5 : 0x93c5fd)
    label1.position.set(x1, 0.8, 0)
    scene.add(label1)

    label2 = makeLabel(q2 === 0 ? '0' : q2 > 0 ? '+' : '−', q2 === 0 ? 0x9ca3af : q2 > 0 ? 0xfca5a5 : 0x93c5fd)
    label2.position.set(x2, 0.8, 0)
    scene.add(label2)

    forceArrow1 = createForceArrow()
    forceArrow2 = createForceArrow()
    scene.add(forceArrow1)
    scene.add(forceArrow2)

    fieldLineGroup = new THREE.Group()
    const charges = [
      { x: x1, y: 0, z: 0, q: q1 },
      { x: x2, y: 0, z: 0, q: q2 },
    ]

    for (const charge of charges) {
      if (charge.q === 0) continue
      const isPositive = charge.q > 0
      if (!isPositive) continue

      for (let i = 0; i < FIELD_LINES_PER_CHARGE; i++) {
        const phi = (i / FIELD_LINES_PER_CHARGE) * Math.PI * 2
        for (let layer = 0; layer < 3; layer++) {
          const thetaOffset = (layer - 1) * 0.7
          const dx = Math.cos(phi) * Math.cos(thetaOffset)
          const dy = Math.sin(thetaOffset)
          const dz = Math.sin(phi) * Math.cos(thetaOffset)

          const points = traceFieldLine3D(
            charge.x + dx * 0.5,
            charge.y + dy * 0.5,
            charge.z + dz * 0.5,
            charges
          )

          if (points.length < 3) continue
          const curve = new THREE.CatmullRomCurve3(points)
          const lineGeom = new THREE.TubeGeometry(curve, points.length * 2, 0.02, 6, false)
          const lineMat = new THREE.MeshBasicMaterial({
            color: isDark ? 0xa78bfa : 0x7c3aed,
            transparent: true,
            opacity: 0.6,
          })
          const lineMesh = new THREE.Mesh(lineGeom, lineMat)
          fieldLineGroup.add(lineMesh)
        }
      }
    }

    const nonZero = charges.filter(c => c.q !== 0)
    if (nonZero.length > 0 && nonZero.every(c => c.q < 0)) {
      for (const charge of nonZero) {
        for (let i = 0; i < FIELD_LINES_PER_CHARGE; i++) {
          const phi = (i / FIELD_LINES_PER_CHARGE) * Math.PI * 2
          const dx = Math.cos(phi)
          const dz = Math.sin(phi)

          const points = traceFieldLine3D(
            charge.x + dx * 0.5,
            charge.y,
            charge.z + dz * 0.5,
            charges,
            true
          )

          if (points.length < 3) continue
          points.reverse()
          const curve = new THREE.CatmullRomCurve3(points)
          const lineGeom = new THREE.TubeGeometry(curve, points.length * 2, 0.02, 6, false)
          const lineMat = new THREE.MeshBasicMaterial({
            color: isDark ? 0xa78bfa : 0x7c3aed,
            transparent: true,
            opacity: 0.6,
          })
          fieldLineGroup.add(new THREE.Mesh(lineGeom, lineMat))
        }
      }
    }

    scene.add(fieldLineGroup)

    flowDotsGroup = new THREE.Group()
    scene.add(flowDotsGroup)
  }

  function clearScene() {
    if (charge1Mesh) { scene.remove(charge1Mesh); (charge1Mesh.material as THREE.Material).dispose() }
    if (charge2Mesh) { scene.remove(charge2Mesh); (charge2Mesh.material as THREE.Material).dispose() }
    if (label1) scene.remove(label1)
    if (label2) scene.remove(label2)
    if (forceArrow1) scene.remove(forceArrow1)
    if (forceArrow2) scene.remove(forceArrow2)
    if (fieldLineGroup) {
      fieldLineGroup.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose()
          ;(child.material as THREE.Material).dispose()
        }
      })
      scene.remove(fieldLineGroup)
    }
    if (flowDotsGroup) {
      flowDotsGroup.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose()
          ;(child.material as THREE.Material).dispose()
        }
      })
      scene.remove(flowDotsGroup)
    }
    charge1Mesh = charge2Mesh = null
    label1 = label2 = null
    forceArrow1 = forceArrow2 = null
    fieldLineGroup = flowDotsGroup = null
  }

  let prevQ1 = NaN, prevQ2 = NaN, prevDist = NaN, prevDark = false

  function update(params: Record<string, number>, currentTime: number, isDark: boolean) {
    const q1 = params.q1 ?? 2
    const q2 = params.q2 ?? -2
    const distance = params.distance ?? 0.5

    if (q1 !== prevQ1 || q2 !== prevQ2 || distance !== prevDist || isDark !== prevDark) {
      buildScene(q1, q2, distance, isDark)
      prevQ1 = q1; prevQ2 = q2; prevDist = distance; prevDark = isDark
    }

    scene.background = new THREE.Color(isDark ? '#0f172a' : '#fafafa')

    const x1 = -distance * 2
    const x2 = distance * 2

    if (charge1Mesh && charge2Mesh && currentTime > 0) {
      const pulse = 1 + 0.15 * Math.sin(currentTime * Math.PI * 2)
      charge1Mesh.scale.setScalar(pulse)
      charge2Mesh.scale.setScalar(pulse)
    }

    const force = coulombForce(q1, q2, distance)
    const isRepulsive = force > 0
    const forceLen = Math.min(Math.abs(force) * 0.8, 2)

    if (forceArrow1 && forceArrow2 && q1 !== 0 && q2 !== 0) {
      forceArrow1.visible = true
      forceArrow2.visible = true

      const pulse = currentTime > 0 ? 1 + 0.15 * Math.sin(currentTime * Math.PI * 2) : 1

      if (isRepulsive) {
        positionArrow(forceArrow1, x1, 0, 0, x1 - forceLen * pulse, 0, 0, 0xef4444)
        positionArrow(forceArrow2, x2, 0, 0, x2 + forceLen * pulse, 0, 0, 0xef4444)
      } else {
        positionArrow(forceArrow1, x1, 0, 0, x1 + forceLen * pulse, 0, 0, 0xf59e0b)
        positionArrow(forceArrow2, x2, 0, 0, x2 - forceLen * pulse, 0, 0, 0xf59e0b)
      }
    } else if (forceArrow1 && forceArrow2) {
      forceArrow1.visible = false
      forceArrow2.visible = false
    }

    if (flowDotsGroup && fieldLineGroup && currentTime > 0) {
      const dots = flowDotsGroup
      dots.children.forEach(c => {
        if (c instanceof THREE.Mesh) {
          c.geometry.dispose()
          ;(c.material as THREE.Material).dispose()
        }
      })
      dots.clear()

      const dotGeom = new THREE.SphereGeometry(0.06, 8, 6)
      const dotMat = new THREE.MeshBasicMaterial({
        color: isDark ? 0xe9d5ff : 0x7c3aed,
      })

      let lineIndex = 0
      fieldLineGroup.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return
        const geom = child.geometry as THREE.TubeGeometry
        if (!geom.parameters?.path) return
        const path = geom.parameters.path as THREE.CatmullRomCurve3
        const totalLen = path.getLength()
        if (totalLen < 1) return

        const numDots = Math.max(2, Math.floor(totalLen / 2))
        const phase = ((currentTime * 1.5 + lineIndex * 0.3) % totalLen) / totalLen

        for (let d = 0; d < numDots; d++) {
          const t = (phase + d / numDots) % 1
          const pt = path.getPointAt(t)
          const dot = new THREE.Mesh(dotGeom, dotMat)
          dot.position.copy(pt)
          dots.add(dot)
        }
        lineIndex++
      })
    }
  }

  function dispose() {
    clearScene()
    chargeGeom.dispose()
  }

  return { update, dispose }
}

function traceFieldLine3D(
  startX: number, startY: number, startZ: number,
  charges: Array<{ x: number; y: number; z: number; q: number }>,
  reverse = false,
): THREE.Vector3[] {
  const points: THREE.Vector3[] = [new THREE.Vector3(startX, startY, startZ)]
  let x = startX, y = startY, z = startZ
  const dir = reverse ? -1 : 1

  for (let i = 0; i < FIELD_LINE_SEGMENTS; i++) {
    let ex = 0, ey = 0, ez = 0
    for (const c of charges) {
      const dx = x - c.x
      const dy = y - c.y
      const dz = z - c.z
      const rSq = dx * dx + dy * dy + dz * dz
      if (rSq < 0.04) return points
      const r = Math.sqrt(rSq)
      const eMag = (c.q * 8.99e9) / rSq
      ex += eMag * dx / r
      ey += eMag * dy / r
      ez += eMag * dz / r
    }

    const eMag = Math.sqrt(ex * ex + ey * ey + ez * ez)
    if (eMag < 1e-6) break

    x += (ex / eMag) * FIELD_LINE_STEP * dir
    y += (ey / eMag) * FIELD_LINE_STEP * dir
    z += (ez / eMag) * FIELD_LINE_STEP * dir

    if (Math.abs(x) > 10 || Math.abs(y) > 10 || Math.abs(z) > 10) break

    points.push(new THREE.Vector3(x, y, z))
  }

  return points
}

function createForceArrow(): THREE.Group {
  const group = new THREE.Group()
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 1, 8),
    new THREE.MeshPhongMaterial({ color: 0xf59e0b })
  )
  shaft.rotation.z = Math.PI / 2
  group.add(shaft)

  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(0.1, 0.25, 8),
    new THREE.MeshPhongMaterial({ color: 0xf59e0b })
  )
  cone.rotation.z = -Math.PI / 2
  group.add(cone)

  return group
}

function positionArrow(
  group: THREE.Group,
  fromX: number, fromY: number, fromZ: number,
  toX: number, toY: number, toZ: number,
  color: number,
) {
  const dx = toX - fromX
  const dy = toY - fromY
  const dz = toZ - fromZ
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz)
  if (len < 0.01) { group.visible = false; return }

  const shaft = group.children[0] as THREE.Mesh
  const cone = group.children[1] as THREE.Mesh

  ;(shaft.material as THREE.MeshPhongMaterial).color.setHex(color)
  ;(cone.material as THREE.MeshPhongMaterial).color.setHex(color)

  shaft.scale.set(1, len, 1)
  shaft.position.set((fromX + toX) / 2, (fromY + toY) / 2, (fromZ + toZ) / 2)

  const angle = Math.atan2(dy, dx)
  shaft.rotation.z = angle - Math.PI / 2
  cone.position.set(toX, toY, toZ)
  cone.rotation.z = angle - Math.PI / 2
}

function makeLabel(text: string, color: number): THREE.Sprite {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')!
  ctx.font = 'bold 48px sans-serif'
  ctx.fillStyle = '#' + color.toString(16).padStart(6, '0')
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 32, 32)

  const texture = new THREE.CanvasTexture(canvas)
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true })
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(0.6, 0.6, 1)
  return sprite
}
