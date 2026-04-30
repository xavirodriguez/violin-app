import { describe, it, expect } from 'vitest'
import { PitchDetector } from '@/lib/pitch-detector'
import { audioManager } from '@/lib/infrastructure/audio-manager'
import { calculateCentsTolerance } from '@/stores/practice-store'
import { calculateAdaptiveDifficulty } from '@/lib/practice-engine/engine'
import { validateExercise } from '@/lib/exercises/validation'
import { isMatch, type DetectedNote, type TargetNote } from '@/lib/domain/practice'

describe('System Invariants', () => {
  describe('Pitch Detection Invariants', () => {
    it('should have YIN_THRESHOLD = 0.1', () => {
      expect(PitchDetector.DEFAULT_YIN_THRESHOLD).toBe(0.1)
    })

    it('should have MIN_FREQUENCY = 180', () => {
      expect(PitchDetector.DEFAULT_MIN_FREQUENCY).toBe(180)
      const detector = new PitchDetector(44100)
      expect(detector.getFrequencyRange().min).toBe(180)
    })

    it('should set MAX_FREQUENCY according to difficulty mapping', () => {
      const beginner = new PitchDetector(44100)
      beginner.setMaxFrequency(1320)
      expect(beginner.getFrequencyRange().max).toBe(1320)

      const intermediate = new PitchDetector(44100)
      intermediate.setMaxFrequency(1760)
      expect(intermediate.getFrequencyRange().max).toBe(1760)

      const advanced = new PitchDetector(44100)
      advanced.setMaxFrequency(3000)
      expect(advanced.getFrequencyRange().max).toBe(3000)
    })
  })

  describe('Audio Infrastructure Invariants', () => {
    it('should disable browser audio processing', () => {
      // Accessing private method for invariant check
      const constraints = (audioManager as any).getAudioConstraints()
      const audioConfig = constraints.audio
      expect(audioConfig.echoCancellation).toBe(false)
      expect(audioConfig.noiseSuppression).toBe(false)
      expect(audioConfig.autoGainControl).toBe(false)
    })
  })

  describe('Pipeline configuration Invariants', () => {
    it('should satisfy minRms(note-stream) < minRms(NoteSegmenter)', async () => {
      const { DEFAULT_NOTE_STREAM_OPTIONS } = await import('@/lib/note-stream')
      const { NoteSegmenter } = await import('@/lib/note-segmenter')
      const segmenter = new NoteSegmenter()
      // @ts-ignore
      const segmenterMinRms = segmenter.options.minRms

      expect(DEFAULT_NOTE_STREAM_OPTIONS.minRms).toBeLessThan(segmenterMinRms)
    })

    it('should have coherent default RMS values', async () => {
      const { DEFAULT_NOTE_STREAM_OPTIONS } = await import('@/lib/note-stream')
      const { NoteSegmenter } = await import('@/lib/note-segmenter')
      const segmenter = new NoteSegmenter()
      // @ts-ignore
      const segmenterMinRms = segmenter.options.minRms

      expect(DEFAULT_NOTE_STREAM_OPTIONS.minRms).toBe(0.01)
      expect(segmenterMinRms).toBe(0.015)
    })
  })

  describe('Practice Engine & Difficulty Invariants', () => {
    it('should enforce centsTolerance floor of 15', () => {
      // PracticeStore's tolerance
      const storeTolerance = calculateCentsTolerance()
      expect(storeTolerance).toBeGreaterThanOrEqual(15)

      // Engine's adaptive difficulty
      const diff = calculateAdaptiveDifficulty(100) // High streak
      expect(diff.centsTolerance).toBeGreaterThanOrEqual(15)
    })

    it('should enforce requiredHoldTime cap of 800ms', () => {
      const diff = calculateAdaptiveDifficulty(1000) // Huge streak
      expect(diff.requiredHoldTime).toBeLessThanOrEqual(800)
    })

    it('should use strict inequality for pitch matching (< tolerance)', () => {
      const target: TargetNote = {
        pitch: { step: 'A', octave: 4, alter: 0 },
        duration: 4,
      }
      const detected: DetectedNote = {
        pitch: 'A4',
        pitchHz: 440,
        cents: 25, // Exactly the default tolerance
        timestamp: Date.now(),
        confidence: 1.0,
      }

      // Default tolerance is usually 25.
      // If it's a match at exactly 25, it means it uses <= which violates the invariant.
      expect(isMatch({ target, detected, tolerance: 25 })).toBe(false)

      // Should match if strictly less
      const detectedInTune: DetectedNote = { ...detected, cents: 24.9 }
      expect(isMatch({ target, detected: detectedInTune, tolerance: 25 })).toBe(true)
    })
  })

  describe('Exercise Validation Invariants', () => {
    const baseExercise = {
      id: 'test-id',
      name: 'Test Exercise',
      difficulty: 'Beginner',
      musicXML: '<score></score>',
      notes: [],
    }

    it('should reject empty notes', () => {
      const emptyExercise = {
        ...baseExercise,
        notes: [],
      }
      expect(() => validateExercise(emptyExercise)).toThrow('Exercise must contain at least one note')
    })

    it('should enforce alter ∈ {-1, 0, 1}', () => {
      const badExercise = {
        ...baseExercise,
        notes: [{ pitch: { step: 'C', octave: 4, alter: 2 }, duration: 4 }],
      }
      expect(() => validateExercise(badExercise)).toThrow(/Invalid accidental alter=2/)
    })

    it('should enforce octave ∈ {3, 4, 5, 6, 7}', () => {
      const lowOctave = {
        ...baseExercise,
        notes: [{ pitch: { step: 'C', octave: 2, alter: 0 }, duration: 4 }],
      }
      expect(() => validateExercise(lowOctave)).toThrow(/Invalid octave=2/)

      const highOctave = {
        ...baseExercise,
        notes: [{ pitch: { step: 'C', octave: 8, alter: 0 }, duration: 4 }],
      }
      expect(() => validateExercise(highOctave)).toThrow(/Invalid octave=8/)
    })
  })
})
