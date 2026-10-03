import type { SimulationModule } from '@/simulations/types'
import {
  elecStateAtTime,
  elecTimeOfFlight,
  elecDerivedValues,
  elecTrajectoryBounds,
} from '@/lib/physics/electrostatics'
import { renderElecFrame, computeElecBounds } from '@/lib/canvas/electrostaticsRenderer'
import { ELEC_QUIZ_POOL } from './quiz'

const electrostaticsModule: SimulationModule = {
  id: 'electrostatics',
  slug: 'electrostatics',
  name: 'Electrostatics & Circuits',
  description: 'Charges, electric fields, and circuits',
  classRange: '10-11',
  icon: '⚡',
  color: '#F59E0B',

  stateAtTime: elecStateAtTime,
  timeOfFlight: elecTimeOfFlight,
  derivedValues: elecDerivedValues,
  trajectoryBounds: elecTrajectoryBounds,

  defaultParams: {
    elecType: 0,
    q1: 2,
    q2: -2,
    distance: 0.5,
    voltage: 9,
    r1: 100,
    r2: 200,
  },

  paramLimits: {
    elecType: [0, 3],
    q1: [-10, 10],
    q2: [-10, 10],
    distance: [0.05, 2],
    voltage: [1, 24],
    r1: [1, 1000],
    r2: [1, 1000],
  },

  paramDefs: [
    { key: 'q1', symbol: 'q₁', unit: 'µC', min: -10, max: 10, step: 0.5, help: 'Charge 1 - positive (+) or negative (-). Like charges repel, unlike attract.', helpHi: 'आवेश 1 - धन (+) या ऋण (-)। समान आवेश प्रतिकर्षित, विपरीत आकर्षित।' },
    { key: 'q2', symbol: 'q₂', unit: 'µC', min: -10, max: 10, step: 0.5, help: 'Charge 2 - positive (+) or negative (-).', helpHi: 'आवेश 2 - धन (+) या ऋण (-)।' },
    { key: 'distance', symbol: 'r', unit: 'm', min: 0.05, max: 2, step: 0.05, help: 'Distance between the two charges. Force drops as r².', helpHi: 'दोनों आवेशों के बीच दूरी। बल r² से घटता है।' },
    { key: 'voltage', symbol: 'V', unit: 'V', min: 1, max: 24, step: 0.5, help: 'Battery voltage - the push that drives current through the circuit.', helpHi: 'बैटरी वोल्टेज - वह धक्का जो धारा को परिपथ में चलाता है।' },
    { key: 'r1', symbol: 'R₁', unit: 'Ω', min: 1, max: 1000, step: 1, help: 'Resistance 1 - opposes current flow. Higher R means less current.', helpHi: 'प्रतिरोध 1 - धारा के प्रवाह का विरोध करता है। अधिक R = कम धारा।' },
    { key: 'r2', symbol: 'R₂', unit: 'Ω', min: 1, max: 1000, step: 1, help: 'Resistance 2 - second resistor for series/parallel comparison.', helpHi: 'प्रतिरोध 2 - श्रेणी/समानांतर तुलना के लिए दूसरा प्रतिरोध।' },
  ],

  tabs: [
    { id: 'charges', labelKey: 'tab.charges' },
    { id: 'field-lines', labelKey: 'tab.fieldLines' },
    { id: 'simple-circuit', labelKey: 'tab.simpleCircuit' },
    { id: 'series-parallel', labelKey: 'tab.seriesParallel' },
    { id: 'field-3d', labelKey: 'tab.field3d' },
  ],
  defaultTab: 'charges',

  defaultLayers: {
    grid: true,
    forceVectors: true,
    fieldLines: true,
    values: true,
    currentDots: true,
  },

  layerDefs: [
    { key: 'grid', label: 'Grid', labelHi: 'ग्रिड', icon: '#', defaultOn: true, color: '#6B7280' },
    { key: 'forceVectors', label: 'Force Vectors', labelHi: 'बल सदिश', icon: '→', defaultOn: true, color: '#F59E0B' },
    { key: 'fieldLines', label: 'Field Lines', labelHi: 'क्षेत्र रेखाएँ', icon: '∼', defaultOn: true, color: '#8B5CF6' },
    { key: 'values', label: 'Values', labelHi: 'मान', icon: '=', defaultOn: true, color: '#3B82F6' },
    { key: 'currentDots', label: 'Current Flow', labelHi: 'धारा प्रवाह', icon: '●', defaultOn: true, color: '#F59E0B' },
  ],

  presets: [
    {
      id: 'opposite-charges',
      label: 'Opposite Charges',
      hookQuestion: 'Do opposite charges attract or repel?',
      params: { elecType: 0, q1: 3, q2: -3, distance: 0.5 },
      defaultLayers: ['grid', 'forceVectors', 'values'],
      defaultTab: 'charges',
      canvasBackground: 'default-sky',
    },
    {
      id: 'same-charges',
      label: 'Like Charges',
      hookQuestion: 'What happens between two positive charges?',
      params: { elecType: 0, q1: 3, q2: 3, distance: 0.5 },
      defaultLayers: ['grid', 'forceVectors', 'values'],
      defaultTab: 'charges',
      canvasBackground: 'default-sky',
    },
    {
      id: 'distance-effect',
      label: 'Distance Matters',
      hookQuestion: 'How much does doubling the distance change the force?',
      params: { elecType: 0, q1: 3, q2: -3, distance: 0.3 },
      compareParams: { elecType: 0, q1: 3, q2: -3, distance: 0.6 },
      defaultLayers: ['grid', 'forceVectors', 'values'],
      defaultTab: 'charges',
      canvasBackground: 'default-sky',
    },
    {
      id: 'dipole-field',
      label: 'Dipole Field',
      hookQuestion: 'How do field lines connect opposite charges?',
      params: { elecType: 1, q1: 3, q2: -3, distance: 0.8 },
      defaultLayers: ['grid', 'fieldLines', 'values'],
      defaultTab: 'field-lines',
      canvasBackground: 'default-sky',
    },
    {
      id: 'same-sign-field',
      label: 'Same-Sign Field',
      hookQuestion: 'What happens to field lines between two positive charges?',
      params: { elecType: 1, q1: 3, q2: 3, distance: 0.8 },
      defaultLayers: ['grid', 'fieldLines', 'values'],
      defaultTab: 'field-lines',
      canvasBackground: 'default-sky',
    },
    {
      id: 'simple-bulb',
      label: 'Simple Bulb',
      hookQuestion: 'How much current flows through a simple circuit?',
      params: { elecType: 2, voltage: 9, r1: 100, r2: 100 },
      defaultLayers: ['grid', 'currentDots', 'values'],
      defaultTab: 'simple-circuit',
      canvasBackground: 'default-sky',
    },
    {
      id: 'series-circuit',
      label: 'Series vs Parallel',
      hookQuestion: 'Which arrangement has more current?',
      params: { elecType: 3, voltage: 9, r1: 100, r2: 200 },
      defaultLayers: ['grid', 'currentDots', 'values'],
      defaultTab: 'series-parallel',
      canvasBackground: 'default-sky',
    },
    {
      id: 'equal-resistors',
      label: 'Equal Resistors',
      hookQuestion: 'If R₁ = R₂, what is the parallel resistance?',
      params: { elecType: 3, voltage: 12, r1: 100, r2: 100 },
      defaultLayers: ['grid', 'currentDots', 'values'],
      defaultTab: 'series-parallel',
      canvasBackground: 'default-sky',
    },
    {
      id: '3d-dipole',
      label: '3D Dipole',
      hookQuestion: 'How do field lines look in 3D between opposite charges?',
      params: { elecType: 1, q1: 3, q2: -3, distance: 0.8 },
      defaultLayers: ['grid', 'fieldLines'],
      defaultTab: 'field-3d',
      canvasBackground: 'default-sky',
    },
    {
      id: '3d-like-charges',
      label: '3D Like Charges',
      hookQuestion: 'What do field lines look like between two positive charges in 3D?',
      params: { elecType: 1, q1: 3, q2: 3, distance: 0.8 },
      defaultLayers: ['grid', 'fieldLines'],
      defaultTab: 'field-3d',
      canvasBackground: 'default-sky',
    },
    {
      id: '3d-strong-attraction',
      label: '3D Strong Attraction',
      hookQuestion: 'What happens when large opposite charges are very close?',
      params: { elecType: 1, q1: 8, q2: -8, distance: 0.3 },
      defaultLayers: ['grid', 'fieldLines'],
      defaultTab: 'field-3d',
      canvasBackground: 'default-sky',
    },
    {
      id: '3d-weak-field',
      label: '3D Weak Field',
      hookQuestion: 'Can you see the field when charges are far apart?',
      params: { elecType: 1, q1: 1, q2: -1, distance: 1.5 },
      defaultLayers: ['grid', 'fieldLines'],
      defaultTab: 'field-3d',
      canvasBackground: 'default-sky',
    },
  ],

  renderCanvas: renderElecFrame,
  computeBounds: computeElecBounds,

  derivedValueKeys: [
    'force', 'forceMag', 'fieldMid',
    'current', 'voltageVal', 'power',
    'rSeries', 'rParallel', 'iSeries', 'iParallel',
  ],

  quizPool: ELEC_QUIZ_POOL,
}

export default electrostaticsModule
