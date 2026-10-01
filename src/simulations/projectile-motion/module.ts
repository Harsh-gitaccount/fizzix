import type { SimulationModule } from '@/simulations/types'
import { stateAtTime, derivedValues, getTimeOfFlight, trajectoryBounds } from '@/lib/physics/projectile'
import { renderFrame, computeUnifiedBounds } from '@/lib/canvas/renderer2d'
import { PRESETS } from './presets'
import { QUIZ_POOL } from './quiz'

const projectileModule: SimulationModule = {
  id: 'projectile-motion',
  slug: 'projectile-motion',
  name: 'Projectile Motion',
  description: 'Explore how objects fly through the air under gravity',
  classRange: '6-8',
  icon: '\u{1F3AF}',
  color: '#3B82F6',

  stateAtTime,
  timeOfFlight: getTimeOfFlight,
  derivedValues,
  trajectoryBounds,

  defaultParams: {
    v0: 20,
    theta: 45,
    g: 9.8,
    y0: 0,
    drag: 0,
  },

  paramLimits: {
    v0: [0, 50],
    theta: [0, 90],
    g: [0.5, 20],
    y0: [0, 50],
    drag: [0, 0.5],
  },

  paramDefs: [
    { key: 'v0', symbol: 'v₀', unit: 'm/s', min: 0, max: 50, step: 0.5, help: 'Initial speed — how fast the object is launched', helpHi: 'शुरुआती गति — वस्तु कितनी तेज़ फेंकी गई' },
    { key: 'theta', symbol: 'θ', unit: '°', min: 0, max: 90, step: 1, help: 'Launch angle — direction of throw above horizontal', helpHi: 'फेंकने का कोण — क्षैतिज से ऊपर की दिशा' },
    { key: 'g', symbol: 'g', unit: 'm/s²', min: 0.5, max: 20, step: 0.1, help: 'Gravity — pull of the planet (Earth = 9.8, Moon = 1.6)', helpHi: 'गुरुत्वाकर्षण — ग्रह का खिंचाव (पृथ्वी = 9.8, चंद्रमा = 1.6)' },
    { key: 'y0', symbol: 'y₀', unit: 'm', min: 0, max: 50, step: 0.5, help: 'Starting height — how high above the ground', helpHi: 'शुरुआती ऊँचाई — ज़मीन से कितनी ऊँचाई पर' },
    { key: 'drag', symbol: 'b', unit: '1/m', min: 0, max: 0.5, step: 0.01, help: 'Drag factor — combined air resistance per unit mass (0 = no air, 0.5 = heavy drag)', helpHi: 'ड्रैग गुणांक — प्रति इकाई द्रव्यमान वायु प्रतिरोध (0 = कोई हवा नहीं, 0.5 = भारी ड्रैग)' },
  ],

  tabs: [
    { id: 'intro', labelKey: 'tab.intro' },
    { id: 'vectors', labelKey: 'tab.vectors' },
    { id: 'compare', labelKey: 'tab.compare' },
    { id: 'free-play', labelKey: 'tab.freePlay' },
  ],
  defaultTab: 'intro',

  defaultLayers: {
    grid: true,
    trajectory: true,
    velocity: false,
    components: false,
    acceleration: false,
    graph: false,
  },

  layerDefs: [
    { key: 'grid', label: 'Grid', labelHi: 'ग्रिड', icon: '#', defaultOn: true, color: '#6B7280' },
    { key: 'trajectory', label: 'Trajectory', labelHi: 'पथ', icon: '~', defaultOn: true, color: '#3B82F6' },
    { key: 'velocity', label: 'Velocity', labelHi: 'वेग', icon: '→', defaultOn: false, color: '#059669' },
    { key: 'components', label: 'Components', labelHi: 'घटक', icon: '↕', defaultOn: false, color: '#8B5CF6' },
    { key: 'acceleration', label: 'Acceleration', labelHi: 'त्वरण', icon: '↓', defaultOn: false, color: '#B45309' },
    { key: 'graph', label: 'Graph', labelHi: 'ग्राफ़', icon: '\u{1F4C8}', defaultOn: false, color: '#EF4444' },
  ],

  presets: PRESETS,

  renderCanvas: renderFrame,
  computeBounds: computeUnifiedBounds,

  derivedValueKeys: ['range', 'maxHeight', 'timeOfFlight', 'horizontalV', 'impactSpeed', 'launchSpeed', 'currentHeight', 'currentSpeed'],

  quizPool: QUIZ_POOL,
}

export default projectileModule
