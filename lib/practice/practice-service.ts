import { audioManager } from '../infrastructure/audio-manager'
import { PitchDetector } from '../pitch-detector'
import { usePracticeStore } from '@/stores/practice-store'
import { useTunerStore } from '@/stores/tuner-store'
import { isMatch, MusicalNote } from '../practice-core'
import { useProgressStore } from '@/stores/progress.store'

export class PracticeService {
  private rafId: number | null = null
  private detector: PitchDetector | null = null
  private buffer: Float32Array = new Float32Array(2048)
  private holdStartTime: number | null = null

  start() {
    this.stop()
    const context = audioManager.getContext()
    if (!context) return
    this.detector = new PitchDetector(context.sampleRate)
    this.loop()
  }

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

    analyser.getFloatTimeDomainData(this.buffer as any)
    const result = this.detector.detectPitchWithValidation(this.buffer, 0.005)

    const store = usePracticeStore.getState()
    const tuner = useTunerStore.getState()

    if (result.pitchHz > 0 && result.confidence > 0.7) {
      tuner.updatePitch(result.pitchHz, result.confidence)
      const note = MusicalNote.fromFrequency(result.pitchHz)
      const detected = {
        pitch: note.nameWithOctave,
        pitchHz: result.pitchHz,
        cents: note.centsDeviation,
        timestamp: Date.now(),
        confidence: result.confidence
      }
      store.internalUpdate({ type: 'NOTE_DETECTED', payload: detected })

      const target = store.practiceState?.exercise.notes[store.practiceState.currentIndex]
      if (isMatch({ target, detected, tolerance: 25 })) {
        if (!this.holdStartTime) this.holdStartTime = Date.now()
        const holdDuration = Date.now() - this.holdStartTime
        store.internalUpdate({ type: 'HOLDING_NOTE', payload: { duration: holdDuration } })
        if (holdDuration > store.requiredHoldTime) {
          store.internalUpdate({ type: 'NOTE_MATCHED', payload: { technique: {} as any, isPerfect: Math.abs(detected.cents) < 15 } })
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
