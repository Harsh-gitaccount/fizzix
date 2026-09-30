import type { SimulationModule } from '@/simulations/types'
import {
  opticsStateAtTime,
  opticsTimeOfFlight,
  opticsDerivedValues,
  opticsTrajectoryBounds,
} from '@/lib/physics/optics'
import { renderOpticsFrame, computeOpticsBounds } from '@/lib/canvas/opticsRenderer'
import { OPTICS_QUIZ_POOL } from './quiz'

const opticsModule: SimulationModule = {
  id: 'optics',
  slug: 'optics',
  name: 'Optics & Light',
  description: 'Refraction, lenses, and total internal reflection',
  classRange: '10-11',
  icon: '🔦',
  color: '#8B5CF6',

  stateAtTime: opticsStateAtTime,
  timeOfFlight: opticsTimeOfFlight,
  derivedValues: opticsDerivedValues,
  trajectoryBounds: opticsTrajectoryBounds,

  defaultParams: {
    opticsType: 0,
    n1: 1.0,
    n2: 1.5,
    theta1: 30,
    objectDist: -30,
    focalLength: 15,
    objectHeight: 10,
  },

  paramLimits: {
    opticsType: [0, 3],
    n1: [1.0, 2.5],
    n2: [1.0, 2.5],
    theta1: [0, 89],
    objectDist: [-100, -5],
    focalLength: [-50, 50],
    objectHeight: [1, 30],
  },

  paramDefs: [
    { key: 'n1', symbol: 'n₁', unit: '', min: 1.0, max: 2.5, step: 0.01, help: 'Refractive index of medium 1. Higher n means light slows down more.', helpHi: 'माध्यम 1 का अपवर्तनांक। अधिक n = प्रकाश अधिक धीमा।' },
    { key: 'n2', symbol: 'n₂', unit: '', min: 1.0, max: 2.5, step: 0.01, help: 'Refractive index of medium 2.', helpHi: 'माध्यम 2 का अपवर्तनांक।' },
    { key: 'theta1', symbol: 'θ₁', unit: '°', min: 0, max: 89, step: 1, help: 'Angle of incidence, measured from the normal.', helpHi: 'आपतन कोण, अभिलम्ब से मापा गया।' },
    { key: 'objectDist', symbol: 'u', unit: 'cm', min: -100, max: -5, step: 1, help: 'Object distance from lens. Negative means object is on the left (real object).', helpHi: 'लेंस से वस्तु की दूरी। ऋणात्मक = बायीं ओर (वास्तविक वस्तु)।' },
    { key: 'focalLength', symbol: 'f', unit: 'cm', min: -50, max: 50, step: 1, help: 'Focal length. Positive for convex lens, negative for concave lens.', helpHi: 'फोकस दूरी। धनात्मक = उत्तल लेंस, ऋणात्मक = अवतल लेंस।' },
    { key: 'objectHeight', symbol: 'h', unit: 'cm', min: 1, max: 30, step: 1, help: 'Object height.', helpHi: 'वस्तु की ऊँचाई।' },
  ],

  tabs: [
    { id: 'refraction', labelKey: 'tab.refraction' },
    { id: 'lenses', labelKey: 'tab.lenses' },
    { id: 'tir', labelKey: 'tab.tir' },
    { id: 'free-play', labelKey: 'tab.freePlay' },
  ],
  defaultTab: 'refraction',

  defaultLayers: {
    grid: true,
    rays: true,
    angles: true,
    values: true,
  },

  layerDefs: [
    { key: 'grid', label: 'Grid', labelHi: 'ग्रिड', icon: '#', defaultOn: true, color: '#6B7280' },
    { key: 'rays', label: 'Rays', labelHi: 'किरणें', icon: '→', defaultOn: true, color: '#3B82F6' },
    { key: 'angles', label: 'Angles', labelHi: 'कोण', icon: '∠', defaultOn: true, color: '#D97706' },
    { key: 'values', label: 'Values', labelHi: 'मान', icon: '=', defaultOn: true, color: '#3B82F6' },
  ],

  presets: [
    {
      id: 'air-to-glass',
      label: 'Air to Glass',
      hookQuestion: 'Which way does light bend when entering glass from air?',
      params: { opticsType: 0, n1: 1.0, n2: 1.5, theta1: 45 },
      defaultLayers: ['grid', 'rays', 'angles', 'values'],
      defaultTab: 'refraction',
      canvasBackground: 'default-sky',
    },
    {
      id: 'glass-to-air',
      label: 'Glass to Air',
      hookQuestion: 'Which way does light bend leaving glass?',
      params: { opticsType: 0, n1: 1.5, n2: 1.0, theta1: 25 },
      defaultLayers: ['grid', 'rays', 'angles', 'values'],
      defaultTab: 'refraction',
      canvasBackground: 'default-sky',
    },
    {
      id: 'water-to-air',
      label: 'Water to Air',
      hookQuestion: 'Why does a coin in water appear closer to the surface?',
      params: { opticsType: 0, n1: 1.33, n2: 1.0, theta1: 30 },
      defaultLayers: ['grid', 'rays', 'angles', 'values'],
      defaultTab: 'refraction',
      canvasBackground: 'default-sky',
    },
    {
      id: 'diamond-sparkle',
      label: 'Diamond Sparkle',
      hookQuestion: 'Why do diamonds sparkle so much?',
      params: { opticsType: 0, n1: 1.0, n2: 2.42, theta1: 40 },
      defaultLayers: ['grid', 'rays', 'angles', 'values'],
      defaultTab: 'refraction',
      canvasBackground: 'default-sky',
    },
    {
      id: 'convex-real',
      label: 'Convex - Real Image',
      hookQuestion: 'Where does the image form when the object is beyond 2F?',
      params: { opticsType: 1, objectDist: -40, focalLength: 15, objectHeight: 10 },
      defaultLayers: ['grid', 'rays', 'values'],
      defaultTab: 'lenses',
      canvasBackground: 'default-sky',
    },
    {
      id: 'convex-virtual',
      label: 'Convex - Magnifier',
      hookQuestion: 'What happens when the object is between F and the lens?',
      params: { opticsType: 1, objectDist: -10, focalLength: 15, objectHeight: 8 },
      defaultLayers: ['grid', 'rays', 'values'],
      defaultTab: 'lenses',
      canvasBackground: 'default-sky',
    },
    {
      id: 'concave-lens',
      label: 'Concave Lens',
      hookQuestion: 'Can a concave lens form a real image?',
      params: { opticsType: 1, objectDist: -30, focalLength: -15, objectHeight: 10 },
      defaultLayers: ['grid', 'rays', 'values'],
      defaultTab: 'lenses',
      canvasBackground: 'default-sky',
    },
    {
      id: 'tir-glass',
      label: 'Glass TIR',
      hookQuestion: 'At what angle does light get totally reflected inside glass?',
      params: { opticsType: 2, n1: 1.5, n2: 1.0, theta1: 42 },
      defaultLayers: ['grid', 'rays', 'angles', 'values'],
      defaultTab: 'tir',
      canvasBackground: 'default-sky',
    },
    {
      id: 'tir-diamond',
      label: 'Diamond TIR',
      hookQuestion: 'Why is diamond TIR critical angle so small?',
      params: { opticsType: 2, n1: 2.42, n2: 1.0, theta1: 25 },
      defaultLayers: ['grid', 'rays', 'angles', 'values'],
      defaultTab: 'tir',
      canvasBackground: 'default-sky',
    },
    {
      id: 'tir-fiber',
      label: 'Optical Fiber',
      hookQuestion: 'How does light travel through an optical fiber?',
      params: { opticsType: 2, n1: 1.5, n2: 1.0, theta1: 60 },
      defaultLayers: ['grid', 'rays', 'angles', 'values'],
      defaultTab: 'tir',
      canvasBackground: 'default-sky',
    },
    {
      id: 'convex-at-2f',
      label: 'Object at 2F',
      hookQuestion: 'What is special about placing the object at exactly 2F?',
      params: { opticsType: 1, objectDist: -30, focalLength: 15, objectHeight: 10 },
      defaultLayers: ['grid', 'rays', 'values'],
      defaultTab: 'lenses',
      canvasBackground: 'default-sky',
    },
    {
      id: 'no-refraction',
      label: 'No Bending',
      hookQuestion: 'What happens at 0 degree incidence?',
      params: { opticsType: 0, n1: 1.0, n2: 1.5, theta1: 0 },
      defaultLayers: ['grid', 'rays', 'angles', 'values'],
      defaultTab: 'refraction',
      canvasBackground: 'default-sky',
    },
  ],

  renderCanvas: renderOpticsFrame,
  computeBounds: computeOpticsBounds,

  derivedValueKeys: [
    'theta2', 'deviation', 'criticalAngle', 'tir',
    'imageDistance', 'magnification', 'power', 'imageNature',
    'isTIR',
  ],

  quizPool: OPTICS_QUIZ_POOL,
}

export default opticsModule
