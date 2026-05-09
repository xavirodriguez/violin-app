import { audioManager } from '../infrastructure/audio-manager'
import { PitchDetector } from '../pitch-detector'
import { usePracticeStore, calculateCentsTolerance } from '@/stores/practice-store'
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
  private consecutiveMisses = 0
  private readonly MAX_MISSES = 3

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
    const result = this.detector.detectPitchWithValidation(this.buffer, 0.005) // Lower RMS threshold

    const store = usePracticeStore.getState()
    const practiceState = store.practiceState
    const tuner = useTunerStore.getState()

    if (result.pitchHz > 0 && result.confidence > 0.7) { // Lower confidence threshold
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

      const tolerance = calculateCentsTolerance()
      const target = practiceState?.exercise.notes[practiceState.currentIndex]
      if (isMatch({ target, detected, tolerance })) {
        this.consecutiveMisses = 0
        if (!this.holdStartTime) {
          this.holdStartTime = Date.now()
        }

        const holdDuration = Date.now() - this.holdStartTime
        store.internalUpdate({
          type: 'HOLDING_NOTE',
          payload: { duration: holdDuration },
        })

        if (holdDuration > store.requiredHoldTime) {
          // Note matched successfully
          store.internalUpdate({
            type: 'NOTE_MATCHED',
            payload: {
              technique: {} as any,
              isPerfect: Math.abs(detected.cents) < 15,
            },
          })
          this.holdStartTime = null
        }
      } else {
        this.handleMiss()
      }
    } else {
      tuner.updatePitch(0, 0)
      store.internalUpdate({ type: 'NO_NOTE_DETECTED' })
      this.handleMiss()
    }

    this.rafId = requestAnimationFrame(this.loop)
  }

  private handleMiss() {
    this.consecutiveMisses++
    if (this.consecutiveMisses > this.MAX_MISSES) {
      this.holdStartTime = null
    }
  }
}

export const practiceService = new PracticeService()
