let ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.15,
  freqEnd?: number
) {
  const ac = getCtx()
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, ac.currentTime)
  if (freqEnd) {
    osc.frequency.linearRampToValueAtTime(freqEnd, ac.currentTime + duration)
  }
  gain.gain.setValueAtTime(volume, ac.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration)
  osc.connect(gain)
  gain.connect(ac.destination)
  osc.start()
  osc.stop(ac.currentTime + duration)
}

function playNoise(duration: number, volume = 0.08) {
  const ac = getCtx()
  const bufferSize = Math.floor(ac.sampleRate * duration)
  const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize)
  }
  const source = ac.createBufferSource()
  source.buffer = buffer
  const gain = ac.createGain()
  gain.gain.setValueAtTime(volume, ac.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration)

  const filter = ac.createBiquadFilter()
  filter.type = 'highpass'
  filter.frequency.value = 4000

  source.connect(filter)
  filter.connect(gain)
  gain.connect(ac.destination)
  source.start()
}

export type SoundEffect =
  | 'launch'
  | 'land'
  | 'peak'
  | 'reset'
  | 'tick'
  | 'quiz_correct'
  | 'quiz_wrong'
  | 'screenshot'

export function playSound(effect: SoundEffect) {
  try {
    switch (effect) {
      case 'launch':
        playTone(220, 0.15, 'sine', 0.12, 440)
        break
      case 'land':
        playTone(80, 0.12, 'triangle', 0.18)
        playNoise(0.06, 0.06)
        break
      case 'peak':
        playTone(660, 0.2, 'sine', 0.08)
        setTimeout(() => playTone(880, 0.15, 'sine', 0.06), 80)
        break
      case 'reset':
        playTone(400, 0.12, 'sine', 0.1, 200)
        break
      case 'tick':
        playTone(1200, 0.025, 'square', 0.04)
        break
      case 'quiz_correct': {
        playTone(523, 0.12, 'sine', 0.1)
        setTimeout(() => playTone(659, 0.12, 'sine', 0.1), 100)
        setTimeout(() => playTone(784, 0.18, 'sine', 0.1), 200)
        break
      }
      case 'quiz_wrong':
        playTone(200, 0.2, 'sawtooth', 0.06, 100)
        break
      case 'screenshot':
        playNoise(0.08, 0.12)
        setTimeout(() => playNoise(0.04, 0.06), 100)
        break
    }
  } catch {
    // Web Audio API not available
  }
}
