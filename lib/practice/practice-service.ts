import { audioManager } from '../infrastructure/audio-manager'
import { PitchDetector } from '../pitch-detector'
import { usePracticeStore } from '@/stores/practice-store'
import { useTunerStore } from '@/stores/tuner-store'
import { isMatch, MusicalNote } from '../practice-core'

/**
 * PracticeService
 *
 * A simplified service that manages the real-time audio loop for the practice session.
 * It replaces the complex PracticeEngine and SessionRunner with a direct requestAnimationFrame loop.
 */
export class PracticeService {
  private rafId: number | null = null
  private detector: PitchDetector | null = null
  private buffer: Float32Array = new Float32Array(2048)
  private holdStartTime: number | null = null
  private requiredHoldTime = 400 // ms for MVP

  /**
   * Starts the audio processing loop.
   */
  start() {
    this.stop()
    const context = audioManager.getContext()
    if (!context) {
      console.warn('[PracticeService] No audio context available')
      return
    }

    this.detector = new PitchDetector(context.sampleRate)
    this.loop()
  }

  /**
   * Stops the audio processing loop.
   */
  stop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    this.holdStartTime = null
  }

  private loop = () => {
    const analyser = audioManager.getAnalyser()
    if (!analyser || !this.detector) {
      this.rafId = requestAnimationFrame(this.loop)
      return
    }

    // Use explicit cast to avoid SharedArrayBuffer issues in TS
    analyser.getFloatTimeDomainData(this.buffer as any)
    const result = this.detector.detectPitchWithValidation(this.buffer)

    const store = usePracticeStore.getState()
    const practiceState = store.practiceState
    const tuner = useTunerStore.getState()

    if (result.pitchHz > 0 && result.confidence > 0.8) {
      // Update Tuner UI
      tuner.updatePitch(result.pitchHz, result.confidence)

      const note = MusicalNote.fromFrequency(result.pitchHz)
      const detected = {
        pitch: note.nameWithOctave,
        pitchHz: result.pitchHz,
        cents: note.centsDeviation,
        timestamp: Date.now(),
        confidence: result.confidence
      }

      // Update Practice State
      store.internalUpdate({ type: 'NOTE_DETECTED', payload: detected })

      const target = practiceState?.exercise.notes[practiceState.currentIndex]
      if (isMatch({ target, detected, tolerance: 35 })) {
        if (!this.holdStartTime) {
          this.holdStartTime = Date.now()
        } else if (Date.now() - this.holdStartTime > this.requiredHoldTime) {
          // Note matched successfully
          store.internalUpdate({
            type: 'NOTE_MATCHED',
            payload: {
              technique: {} as any,
              isPerfect: Math.abs(detected.cents) < 10
            }
          })
          this.holdStartTime = null
        }
      } else {
        this.holdStartTime = null
      }
    } else {
      tuner.updatePitch(0, 0)
      store.internalUpdate({ type: 'NO_NOTE_DETECTED' })
      this.holdStartTime = null
    }

    this.rafId = requestAnimationFrame(this.loop)
  }
}

export const practiceService = new PracticeService()
