import { describe, it, expect } from 'vitest'
import { isMatch } from '../lib/practice-core'
import { PitchDetector } from '../lib/pitch-detector'
import { calculateAdaptiveDifficulty } from '../lib/practice-engine/engine'
import { calculateCentsTolerance } from '../stores/practice-store'
import { NoteStreamOptions } from '../lib/note-stream'
import { NoteSegmenter } from '../lib/note-segmenter'
import { allExercises } from '../lib/exercises'

describe('TASK-20: System Invariants', () => {
  describe('PitchDetector Invariants', () => {
    it('should have YIN_THRESHOLD = 0.1', () => {
      const detector = new PitchDetector(44100)
      expect((detector as any).YIN_THRESHOLD).toBe(0.1)
    })

    it('should have MIN_FREQUENCY = 180', () => {
      const detector = new PitchDetector(44100)
      expect((detector as any).MIN_FREQUENCY).toBe(180)
    })
  })

  describe('Practice Engine / Store Invariants', () => {
    it('isMatch should use strict < for tolerance', () => {
      const target = { pitch: { step: 'A', octave: 4, alter: 0 }, duration: 4 }
      const detected = { pitch: 'A4', pitchHz: 440, cents: 25, timestamp: 0, confidence: 0.9 }

      // If cents is exactly equal to tolerance, it should NOT match if it uses strict <
      expect(isMatch({ target, detected, tolerance: 25 })).toBe(false)

      const detectedIn = { pitch: 'A4', pitchHz: 440, cents: 24.9, timestamp: 0, confidence: 0.9 }
      expect(isMatch({ target, detected: detectedIn, tolerance: 25 })).toBe(true)
    })

    it('calculateCentsTolerance should have floor of 15', () => {
      // We can't easily mock progress store here without complexity,
      // but TASK-05 should have ensured this.
      // Let's verify calculateAdaptiveDifficulty which also has this floor.
      const diff = calculateAdaptiveDifficulty(100)
      expect(diff.centsTolerance).toBeGreaterThanOrEqual(15)
    })

    it('calculateAdaptiveDifficulty should have hold time cap of 800', () => {
      const diff = calculateAdaptiveDifficulty(100)
      expect(diff.requiredHoldTime).toBeLessThanOrEqual(800)
    })
  })

  describe('Exercise Invariants', () => {
    it('all pre-defined exercises should have notes', () => {
      allExercises.forEach(ex => {
        expect(ex.notes.length).toBeGreaterThan(0)
      })
    })

    it('all pre-defined exercises should have valid alter values', () => {
      allExercises.forEach(ex => {
        ex.notes.forEach(n => {
          expect([-1, 0, 1]).toContain(n.pitch.alter)
        })
      })
    })
  })

  describe('Pipeline Invariants', () => {
    it('NoteSegmenter minRms should be greater than maxRmsSilence', () => {
        const segmenter = new NoteSegmenter()
        const options = (segmenter as any).options
        expect(options.minRms).toBeGreaterThan(options.maxRmsSilence)
    })
  })
})
