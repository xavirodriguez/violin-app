import { Howl } from 'howler'
import { AudioReferenceMap, NoteTimestamp } from '../domain/audio'

/**
 * AudioPlayerService
 *
 * Handles playback of reference audio and isolated note samples.
 */
export class AudioPlayerService {
  private activeHowl: Howl | null = null
  private noteSamples: Map<string, Howl> = new Map()

  /**
   * Plays a full audio reference for an exercise.
   */
  async playReference(audioUrl: string, onProgress?: (noteIndex: number) => void): Promise<void> {
    this.stopAll()

    return new Promise((resolve, reject) => {
      this.activeHowl = new Howl({
        src: [audioUrl],
        html5: true,
        onload: () => {
          this.activeHowl?.play()
        },
        onend: () => {
          resolve()
        },
        onloaderror: (id, err) => {
          reject(new Error(`Failed to load audio: ${err}`))
        },
        onplayerror: (id, err) => {
          reject(new Error(`Failed to play audio: ${err}`))
        }
      })
    })
  }

  /**
   * Plays an isolated note sample.
   */
  playNote(sampleUrl: string): void {
    let howl = this.noteSamples.get(sampleUrl)
    if (!howl) {
      howl = new Howl({
        src: [sampleUrl],
        volume: 0.8
      })
      this.noteSamples.set(sampleUrl, howl)
    }
    howl.stop()
    howl.play()
  }

  /**
   * Stops all currently playing audio.
   */
  stopAll(): void {
    if (this.activeHowl) {
      this.activeHowl.stop()
      this.activeHowl.unload()
      this.activeHowl = null
    }
    this.noteSamples.forEach(howl => howl.stop())
  }

  /**
   * Seeks to a specific time in the active playback.
   */
  seek(timeMs: number): void {
    if (this.activeHowl) {
      this.activeHowl.seek(timeMs / 1000)
    }
  }

  /**
   * Checks if audio is currently playing.
   */
  isPlaying(): boolean {
    return this.activeHowl?.playing() ?? false
  }
}

export const audioPlayerService = new AudioPlayerService()
