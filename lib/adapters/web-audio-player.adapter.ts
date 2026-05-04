import { AudioPlayerPort } from '../ports/audio-player.port'

/**
 * Adapter for the Web Audio API to handle audio playback.
 *
 * @remarks
 * Implements a simple synthesizer using oscillators for note playback.
 * This can be expanded later to use real violin samples.
 *
 * @public
 */
export class WebAudioPlayerAdapter implements AudioPlayerPort {
  private context: AudioContext
  private masterGain: GainNode
  private activeNodes: Set<AudioNode> = new Set()

  constructor(context: AudioContext) {
    this.context = context
    this.masterGain = this.context.createGain()
    this.masterGain.connect(this.context.destination)
  }

  async playNote(frequency: number, durationMs: number, volume: number = 0.5): Promise<void> {
    if (this.context.state === 'suspended') {
      await this.context.resume()
    }

    const osc = this.context.createOscillator()
    const noteGain = this.context.createGain()

    // Use a triangle wave for a softer, more violin-like synthetic sound
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(frequency, this.context.currentTime)

    // Simple envelope to avoid clicks
    const attack = 0.05
    const release = 0.1
    const now = this.context.currentTime
    const endTime = now + durationMs / 1000

    noteGain.gain.setValueAtTime(0, now)
    noteGain.gain.linearRampToValueAtTime(volume, now + attack)
    noteGain.gain.setValueAtTime(volume, endTime - release)
    noteGain.gain.linearRampToValueAtTime(0, endTime)

    osc.connect(noteGain)
    noteGain.connect(this.masterGain)

    osc.start(now)
    osc.stop(endTime)

    this.activeNodes.add(osc)
    this.activeNodes.add(noteGain)

    osc.onended = () => {
      osc.disconnect()
      noteGain.disconnect()
      this.activeNodes.delete(osc)
      this.activeNodes.delete(noteGain)
    }
  }

  stopAll(): void {
    this.activeNodes.forEach((node) => {
      if (node instanceof OscillatorNode) {
        try {
          node.stop()
        } catch (_e) {
          // Ignore if already stopped
        }
      }
      node.disconnect()
    })
    this.activeNodes.clear()
  }

  async cleanup(): Promise<void> {
    this.stopAll()
    this.masterGain.disconnect()
  }
}
