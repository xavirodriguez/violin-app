import { describe, it, expect, vi } from 'vitest'
import { createPracticeEngine, PracticeEngineContext } from '../lib/practice-engine/engine'
import { Exercise } from '../lib/exercises/types'
import { AudioLoopPort, PitchDetectorPort } from '../lib/practice-engine/engine.ports'
import { RawPitchEvent } from '../lib/note-stream'
import { MusicalNoteName, NoteTechnique } from '../lib/technique-types'

describe('TASK-07: Adaptive Difficulty Integration', () => {
  const mockExercise: Exercise = {
    id: 'test-exercise',
    name: 'Test Exercise',
    difficulty: 'Beginner',
    notes: [
      { pitch: { step: 'A', octave: 4, alter: 0 }, duration: 4 },
      { pitch: { step: 'B', octave: 4, alter: 0 }, duration: 4 },
      { pitch: { step: 'C', octave: 5, alter: 0 }, duration: 4 },
      { pitch: { step: 'D', octave: 5, alter: 0 }, duration: 4 },
      { pitch: { step: 'E', octave: 5, alter: 0 }, duration: 4 },
      { pitch: { step: 'F', octave: 5, alter: 0 }, duration: 4 },
      { pitch: { step: 'G', octave: 5, alter: 0 }, duration: 4 },
    ],
  }

  const mockAudio: AudioLoopPort = {
    start: vi.fn().mockImplementation((callback, signal) => {
      return new Promise<void>((resolve) => {
        signal.addEventListener('abort', () => resolve())
      })
    }),
  }

  const mockPitch: PitchDetectorPort = {
    detect: vi.fn(),
    calculateRMS: vi.fn().mockReturnValue(0.02),
  }

  it('should adjust difficulty after several perfect notes', async () => {
    const ctx: PracticeEngineContext = {
      audio: mockAudio,
      pitch: mockPitch,
      exercise: mockExercise,
    }

    const engine = createPracticeEngine(ctx)

    // We can't easily run the real async loop and feed it frames because it uses Date.now() internally
    // and is designed for real-time.
    // However, we can verify that the engine's internal `getOptions` uses the streak.

    // Initial state: streak 0
    expect(engine.getState().perfectNoteStreak).toBe(0)

    // Manually trigger 6 perfect notes via the engine's internal update mechanism (exposed for testing if possible)
    // Actually, we can use the engine's reducer or just trigger events if we had access.
    // Since we want an integration test, let's see how we can simulate matches.

    // We can use the engine's internal core if we were in the same file,
    // but here we only have the public interface.

    // Wait, TASK-06 already verified that the engine uses `state.perfectNoteStreak` in `getEngineOptions`.
    // TASK-07 wants to verify that "after 6 perfect notes, the effective tolerance is lower than at the beginning".

    // Let's simulate events and see the state change.
    const engineWithEvents = engine as any;

    const perfectTechnique: NoteTechnique = {
      noteName: 'A4' as MusicalNoteName,
      pitchHz: 440,
      cents: 0,
      rms: 0.1,
      confidence: 0.9,
      durationMs: 500,
      start: 0,
      end: 500,
      expectedStartTime: 0,
      expectedDuration: 500,
      intonation: {
        cents: 0,
        status: 'in-tune',
        isPerfect: true
      },
      rhythm: {
        offsetMs: 0,
        durationDiffMs: 0,
        status: 'perfect'
      }
    }

    const matchedEvent = {
      type: 'NOTE_MATCHED',
      payload: {
        technique: perfectTechnique,
        observations: [],
        isPerfect: true
      }
    }

    // Trigger 3 perfect notes to see tolerance decrease
    engineWithEvents.updateState(matchedEvent)
    engineWithEvents.updateState(matchedEvent)
    engineWithEvents.updateState(matchedEvent)

    expect(engine.getState().perfectNoteStreak).toBe(3)

    // Check options
    const options3 = engineWithEvents.getOptions()
    expect(options3.centsTolerance).toBe(20) // Base 25 - floor(3/3)*5 = 20

    // Trigger 3 more
    engineWithEvents.updateState(matchedEvent)
    engineWithEvents.updateState(matchedEvent)
    engineWithEvents.updateState(matchedEvent)

    expect(engine.getState().perfectNoteStreak).toBe(6)
    const options6 = engineWithEvents.getOptions()
    expect(options6.centsTolerance).toBe(15) // Base 25 - floor(6/3)*5 = 10 -> Floor 15

    // Check hold time at streak 5
    // Base 180 + floor(6/5)*100 = 280
    expect(options6.requiredHoldTime).toBe(280)
  })

  it('should reset difficulty after a failure', async () => {
    const ctx: PracticeEngineContext = {
      audio: mockAudio,
      pitch: mockPitch,
      exercise: mockExercise,
    }

    const engine = createPracticeEngine(ctx)
    const engineWithEvents = engine as any;

    const perfectTechnique: NoteTechnique = {
      noteName: 'A4' as MusicalNoteName,
      intonation: { cents: 0, status: 'in-tune', isPerfect: true },
      // ... rest of required fields
    } as any

    const matchedEvent = {
      type: 'NOTE_MATCHED',
      payload: { technique: perfectTechnique, observations: [], isPerfect: true }
    }

    // High streak
    for(let i=0; i<10; i++) engineWithEvents.updateState(matchedEvent)
    expect(engine.getState().perfectNoteStreak).toBe(10)
    expect(engineWithEvents.getOptions().centsTolerance).toBe(15)

    // Failed note (isPerfect: false)
    const failedEvent = {
      type: 'NOTE_MATCHED',
      payload: { technique: { ...perfectTechnique, intonation: { isPerfect: false } }, observations: [], isPerfect: false }
    }
    engineWithEvents.updateState(failedEvent)

    expect(engine.getState().perfectNoteStreak).toBe(0)
    expect(engineWithEvents.getOptions().centsTolerance).toBe(25)
  })
})
