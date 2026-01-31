import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAnalyticsStore } from '@/stores/analytics-store'

// Mock crypto.randomUUID for the test environment
if (!global.crypto) {
  // @ts-expect-error - mocking for test environment
  global.crypto = {}
}
if (!global.crypto.randomUUID) {
  global.crypto.randomUUID = () => 'test-uuid-' + Math.random().toString(36).slice(2)
}

describe('Achievement System', () => {
  beforeEach(() => {
    act(() => {
      useAnalyticsStore.getState().reset()
    })
  })

  it('should unlock first-perfect-note achievement', () => {
    const { result } = renderHook(() => useAnalyticsStore())

    act(() => {
      result.current.startSession('test-exercise', 'Test', 'practice')
      // Simular una nota perfecta (wasInTune=true, cents=2)
      result.current.recordNoteAttempt(0, 'A4', 2, true)
      result.current.recordNoteCompletion(0, 1000)
    })

    const achievements = result.current.progress.achievements
    expect(achievements.some((a) => a.id === 'first-perfect-note')).toBe(true)
  })

  it('should unlock hot-streak-5 achievement', () => {
    const { result } = renderHook(() => useAnalyticsStore())

    act(() => {
      result.current.startSession('test-exercise', 'Test', 'practice')

      // Simular 5 notas perfectas
      for (let i = 0; i < 5; i++) {
        result.current.recordNoteAttempt(i, 'A4', 2, true)
        result.current.recordNoteCompletion(i, 1000)
      }
    })

    const achievements = result.current.progress.achievements
    expect(achievements.some((a) => a.id === 'hot-streak-5')).toBe(true)
  })

  it('should unlock hot-streak-10 achievement', () => {
    const { result } = renderHook(() => useAnalyticsStore())

    act(() => {
      result.current.startSession('test-exercise', 'Test', 'practice')

      // Simular 10 notas perfectas
      for (let i = 0; i < 10; i++) {
        result.current.recordNoteAttempt(i, 'A4', 1, true)
        result.current.recordNoteCompletion(i, 1000)
      }
    })

    const achievements = result.current.progress.achievements
    expect(achievements.some((a) => a.id === 'hot-streak-10')).toBe(true)
  })

  it('should reset streak if a note is not perfect', () => {
    const { result } = renderHook(() => useAnalyticsStore())

    act(() => {
      result.current.startSession('test-exercise', 'Test', 'practice')

      // 4 notas perfectas
      for (let i = 0; i < 4; i++) {
        result.current.recordNoteAttempt(i, 'A4', 2, true)
        result.current.recordNoteCompletion(i, 1000)
      }

      // 1 nota no perfecta (cents > 5)
      result.current.recordNoteAttempt(4, 'A4', 10, true)
      result.current.recordNoteCompletion(4, 1000)

      // 1 nota perfecta más (total 5 perfectas pero no consecutivas)
      result.current.recordNoteAttempt(5, 'A4', 2, true)
      result.current.recordNoteCompletion(5, 1000)
    })

    const achievements = result.current.progress.achievements
    expect(achievements.some((a) => a.id === 'hot-streak-5')).toBe(false)
    expect(result.current.currentPerfectStreak).toBe(1)
  })
})
