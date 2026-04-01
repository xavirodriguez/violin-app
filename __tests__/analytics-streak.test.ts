import { describe, it, expect, beforeEach } from 'vitest'
import { useAnalyticsStore } from '@/stores/analytics-store'
import { act } from '@testing-library/react'

describe('Analytics Streak Bug', () => {
  beforeEach(() => {
    useAnalyticsStore.setState({
      sessions: [],
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

  it('should have a streak of 1 after the first session', () => {
    const store = useAnalyticsStore.getState()

    act(() => {
      store.startSession('ex1', 'Exercise 1', 'practice')
      store.endSession()
    })

    const updatedStore = useAnalyticsStore.getState()
    expect(updatedStore.progress.currentStreak).toBe(1)
  })

  it('should reset streak if yesterday was missed', () => {
    const store = useAnalyticsStore.getState()
    const DAY_MS = 86_400_000
    const twoDaysAgo = Date.now() - 2 * DAY_MS

    act(() => {
      // Simulate a session 2 days ago
      const session = {
        id: 'old-session',
        startTimeMs: twoDaysAgo,
        endTimeMs: twoDaysAgo + 1000,
        durationMs: 1000,
        exerciseId: 'ex1',
        exerciseName: 'Exercise 1',
        mode: 'practice' as const,
        notesAttempted: 1,
        notesCompleted: 1,
        accuracy: 100,
        averageCents: 0,
        noteResults: [],
      }
      useAnalyticsStore.setState({
        sessions: [session],
        progress: {
          ...store.progress,
          currentStreak: 5,
        },
      })
    })

    act(() => {
      useAnalyticsStore.getState().startSession('ex1', 'Exercise 1', 'practice')
      useAnalyticsStore.getState().endSession()
    })

    const updatedStore = useAnalyticsStore.getState()
    expect(updatedStore.progress.currentStreak).toBe(1)
  })

  it('should not increment streak twice if two sessions are played same day', () => {
    const store = useAnalyticsStore.getState()

    act(() => {
      store.startSession('ex1', 'Exercise 1', 'practice')
      store.endSession()
    })

    act(() => {
      useAnalyticsStore.getState().startSession('ex1', 'Exercise 1', 'practice')
      useAnalyticsStore.getState().endSession()
    })

    const updatedStore = useAnalyticsStore.getState()
    expect(updatedStore.progress.currentStreak).toBe(1)
  })
})
