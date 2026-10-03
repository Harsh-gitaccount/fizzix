import * as THREE from 'three'
import type { Scene3DSetup, Scene3DBuilder } from '@/components/simulation/Scene3D'

const PARTICLE_ROWS = 5
const PARTICLE_COLS = 20
const PARTICLE_LAYERS = 3
const SPACING = 0.6
const AMPLITUDE = 0.35

export function createLongitudinalWave(setup: Scene3DSetup): ReturnType<Scene3DBuilder> {
  const { scene } = setup
  const particles: THREE.Mesh[] = []
  const restPositions: THREE.Vector3[] = []
  const particleGroup = new THREE.Group()

  const geometry = new THREE.SphereGeometry(0.12, 16, 12)

  const totalWidth = (PARTICLE_COLS - 1) * SPACING
  const totalHeight = (PARTICLE_ROWS - 1) * SPACING
  const totalDepth = (PARTICLE_LAYERS - 1) * SPACING

  for (let z = 0; z < PARTICLE_LAYERS; z++) {
    for (let y = 0; y < PARTICLE_ROWS; y++) {
      for (let x = 0; x < PARTICLE_COLS; x++) {
        const material = new THREE.MeshPhongMaterial({
          color: new THREE.Color().setHSL(0.6, 0.7, 0.55),
          shininess: 60,
        })
        const mesh = new THREE.Mesh(geometry, material)
        const rx = x * SPACING - totalWidth / 2
        const ry = y * SPACING - totalHeight / 2
        const rz = z * SPACING - totalDepth / 2
        mesh.position.set(rx, ry, rz)
        restPositions.push(new THREE.Vector3(rx, ry, rz))
        particles.push(mesh)
        particleGroup.add(mesh)
      }
    }
  }

  scene.add(particleGroup)

  const arrowGroup = new THREE.Group()
  const arrowLength = totalWidth * 0.7
  const arrowY = totalHeight / 2 + 1.2

  const arrowGeom = new THREE.CylinderGeometry(0.03, 0.03, arrowLength, 8)
  arrowGeom.rotateZ(Math.PI / 2)
  const arrowMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6 })
  const arrowShaft = new THREE.Mesh(arrowGeom, arrowMat)
  arrowShaft.position.set(0, arrowY, 0)
  arrowGroup.add(arrowShaft)

  const coneGeom = new THREE.ConeGeometry(0.1, 0.3, 8)
  coneGeom.rotateZ(-Math.PI / 2)
  const cone = new THREE.Mesh(coneGeom, arrowMat)
  cone.position.set(arrowLength / 2 + 0.15, arrowY, 0)
  arrowGroup.add(cone)

  scene.add(arrowGroup)

  const labelC = makeTextSprite('C', 0xef4444)
  const labelR = makeTextSprite('R', 0x22c55e)
  labelC.position.set(0, -totalHeight / 2 - 1.0, 0)
  labelR.position.set(0, -totalHeight / 2 - 1.0, 0)
  scene.add(labelC)
  scene.add(labelR)

  const waveDirLabel = makeTextSprite('Wave direction →', 0x3b82f6, 512)
  waveDirLabel.position.set(0, arrowY + 0.5, 0)
  waveDirLabel.scale.set(4, 0.5, 1)
  scene.add(waveDirLabel)

  function update(params: Record<string, number>, currentTime: number, isDark: boolean) {
    const k = params.k ?? 10
    const mass = params.mass ?? 1
    const amplitude = params.amplitude ?? 0.2
    const damping = params.damping ?? 0

    const omega = Math.sqrt(k / mass)
    const waveSpeed = SPACING * Math.sqrt(k / mass)
    const waveK = omega / waveSpeed

    const dampFactor = damping > 0 ? Math.exp(-damping * currentTime * 0.3) : 1
    const amp = AMPLITUDE * (amplitude / 0.2) * dampFactor

    for (let i = 0; i < particles.length; i++) {
      const rest = restPositions[i]
      const phase = waveK * rest.x - omega * currentTime
      const displacement = amp * Math.sin(phase)
      particles[i].position.x = rest.x + displacement

      // strain = ∂u/∂x ∝ cos(phase): negative → compression, positive → rarefaction
      const strain = Math.cos(phase)
      const hue = strain < -0.3 ? 0.0 : strain > 0.3 ? 0.33 : 0.6
      const sat = Math.min(Math.abs(strain), 1)
      ;(particles[i].material as THREE.MeshPhongMaterial).color.setHSL(
        hue, 0.4 + sat * 0.4, isDark ? 0.6 : 0.5
      )
    }

    // rarefaction peak at phase=0 (cos=1), compression peak at phase=π (cos=-1)
    const rarefX = (omega * currentTime / waveK) % (totalWidth + 4) - totalWidth / 2 - 2
    labelR.position.x = rarefX
    labelC.position.x = rarefX + Math.PI / waveK

    labelC.visible = currentTime > 0
    labelR.visible = currentTime > 0

    scene.background = new THREE.Color(isDark ? '#0f172a' : '#fafafa')
  }

  function dispose() {
    geometry.dispose()
    for (const p of particles) {
      ;(p.material as THREE.Material).dispose()
    }
    arrowGeom.dispose()
    arrowMat.dispose()
    coneGeom.dispose()
  }

  return { update, dispose }
}

function makeTextSprite(text: string, color: number, width = 256): THREE.Sprite {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = 64
  const ctx = canvas.getContext('2d')!
  ctx.font = 'bold 36px sans-serif'
  ctx.fillStyle = '#' + color.toString(16).padStart(6, '0')
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, width / 2, 32)

  const texture = new THREE.CanvasTexture(canvas)
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true })
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(2, 0.5, 1)
  return sprite
}
