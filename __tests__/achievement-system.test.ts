import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAnalyticsStore } from '@/stores/analytics-store'

describe('Achievement System', () => {
  beforeEach(() => {
    // Reset store state before each test
    act(() => {
      useAnalyticsStore.setState({
        sessions: [],
        currentSession: undefined,
        currentPerfectStreak: 0,
        progress: {
          userId: 'default',
          totalPracticeSessions: 0,
          totalPracticeTime: 0,
          exercisesCompleted: [],
          currentStreak: 0,
          longestStreak: 0,
          intonationSkill: 0,
          rhythmSkill: 0,
          overallSkill: 0,
          achievements: [],
          exerciseStats: {},
        },
      })
    })
  })

  it('should unlock first-perfect-note achievement', () => {
    const { result } = renderHook(() => useAnalyticsStore())

    act(() => {
      result.current.startSession({
        exerciseId: 'test-exercise',
        exerciseName: 'Test',
        mode: 'practice',
      })
      result.current.recordNoteAttempt({
        noteIndex: 0,
        targetPitch: 'A4',
        cents: 2,
        wasInTune: true,
      }) // Perfect note (< 5 cents)
      result.current.recordNoteCompletion({ noteIndex: 0, timeToCompleteMs: 1000 })
    })

    const achievements = result.current.progress.achievements
    expect(achievements.some((a) => a.id === 'first-perfect-note')).toBe(true)
  })

  it('should unlock hot-streak-5 achievement', () => {
    const { result } = renderHook(() => useAnalyticsStore())

    act(() => {
      result.current.startSession({
        exerciseId: 'test-exercise',
        exerciseName: 'Test',
        mode: 'practice',
      })

      // Simulate 5 perfect notes
      for (let i = 0; i < 5; i++) {
        result.current.recordNoteAttempt({
          noteIndex: i,
          targetPitch: 'A4',
          cents: 2,
          wasInTune: true,
        })
        result.current.recordNoteCompletion({ noteIndex: i, timeToCompleteMs: 1000 })
      }
    })

    const achievements = result.current.progress.achievements
    expect(achievements.some((a) => a.id === 'hot-streak-5')).toBe(true)
  })

  it('should NOT unlock hot-streak-5 if streak is broken', () => {
    const { result } = renderHook(() => useAnalyticsStore())

    act(() => {
      result.current.startSession({
        exerciseId: 'test-exercise',
        exerciseName: 'Test',
        mode: 'practice',
      })

      // 3 perfect notes
      for (let i = 0; i < 3; i++) {
        result.current.recordNoteAttempt({
          noteIndex: i,
          targetPitch: 'A4',
          cents: 2,
          wasInTune: true,
        })
        result.current.recordNoteCompletion({ noteIndex: i, timeToCompleteMs: 1000 })
      }

      // 1 off-pitch note (breaks streak)
      result.current.recordNoteAttempt({
        noteIndex: 3,
        targetPitch: 'A4',
        cents: 15,
        wasInTune: false,
      })
      result.current.recordNoteCompletion({ noteIndex: 3, timeToCompleteMs: 1000 })

      // 2 more perfect notes
      for (let i = 4; i < 6; i++) {
        result.current.recordNoteAttempt({
          noteIndex: i,
          targetPitch: 'A4',
          cents: 2,
          wasInTune: true,
        })
        result.current.recordNoteCompletion({ noteIndex: i, timeToCompleteMs: 1000 })
      }
    })

    const achievements = result.current.progress.achievements
    expect(achievements.some((a) => a.id === 'hot-streak-5')).toBe(false)
  })
})
