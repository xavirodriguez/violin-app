import { AudioPlayerPort } from './ports/audio-player.port'
import { Exercise } from '@/lib/domain/exercise'
import { NoteAudioService } from './note-audio.service'

/**
 * Playback modes for the sequence player.
 * @public
 */
export type PlaybackMode = 'clean' | 'expressive'

/**
 * Service for playing a sequence of notes (e.g., an entire exercise).
 *
 * @public
 */
export class SequencePlayer {
  private player: AudioPlayerPort
  private isPlaying: boolean = false
  private abortController: AbortController | undefined

  constructor(player: AudioPlayerPort) {
    this.player = player
  }

  /**
   * Plays the given exercise sequence.
   *
   * @param exercise - The exercise to play.
   * @param onNoteStart - Callback called when a note starts playing.
   * @param config - Optional configuration for BPM and playback mode.
   */
  async play(
    exercise: Exercise,
    onNoteStart?: (index: number) => void,
    config: { bpm?: number; mode?: PlaybackMode } = {},
  ): Promise<void> {
    this.stop()
    this.isPlaying = true
    this.abortController = new AbortController()
    const signal = this.abortController.signal

    const { bpm = 60, mode = 'clean' } = config

    try {
      for (let i = 0; i < exercise.notes.length; i++) {
        if (signal.aborted) break

        const note = exercise.notes[i]
        onNoteStart?.(i)

        const freq = NoteAudioService.getFrequencyFromTargetNote(note)

        // Calculate duration based on note duration (beats) and BPM
        const beatDurationMs = (60 / bpm) * 1000
        // Our NoteDuration type: 1 = whole, 4 = quarter, etc.
        // 4 beats per whole note (assumed 4/4)
        const noteDurationInBeats = 4 / note.duration
        const noteDurationMs = noteDurationInBeats * beatDurationMs

        // Adjust volume/expression based on mode
        let volume = 0.5
        if (mode === 'expressive') {
          // Simulate some natural dynamics
          volume = 0.4 + Math.random() * 0.2
        }

        await this.player.playNote(freq, noteDurationMs, volume)

        // Wait for the note to finish before playing the next one
        await new Promise((resolve) => {
          const timeout = setTimeout(resolve, noteDurationMs)
          signal.addEventListener('abort', () => {
            clearTimeout(timeout)
            resolve(undefined)
          })
        })
      }
    } finally {
      this.isPlaying = false
    }
  }

  stop(): void {
    if (this.isPlaying) {
      this.abortController?.abort()
      this.player.stopAll()
      this.isPlaying = false
    }
  }
}
