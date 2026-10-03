import type { SimulationModule } from '@/simulations/types'
import {
  thermoStateAtTime,
  thermoTimeOfFlight,
  thermoDerivedValues,
  thermoTrajectoryBounds,
} from '@/lib/physics/thermodynamics'
import { renderThermoFrame, computeThermoBounds } from '@/lib/canvas/thermoRenderer'
import { THERMO_QUIZ_POOL } from './quiz'

const thermoModule: SimulationModule = {
  id: 'thermodynamics',
  slug: 'thermodynamics',
  name: 'Thermodynamics',
  description: 'Kinetic theory, ideal gas law, and molecular motion',
  classRange: '11',
  icon: '🔥',
  color: '#EF4444',

  stateAtTime: thermoStateAtTime,
  timeOfFlight: thermoTimeOfFlight,
  derivedValues: thermoDerivedValues,
  trajectoryBounds: thermoTrajectoryBounds,

  defaultParams: {
    thermoType: 0,
    temperature: 300,
    moles: 1,
    volume: 22.4,
    molarMass: 28,
    pistonPos: 0.7,
    numSmall: 80,
  },

  paramLimits: {
    thermoType: [0, 3],
    temperature: [100, 1000],
    moles: [0.1, 5],
    volume: [1, 100],
    molarMass: [2, 44],
    pistonPos: [0.3, 1.0],
    numSmall: [20, 150],
  },

  paramDefs: [
    { key: 'temperature', symbol: 'T', unit: 'K', min: 100, max: 1000, step: 10, help: 'Temperature in Kelvin. Higher T means faster particles.', helpHi: 'केल्विन में तापमान। अधिक T = तेज़ कण।' },
    { key: 'moles', symbol: 'n', unit: 'mol', min: 0.1, max: 5, step: 0.1, help: 'Amount of gas in moles. More moles = more particles.', helpHi: 'गैस की मात्रा (मोल)। अधिक मोल = अधिक कण।' },
    { key: 'volume', symbol: 'V', unit: 'L', min: 1, max: 100, step: 0.2, help: 'Container volume in litres. Larger V = lower pressure.', helpHi: 'पात्र का आयतन (लीटर)। अधिक V = कम दाब।' },
    { key: 'molarMass', symbol: 'M', unit: 'g/mol', min: 2, max: 44, step: 1, help: 'Molar mass. H₂=2, He=4, N₂=28, O₂=32, CO₂=44.', helpHi: 'मोलर द्रव्यमान। H₂=2, He=4, N₂=28, O₂=32, CO₂=44।' },
    { key: 'pistonPos', symbol: 'x', unit: '', min: 0.3, max: 1.0, step: 0.01, help: 'Piston position. Slide left to compress the gas.', helpHi: 'पिस्टन स्थिति। गैस संपीड़ित करने के लिए बाएँ खिसकाएँ।' },
    { key: 'numSmall', symbol: 'N', unit: '', min: 20, max: 150, step: 5, help: 'Number of small gas molecules for Brownian motion.', helpHi: 'ब्राउनी गति के लिए छोटे गैस अणुओं की संख्या।' },
  ],

  tabs: [
    { id: 'gas', labelKey: 'tab.gasParticles' },
    { id: 'piston', labelKey: 'tab.piston' },
    { id: 'brownian', labelKey: 'tab.brownian' },
    { id: 'free-play', labelKey: 'tab.freePlay' },
  ],
  defaultTab: 'gas',

  defaultLayers: {
    speedColors: true,
    pressure: false,
    histogram: false,
    trace: true,
  },

  layerDefs: [
    { key: 'speedColors', label: 'Speed Colors', labelHi: 'चाल रंग', icon: '🎨', defaultOn: true, color: '#3B82F6' },
    { key: 'pressure', label: 'Pressure Arrows', labelHi: 'दाब तीर', icon: '→', defaultOn: false, color: '#EF4444' },
    { key: 'histogram', label: 'Speed Distribution', labelHi: 'चाल वितरण', icon: '📊', defaultOn: false, color: '#10B981' },
    { key: 'trace', label: 'Brownian Trace', labelHi: 'ब्राउनी पथ', icon: '~', defaultOn: true, color: '#8B5CF6' },
  ],

  presets: [
    {
      id: 'room-temp-n2',
      label: 'Room Temp N₂',
      hookQuestion: 'How fast do nitrogen molecules move at room temperature?',
      params: { thermoType: 0, temperature: 300, moles: 1, volume: 22.4, molarMass: 28 },
      defaultLayers: ['speedColors'],
      defaultTab: 'gas',
      canvasBackground: 'lab',
    },
    {
      id: 'hot-gas',
      label: 'Hot Gas',
      hookQuestion: 'What happens to particle speed when you double the temperature?',
      params: { thermoType: 0, temperature: 600, moles: 1, volume: 22.4, molarMass: 28 },
      defaultLayers: ['speedColors', 'histogram'],
      defaultTab: 'gas',
      canvasBackground: 'lab',
    },
    {
      id: 'light-vs-heavy',
      label: 'Light vs Heavy',
      hookQuestion: 'Which gas moves faster at the same temperature: H₂ or O₂?',
      params: { thermoType: 0, temperature: 300, moles: 1, volume: 22.4, molarMass: 2 },
      compareParams: { thermoType: 0, temperature: 300, moles: 1, volume: 22.4, molarMass: 32 },
      defaultLayers: ['speedColors', 'histogram'],
      defaultTab: 'gas',
      canvasBackground: 'lab',
    },
    {
      id: 'compress-piston',
      label: 'Compress Gas',
      hookQuestion: 'What happens to pressure when you push the piston in?',
      params: { thermoType: 1, temperature: 300, moles: 1, volume: 22.4, molarMass: 28, pistonPos: 0.7 },
      defaultLayers: ['speedColors', 'pressure'],
      defaultTab: 'piston',
      canvasBackground: 'lab',
    },
    {
      id: 'boyles-law',
      label: "Boyle's Law",
      hookQuestion: 'If you halve the volume, what happens to pressure?',
      params: { thermoType: 1, temperature: 300, moles: 1, volume: 22.4, molarMass: 28, pistonPos: 1.0 },
      defaultLayers: ['speedColors', 'pressure'],
      defaultTab: 'piston',
      canvasBackground: 'lab',
    },
    {
      id: 'hot-piston',
      label: 'Hot Piston',
      hookQuestion: 'Does heating a gas push the piston out?',
      params: { thermoType: 1, temperature: 500, moles: 1, volume: 22.4, molarMass: 28, pistonPos: 0.5 },
      defaultLayers: ['speedColors', 'pressure'],
      defaultTab: 'piston',
      canvasBackground: 'lab',
    },
    {
      id: 'brownian-pollen',
      label: 'Pollen Grain',
      hookQuestion: 'Why does a pollen grain jiggle in water?',
      params: { thermoType: 2, temperature: 300, molarMass: 28, numSmall: 80 },
      defaultLayers: ['speedColors', 'trace'],
      defaultTab: 'brownian',
      canvasBackground: 'lab',
    },
    {
      id: 'brownian-hot',
      label: 'Hot Brownian',
      hookQuestion: 'Does Brownian motion get faster at higher temperature?',
      params: { thermoType: 2, temperature: 600, molarMass: 28, numSmall: 80 },
      defaultLayers: ['speedColors', 'trace'],
      defaultTab: 'brownian',
      canvasBackground: 'lab',
    },
    {
      id: 'brownian-crowded',
      label: 'Crowded Gas',
      hookQuestion: 'More molecules = more collisions. Does the big particle move more?',
      params: { thermoType: 2, temperature: 300, molarMass: 28, numSmall: 150 },
      defaultLayers: ['speedColors', 'trace'],
      defaultTab: 'brownian',
      canvasBackground: 'lab',
    },
    {
      id: 'helium-balloon',
      label: 'Helium Balloon',
      hookQuestion: 'Why does helium escape through a balloon?',
      params: { thermoType: 0, temperature: 300, moles: 0.5, volume: 10, molarMass: 4 },
      defaultLayers: ['speedColors', 'histogram'],
      defaultTab: 'gas',
      canvasBackground: 'lab',
    },
    {
      id: 'stp-conditions',
      label: 'STP',
      hookQuestion: 'What is the pressure of 1 mol gas at STP?',
      params: { thermoType: 0, temperature: 273, moles: 1, volume: 22.4, molarMass: 28 },
      defaultLayers: ['speedColors', 'pressure'],
      defaultTab: 'gas',
      canvasBackground: 'lab',
    },
    {
      id: 'co2-heavy',
      label: 'Heavy CO₂',
      hookQuestion: 'Why is CO₂ slower than N₂ at the same temperature?',
      params: { thermoType: 0, temperature: 300, moles: 1, volume: 22.4, molarMass: 44 },
      defaultLayers: ['speedColors', 'histogram'],
      defaultTab: 'gas',
      canvasBackground: 'lab',
    },
  ],

  renderCanvas: renderThermoFrame,
  computeBounds: computeThermoBounds,

  derivedValueKeys: [
    'pressure', 'pv', 'avgKE', 'rmsSpeed', 'avgSpeed', 'totalKE',
  ],

  quizPool: THERMO_QUIZ_POOL,
}

export default thermoModule
