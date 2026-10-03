import type { SimulationModule } from '@/simulations/types'
import {
  modernStateAtTime,
  modernTimeOfFlight,
  modernDerivedValues,
  modernTrajectoryBounds,
} from '@/lib/physics/modernPhysics'
import { renderModernPhysicsFrame, computeModernPhysicsBounds } from '@/lib/canvas/modernPhysicsRenderer'
import { MODERN_PHYSICS_QUIZ_POOL } from './quiz'

const modernPhysicsModule: SimulationModule = {
  id: 'modern-physics',
  slug: 'modern-physics',
  name: 'Modern Physics',
  description: 'Photoelectric effect, Bohr model, and radioactive decay',
  classRange: '12',
  icon: '⚛',
  color: '#7C3AED',

  stateAtTime: modernStateAtTime,
  timeOfFlight: modernTimeOfFlight,
  derivedValues: modernDerivedValues,
  trajectoryBounds: modernTrajectoryBounds,

  defaultParams: {
    modernType: 0,
    wavelength: 400,
    workFunction: 2.14,
    intensity: 50,
    orbitN: 1,
    atomicZ: 1,
    transitionFrom: 3,
    transitionTo: 2,
    halfLife: 10,
    N0: 1000,
  },

  paramLimits: {
    modernType: [0, 3],
    wavelength: [100, 800],
    workFunction: [1.5, 6],
    intensity: [10, 100],
    orbitN: [1, 6],
    atomicZ: [1, 3],
    transitionFrom: [2, 6],
    transitionTo: [1, 5],
    halfLife: [1, 100],
    N0: [100, 10000],
  },

  paramDefs: [
    { key: 'wavelength', symbol: 'λ', unit: 'nm', min: 100, max: 800, step: 10, help: 'Wavelength of incident light. Shorter wavelength = higher energy photons.', helpHi: 'आपतित प्रकाश की तरंगदैर्ध्य। छोटी तरंगदैर्ध्य = अधिक ऊर्जा फोटॉन।' },
    { key: 'workFunction', symbol: 'φ', unit: 'eV', min: 1.5, max: 6, step: 0.01, help: 'Work function of the metal. Minimum energy to free an electron.', helpHi: 'धातु का कार्य फलन। इलेक्ट्रॉन मुक्त करने की न्यूनतम ऊर्जा।' },
    { key: 'intensity', symbol: 'I', unit: '%', min: 10, max: 100, step: 5, help: 'Light intensity. More intensity = more photons per second.', helpHi: 'प्रकाश तीव्रता। अधिक तीव्रता = प्रति सेकंड अधिक फोटॉन।' },
    { key: 'orbitN', symbol: 'n', unit: '', min: 1, max: 6, step: 1, help: 'Principal quantum number. Electron orbit number (1 = ground state).', helpHi: 'मुख्य क्वांटम संख्या। इलेक्ट्रॉन कक्षा संख्या (1 = मूल अवस्था)।' },
    { key: 'transitionFrom', symbol: 'n₁', unit: '', min: 2, max: 6, step: 1, help: 'Upper energy level for transition.', helpHi: 'संक्रमण के लिए ऊपरी ऊर्जा स्तर।' },
    { key: 'transitionTo', symbol: 'n₂', unit: '', min: 1, max: 5, step: 1, help: 'Lower energy level for transition.', helpHi: 'संक्रमण के लिए निचला ऊर्जा स्तर।' },
    { key: 'halfLife', symbol: 'T½', unit: 's', min: 1, max: 100, step: 1, help: 'Half-life of the radioactive substance.', helpHi: 'रेडियोधर्मी पदार्थ की अर्ध-आयु।' },
    { key: 'N0', symbol: 'N₀', unit: '', min: 100, max: 10000, step: 100, help: 'Initial number of radioactive nuclei.', helpHi: 'रेडियोधर्मी नाभिकों की प्रारंभिक संख्या।' },
  ],

  tabs: [
    { id: 'photoelectric', labelKey: 'tab.photoelectric' },
    { id: 'bohr', labelKey: 'tab.bohr' },
    { id: 'decay', labelKey: 'tab.decay' },
    { id: 'free-play', labelKey: 'tab.freePlay' },
  ],
  defaultTab: 'photoelectric',

  defaultLayers: {
    energyBars: true,
    energyLevels: true,
    transition: true,
    halfLifeMarkers: true,
  },

  layerDefs: [
    { key: 'energyBars', label: 'Energy Bars', labelHi: 'ऊर्जा बार', icon: '▓', defaultOn: true, color: '#F59E0B' },
    { key: 'energyLevels', label: 'Energy Levels', labelHi: 'ऊर्जा स्तर', icon: 'E', defaultOn: true, color: '#8B5CF6' },
    { key: 'transition', label: 'Transition', labelHi: 'संक्रमण', icon: '↓', defaultOn: true, color: '#F59E0B' },
    { key: 'halfLifeMarkers', label: 'Half-life Markers', labelHi: 'अर्ध-आयु चिह्न', icon: 'T', defaultOn: true, color: '#EF4444' },
  ],

  presets: [
    {
      id: 'cs-violet',
      label: 'Cs + Violet Light',
      hookQuestion: 'Will violet light eject electrons from Cesium?',
      params: { modernType: 0, wavelength: 400, workFunction: 2.14, intensity: 50 },
      defaultLayers: ['energyBars'],
      defaultTab: 'photoelectric',
      canvasBackground: 'default-sky',
    },
    {
      id: 'cs-red-no-emission',
      label: 'Cs + Red Light',
      hookQuestion: 'Why does red light NOT eject electrons from Cesium?',
      params: { modernType: 0, wavelength: 700, workFunction: 2.14, intensity: 100 },
      defaultLayers: ['energyBars'],
      defaultTab: 'photoelectric',
      canvasBackground: 'default-sky',
    },
    {
      id: 'cu-uv',
      label: 'Cu + UV Light',
      hookQuestion: 'Copper needs UV light to emit. Why?',
      params: { modernType: 0, wavelength: 200, workFunction: 4.65, intensity: 50 },
      defaultLayers: ['energyBars'],
      defaultTab: 'photoelectric',
      canvasBackground: 'default-sky',
    },
    {
      id: 'bohr-ground',
      label: 'Hydrogen Ground State',
      hookQuestion: 'What is the energy of an electron in the ground state?',
      params: { modernType: 1, orbitN: 1, atomicZ: 1, transitionFrom: 3, transitionTo: 2 },
      defaultLayers: ['energyLevels', 'transition'],
      defaultTab: 'bohr',
      canvasBackground: 'default-sky',
    },
    {
      id: 'bohr-balmer',
      label: 'Balmer Alpha (Red)',
      hookQuestion: 'Why does hydrogen glow red?',
      params: { modernType: 1, orbitN: 3, atomicZ: 1, transitionFrom: 3, transitionTo: 2 },
      defaultLayers: ['energyLevels', 'transition'],
      defaultTab: 'bohr',
      canvasBackground: 'default-sky',
    },
    {
      id: 'bohr-lyman',
      label: 'Lyman Alpha (UV)',
      hookQuestion: 'Is the 2 to 1 transition visible?',
      params: { modernType: 1, orbitN: 2, atomicZ: 1, transitionFrom: 2, transitionTo: 1 },
      defaultLayers: ['energyLevels', 'transition'],
      defaultTab: 'bohr',
      canvasBackground: 'default-sky',
    },
    {
      id: 'bohr-helium',
      label: 'He+ Ion (Z=2)',
      hookQuestion: 'How does Z affect energy levels?',
      params: { modernType: 1, orbitN: 1, atomicZ: 2, transitionFrom: 3, transitionTo: 2 },
      defaultLayers: ['energyLevels', 'transition'],
      defaultTab: 'bohr',
      canvasBackground: 'default-sky',
    },
    {
      id: 'decay-fast',
      label: 'Fast Decay (T=5s)',
      hookQuestion: 'How quickly does a fast-decaying isotope lose half its nuclei?',
      params: { modernType: 2, halfLife: 5, N0: 1000 },
      defaultLayers: ['halfLifeMarkers'],
      defaultTab: 'decay',
      canvasBackground: 'default-sky',
    },
    {
      id: 'decay-slow',
      label: 'Slow Decay (T=50s)',
      hookQuestion: 'How does a longer half-life change the decay curve?',
      params: { modernType: 2, halfLife: 50, N0: 1000 },
      defaultLayers: ['halfLifeMarkers'],
      defaultTab: 'decay',
      canvasBackground: 'default-sky',
    },
    {
      id: 'decay-large-sample',
      label: 'Large Sample',
      hookQuestion: 'Does sample size affect decay rate?',
      params: { modernType: 2, halfLife: 10, N0: 5000 },
      defaultLayers: ['halfLifeMarkers'],
      defaultTab: 'decay',
      canvasBackground: 'default-sky',
    },
    {
      id: 'photoelectric-threshold',
      label: 'Near Threshold',
      hookQuestion: 'What happens when photon energy is near the work function?',
      params: { modernType: 0, wavelength: 580, workFunction: 2.14, intensity: 50 },
      defaultLayers: ['energyBars'],
      defaultTab: 'photoelectric',
      canvasBackground: 'default-sky',
    },
    {
      id: 'bohr-high-orbit',
      label: 'High Orbit (n=5)',
      hookQuestion: 'What happens at very high energy levels?',
      params: { modernType: 1, orbitN: 5, atomicZ: 1, transitionFrom: 5, transitionTo: 1 },
      defaultLayers: ['energyLevels', 'transition'],
      defaultTab: 'bohr',
      canvasBackground: 'default-sky',
    },
  ],

  renderCanvas: renderModernPhysicsFrame,
  computeBounds: computeModernPhysicsBounds,

  derivedValueKeys: [
    'photonEnergy', 'maxKE', 'stoppingV', 'thresholdFreq', 'thresholdWL', 'maxSpeed', 'emission',
    'energy', 'radius', 'speed', 'transitionE', 'transitionWL',
    'remaining', 'decayed', 'activityVal', 'halfLives', 'fractionLeft',
  ],

  quizPool: MODERN_PHYSICS_QUIZ_POOL,
}

export default modernPhysicsModule
