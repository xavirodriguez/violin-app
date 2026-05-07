import { describe, it, expect } from 'vitest'
import { getEngineOptions, calculateAdaptiveDifficulty } from './engine'

describe('Tempo Scaling', () => {
  const mockExercise = {
    id: 'test-id',
    name: 'Test Exercise',
    notes: [],
    scoreMetadata: { keySignature: 0, timeSignature: { beats: 4, beatType: 4 }, clef: 'G' as const },
    musicXML: '',
    indicatedBpm: 60,
  } as any

  it('should scale requiredHoldTime proportionally to BPM', () => {
    const streak = 0
    const difficulty = calculateAdaptiveDifficulty(streak)
    const baseHoldTime = difficulty.requiredHoldTime // 180ms for streak 0

    // At 60 BPM (1.0x), hold time should be baseHoldTime
    const options60 = getEngineOptions({
      exercise: mockExercise,
      audio: {} as any,
      pitch: {} as any,
      bpm: 60
    })
    expect(options60.requiredHoldTime).toBeCloseTo(baseHoldTime)

    // At 120 BPM (2.0x), hold time should be baseHoldTime / 2
    const options120 = getEngineOptions({
      exercise: mockExercise,
      audio: {} as any,
      pitch: {} as any,
      bpm: 120
    })
    expect(options120.requiredHoldTime).toBeCloseTo(baseHoldTime / 2)

    // At 30 BPM (0.5x), hold time should be baseHoldTime * 2
    const options30 = getEngineOptions({
      exercise: mockExercise,
      audio: {} as any,
      pitch: {} as any,
      bpm: 30
    })
    expect(options30.requiredHoldTime).toBeCloseTo(baseHoldTime * 2)
  })
})
