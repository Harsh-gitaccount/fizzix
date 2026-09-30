import type { SimulationModule } from './types'
import projectileModule from './projectile-motion/module'
import shmModule from './shm/module'
import electrostaticsModule from './electrostatics/module'
import opticsModule from './optics/module'
import thermoModule from './thermodynamics/module'
import modernPhysicsModule from './modern-physics/module'

const MODULES: SimulationModule[] = [
  projectileModule,
  shmModule,
  electrostaticsModule,
  opticsModule,
  thermoModule,
  modernPhysicsModule,
]

const MODULE_MAP = new Map<string, SimulationModule>(
  MODULES.map((m) => [m.slug, m])
)

export function getModule(slug: string): SimulationModule | undefined {
  return MODULE_MAP.get(slug)
}

export function getAllModules(): SimulationModule[] {
  return MODULES
}

export { projectileModule, shmModule, electrostaticsModule, opticsModule, thermoModule, modernPhysicsModule }
