import { AudioPlayerPort } from './ports/audio-player.port'
import { Exercise } from '@/lib/domain/exercise'
import { NoteAudioService } from './note-audio.service'

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
   * @param bpm - Beats per minute (optional, defaults to exercise metadata if available).
   */
  async play(
    exercise: Exercise,
    onNoteStart?: (index: number) => void,
    bpm: number = 60,
  ): Promise<void> {
    this.stop()
    this.isPlaying = true
    this.abortController = new AbortController()
    const signal = this.abortController.signal

    try {
      for (let i = 0; i < exercise.notes.length; i++) {
        if (signal.aborted) break

        const note = exercise.notes[i]
        onNoteStart?.(i)

        const freq = NoteAudioService.getFrequencyFromTargetNote(note)
        // Calculate duration based on note duration (beats) and BPM
        // 4 beats = 1 whole note
        // In OSMD/MusicXML, duration is often in divisions.
        // For simplicity, we'll assume note.duration is in quarter notes if not specified.
        const beatDurationMs = (60 / bpm) * 1000
        const noteDurationMs = note.duration * beatDurationMs

        await this.player.playNote(freq, noteDurationMs)

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
