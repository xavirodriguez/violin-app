import { audioManager } from '../infrastructure/audio-manager'
import { PitchDetector } from '../pitch-detector'
import { usePracticeStore } from '@/stores/practice-store'
import { useTunerStore } from '@/stores/tuner-store'
import { MusicalNote, formatPitchName } from '../practice-core'

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
  private lastUpdateTime = 0
  private readonly UPDATE_INTERVAL_MS = 100 // 10Hz update rate for store
  private cachedTargetNote: any = null
  private cachedTargetPitch: string | null = null
  private cachedIndex: number = -1
  private cachedExerciseId: string = ''

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

    const now = Date.now()
    const store = usePracticeStore.getState()
    const practiceState = store.practiceState
    const tuner = useTunerStore.getState()
    const shouldUpdateStore = now - this.lastUpdateTime > this.UPDATE_INTERVAL_MS

    if (result.pitchHz > 0 && result.confidence > 0.7) {
      // Tuner UI is updated every frame for smoothness
      tuner.updatePitch(result.pitchHz, result.confidence)

      const note = MusicalNote.fromFrequency(result.pitchHz)
      const detected = {
        pitch: note.nameWithOctave,
        pitchHz: result.pitchHz,
        cents: note.centsDeviation,
        timestamp: now,
        confidence: result.confidence,
      }

      // Cache target note lookup
      if (
        practiceState &&
        (this.cachedIndex !== practiceState.currentIndex ||
          this.cachedExerciseId !== practiceState.exercise.id)
      ) {
        this.cachedIndex = practiceState.currentIndex
        this.cachedExerciseId = practiceState.exercise.id
        const target = practiceState.exercise.notes[practiceState.currentIndex]
        this.cachedTargetNote = target
        this.cachedTargetPitch = target ? formatPitchName(target.pitch) : null
      }

      const isCorrect =
        this.cachedTargetPitch === detected.pitch && Math.abs(detected.cents) < 20

      if (shouldUpdateStore) {
        store.internalUpdate({ type: 'NOTE_DETECTED', payload: detected })
        this.lastUpdateTime = now
      }

      if (isCorrect) {
        this.consecutiveMisses = 0
        if (!this.holdStartTime) {
          this.holdStartTime = now
        }

        const holdDuration = now - this.holdStartTime

        if (shouldUpdateStore) {
          store.internalUpdate({
            type: 'HOLDING_NOTE',
            payload: { duration: holdDuration },
          })
        }

        if (holdDuration > store.requiredHoldTime) {
          // Note matched successfully - this should NOT be throttled
          store.internalUpdate({
            type: 'NOTE_MATCHED',
            payload: {
              isPerfect: Math.abs(detected.cents) < 10,
            } as any,
          })
          this.holdStartTime = null
          this.lastUpdateTime = now // Reset throttle after transition
        }
      } else {
        this.handleMiss()
      }
    } else {
      tuner.updatePitch(0, 0)
      if (shouldUpdateStore) {
        store.internalUpdate({ type: 'NO_NOTE_DETECTED' })
        this.lastUpdateTime = now
      }
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
