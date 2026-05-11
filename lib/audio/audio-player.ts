import { WebAudioPlayerAdapter } from '../adapters/web-audio-player.adapter'
import { audioManager } from '../infrastructure/audio-manager'

/**
 * Centralized audio player service for the MVP.
 */
class AudioPlayerService {
  private adapter: WebAudioPlayerAdapter | null = null

  private async getAdapter(): Promise<WebAudioPlayerAdapter> {
    if (!this.adapter) {
      const resources = await audioManager.initialize()
      this.adapter = new WebAudioPlayerAdapter(resources.context)
    }
    return this.adapter
  }

  async playNote(frequency: number, durationMs: number = 1000): Promise<void> {
    const adapter = await this.getAdapter()
    await adapter.playNote(frequency, durationMs)
  }

  async playReference(url: string, onTimeUpdate?: (timeMs: number) => void): Promise<void> {
    // For MVP, we use a simple oscillator if URL is not a real audio file
    // In a real app, this would use an HTMLAudioElement or BufferSource
    console.log(`[AudioPlayerService] Playing reference: ${url}`)
    // Simulation of playback time for OSMD sync
    if (onTimeUpdate) {
      let time = 0
      const interval = setInterval(() => {
        time += 100
        onTimeUpdate(time)
        if (time > 3000) clearInterval(interval)
      }, 100)
    }
  }

  stopAll(): void {
    this.adapter?.stopAll()
  }
}

export const audioPlayerService = new AudioPlayerService()
