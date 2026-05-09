import { MetronomeEngine } from '../infrastructure/metronome-engine'
import { MetronomeConfig } from '../domain/audio'

/**
 * MetronomeService
 *
 * Provides a high-precision metronome.
 * Refactored to use native Web Audio via MetronomeEngine to avoid Tone.js issues in CI.
 */
export class MetronomeService {
  private engine: MetronomeEngine | null = null

  initialize() {
    if (this.engine) return
    this.engine = new MetronomeEngine(() => {})
  }

  start(config: MetronomeConfig) {
    if (typeof window === 'undefined') return

    this.initialize()
    this.engine?.start(config.bpm * config.tempoMultiplier)
  }

  stop() {
    this.engine?.stop()
  }

  setBpm(bpm: number, multiplier: number = 1.0) {
    this.engine?.setTempo(bpm * multiplier)
  }

  async setSoundType(type: MetronomeConfig['soundType']) {
    // soundType customization not yet supported in native MetronomeEngine
  }
}

export const metronomeService = new MetronomeService()
