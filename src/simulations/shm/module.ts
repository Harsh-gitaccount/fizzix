import type { SimulationModule } from '@/simulations/types'
import {
  shmStateAtTime,
  shmTimeOfFlight,
  shmDerivedValues,
  shmTrajectoryBounds,
} from '@/lib/physics/shm'
import { renderSHMFrame, computeSHMBounds } from '@/lib/canvas/shmRenderer'
import { SHM_QUIZ_POOL } from './quiz'

const shmModule: SimulationModule = {
  id: 'shm',
  slug: 'shm',
  name: 'Simple Harmonic Motion',
  description: 'Pendulums, springs, and oscillations',
  classRange: '9-10',
  icon: '\u{1F55B}',
  color: '#8B5CF6',

  stateAtTime: shmStateAtTime,
  timeOfFlight: (params) => shmTimeOfFlight(params),
  derivedValues: shmDerivedValues,
  trajectoryBounds: shmTrajectoryBounds,

  defaultParams: {
    shmType: 0,
    length: 1,
    theta0: 30,
    g: 9.8,
    damping: 0,
    k: 10,
    mass: 1,
    amplitude: 0.2,
  },

  paramLimits: {
    shmType: [0, 1],
    length: [0.1, 5],
    theta0: [1, 60],
    g: [0.5, 20],
    damping: [0, 1],
    k: [1, 100],
    mass: [0.1, 10],
    amplitude: [0.01, 1],
  },

  paramDefs: [
    { key: 'length', symbol: 'L', unit: 'm', min: 0.1, max: 5, step: 0.1, help: 'String length — longer string means slower swing', helpHi: 'डोरी की लंबाई — लंबी डोरी = धीमा झूला' },
    { key: 'theta0', symbol: 'θ₀', unit: '°', min: 1, max: 60, step: 1, help: 'Starting angle — how far you pull the bob to one side', helpHi: 'शुरुआती कोण — गेंद को कितना एक तरफ खींचा' },
    { key: 'g', symbol: 'g', unit: 'm/s²', min: 0.5, max: 20, step: 0.1, help: 'Gravity — pull of the planet (Earth = 9.8, Moon = 1.6)', helpHi: 'गुरुत्वाकर्षण — ग्रह का खिंचाव (पृथ्वी = 9.8, चंद्रमा = 1.6)' },
    { key: 'damping', symbol: 'γ', unit: '', min: 0, max: 1, step: 0.01, help: 'Damping — friction that slowly stops the motion (0 = no friction)', helpHi: 'अवमंदन — घर्षण जो गति को धीरे-धीरे रोकता है (0 = कोई घर्षण नहीं)' },
    { key: 'k', symbol: 'k', unit: 'N/m', min: 1, max: 100, step: 1, help: 'Spring stiffness — stiffer spring bounces faster', helpHi: 'स्प्रिंग कठोरता — कठोर स्प्रिंग तेज़ उछलती है' },
    { key: 'mass', symbol: 'm', unit: 'kg', min: 0.1, max: 10, step: 0.1, help: 'Mass of the object attached to the spring', helpHi: 'स्प्रिंग से जुड़ी वस्तु का द्रव्यमान' },
    { key: 'amplitude', symbol: 'A', unit: 'm', min: 0.01, max: 1, step: 0.01, help: 'Amplitude — maximum stretch from rest position', helpHi: 'आयाम — विराम स्थिति से अधिकतम खिंचाव' },
  ],

  tabs: [
    { id: 'pendulum', labelKey: 'tab.pendulum' },
    { id: 'spring', labelKey: 'tab.spring' },
    { id: 'free-play', labelKey: 'tab.freePlay' },
    { id: 'long-wave', labelKey: 'tab.longWave' },
  ],
  defaultTab: 'pendulum',

  defaultLayers: {
    grid: true,
    trajectory: true,
    velocity: false,
    components: false,
    energyBar: false,
  },

  layerDefs: [
    { key: 'grid', label: 'Grid', labelHi: 'ग्रिड', icon: '#', defaultOn: true, color: '#6B7280' },
    { key: 'trajectory', label: 'Trail', labelHi: 'पथ', icon: '~', defaultOn: true, color: '#3B82F6' },
    { key: 'velocity', label: 'Velocity', labelHi: 'वेग', icon: '→', defaultOn: false, color: '#059669' },
    { key: 'components', label: 'Angle', labelHi: 'कोण', icon: '∠', defaultOn: false, color: '#8B5CF6' },
    { key: 'energyBar', label: 'Energy Bar', labelHi: 'ऊर्जा बार', icon: '⚡', defaultOn: false, color: '#F59E0B' },
  ],

  presets: [
    {
      id: 'simple-pendulum',
      label: 'Simple Pendulum',
      hookQuestion: 'Does mass affect the period?',
      params: { shmType: 0, length: 1, theta0: 15, g: 9.8, damping: 0 },
      defaultLayers: ['grid', 'trajectory'],
      defaultTab: 'pendulum',
      canvasBackground: 'default-sky',
    },
    {
      id: 'long-pendulum',
      label: 'Long Pendulum',
      hookQuestion: 'How does length change the swing?',
      params: { shmType: 0, length: 3, theta0: 20, g: 9.8, damping: 0 },
      defaultLayers: ['grid', 'trajectory'],
      defaultTab: 'pendulum',
      canvasBackground: 'default-sky',
    },
    {
      id: 'moon-pendulum',
      label: 'Moon Pendulum',
      hookQuestion: 'Same pendulum, different world',
      params: { shmType: 0, length: 1, theta0: 30, g: 1.62, damping: 0 },
      compareParams: { shmType: 0, length: 1, theta0: 30, g: 9.8, damping: 0 },
      defaultLayers: ['grid', 'trajectory'],
      defaultTab: 'pendulum',
      canvasBackground: 'default-sky',
    },
    {
      id: 'damped-pendulum',
      label: 'Damped Swing',
      hookQuestion: 'Why does it slow down?',
      params: { shmType: 0, length: 1, theta0: 30, g: 9.8, damping: 0.3 },
      defaultLayers: ['grid', 'trajectory'],
      defaultTab: 'pendulum',
      canvasBackground: 'default-sky',
    },
    {
      id: 'bouncy-spring',
      label: 'Bouncy Spring',
      hookQuestion: 'What makes it bounce faster?',
      params: { shmType: 1, k: 10, mass: 1, amplitude: 0.2, damping: 0 },
      defaultLayers: ['grid', 'trajectory'],
      defaultTab: 'spring',
      canvasBackground: 'default-sky',
    },
    {
      id: 'stiff-spring',
      label: 'Stiff vs Soft',
      hookQuestion: 'Which spring bounces faster?',
      params: { shmType: 1, k: 50, mass: 1, amplitude: 0.15, damping: 0 },
      compareParams: { shmType: 1, k: 5, mass: 1, amplitude: 0.15, damping: 0 },
      defaultLayers: ['grid', 'trajectory'],
      defaultTab: 'spring',
      canvasBackground: 'default-sky',
    },
    {
      id: 'heavy-mass',
      label: 'Heavy Mass',
      hookQuestion: 'Does heavier mean slower?',
      params: { shmType: 1, k: 10, mass: 5, amplitude: 0.3, damping: 0 },
      defaultLayers: ['grid', 'trajectory'],
      defaultTab: 'spring',
      canvasBackground: 'default-sky',
    },
    {
      id: 'damped-spring',
      label: 'Damped Spring',
      hookQuestion: 'Where does the energy go?',
      params: { shmType: 1, k: 10, mass: 1, amplitude: 0.3, damping: 2 },
      defaultLayers: ['grid', 'trajectory', 'energyBar'],
      defaultTab: 'spring',
      canvasBackground: 'default-sky',
    },
    {
      id: 'gentle-wave',
      label: 'Gentle Wave',
      hookQuestion: 'How do particles move in a longitudinal wave?',
      params: { shmType: 1, k: 5, mass: 1, amplitude: 0.15, damping: 0 },
      defaultLayers: ['grid'],
      defaultTab: 'long-wave',
      canvasBackground: 'default-sky',
    },
    {
      id: 'fast-wave',
      label: 'Fast Wave',
      hookQuestion: 'What makes the wave move faster?',
      params: { shmType: 1, k: 50, mass: 0.5, amplitude: 0.2, damping: 0 },
      defaultLayers: ['grid'],
      defaultTab: 'long-wave',
      canvasBackground: 'default-sky',
    },
    {
      id: 'big-amplitude-wave',
      label: 'Big Amplitude',
      hookQuestion: 'How does amplitude change compression?',
      params: { shmType: 1, k: 10, mass: 1, amplitude: 0.5, damping: 0 },
      defaultLayers: ['grid'],
      defaultTab: 'long-wave',
      canvasBackground: 'default-sky',
    },
    {
      id: 'damped-wave',
      label: 'Damped Wave',
      hookQuestion: 'What happens when the wave loses energy?',
      params: { shmType: 1, k: 10, mass: 1, amplitude: 0.3, damping: 0.5 },
      defaultLayers: ['grid'],
      defaultTab: 'long-wave',
      canvasBackground: 'default-sky',
    },
  ],

  renderCanvas: renderSHMFrame,
  computeBounds: computeSHMBounds,

  derivedValueKeys: ['period', 'frequency', 'angularFreq', 'maxSpeed', 'currentSpeed', 'kineticEnergy', 'potentialEnergy', 'totalEnergy'],

  quizPool: SHM_QUIZ_POOL,
}

export default shmModule
