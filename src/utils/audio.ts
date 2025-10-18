// Web Audio API utilities for procedural sound effects
// No external audio files needed!

let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  return audioContext
}

export function playPickupSound(ballSize: number) {
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime

    // Oscillator for the tone
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    // Frequency increases with ball size (higher pitch as you grow)
    osc.frequency.value = 200 + (ballSize * 50)
    osc.type = 'sine'

    // Envelope for a quick "boop" sound
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.3, now + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15)

    // Connect audio graph
    osc.connect(gain)
    gain.connect(ctx.destination)

    // Play
    osc.start(now)
    osc.stop(now + 0.15)
  } catch (error) {
    // Silently fail if audio is not supported
    console.warn('Audio playback failed:', error)
  }
}

export function playVictorySound() {
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime

    // Play a sequence of ascending notes
    const notes = [262, 330, 392, 523] // C, E, G, C (one octave up)

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.frequency.value = freq
      osc.type = 'triangle'

      const startTime = now + (i * 0.15)
      gain.gain.setValueAtTime(0, startTime)
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(startTime)
      osc.stop(startTime + 0.3)
    })
  } catch (error) {
    console.warn('Audio playback failed:', error)
  }
}

export function playJumpSound() {
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    // Quick ascending pitch
    osc.frequency.setValueAtTime(150, now)
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.1)
    osc.type = 'square'

    gain.gain.setValueAtTime(0.15, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.1)
  } catch (error) {
    console.warn('Audio playback failed:', error)
  }
}
