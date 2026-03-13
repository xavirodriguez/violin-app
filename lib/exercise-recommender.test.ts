import { describe, it, expect } from 'vitest'
import { getRecommendedExercise } from './exercise-recommender'
import type { Exercise } from '@/lib/domain/musical-types'
import type { AnalyticsStore } from '@/stores/analytics-store'

type UserProgress = AnalyticsStore['progress']

const mockExercises: Exercise[] = [
  { id: '1', name: 'Open G', difficulty: 'Beginner', category: 'open-strings', notes: [] },
  { id: '2', name: 'Open D', difficulty: 'Beginner', category: 'open-strings', notes: [] },
  { id: '3', name: 'D Major Scale', difficulty: 'Intermediate', category: 'scales', notes: [] },
  { id: '4', name: 'G Major Scale', difficulty: 'Intermediate', category: 'scales', notes: [] },
  { id: '5', name: 'Vivaldi Spring', difficulty: 'Advanced', category: 'songs', notes: [] },
]

const emptyProgress: UserProgress = {
  exerciseStats: {},
  totalPracticeTimeMs: 0,
  sessionsCompleted: 0,
  overallSkill: 0,
  intonationSkill: 0,
  rhythmSkill: 0,
}

describe('getRecommendedExercise', () => {
  it('returns undefined if no exercises available', () => {
    expect(getRecommendedExercise({ exercises: [], userProgress: emptyProgress })).toBeUndefined()
  })

  it('suggests the first beginner exercise for a new user', () => {
    const rec = getRecommendedExercise({ exercises: mockExercises, userProgress: emptyProgress })
    expect(rec?.id).toBe('1')
  })

  it('Rule 1: suggests immediate re-attempt if last exercise failed (< 80% accuracy today)', () => {
    const progress: UserProgress = {
      ...emptyProgress,
      exerciseStats: {
        '1': {
          lastPracticedMs: Date.now() - 1000,
          bestAccuracy: 75,
          timesCompleted: 1,
          totalTimeMs: 1000,
        },
      },
    }
    const rec = getRecommendedExercise({
      exercises: mockExercises,
      userProgress: progress,
      lastPlayedId: '1',
    })
    expect(rec?.id).toBe('1')
  })

  it('Rule 2: suggests review/regression if historical accuracy is poor (< 70%)', () => {
    // User failed at Intermediate scale, suggest Beginner in same category (if exists)
    // Actually, in our mock, we need a beginner scale to regression to.
    const exercisesWithRegression: Exercise[] = [
      ...mockExercises,
      { id: '0', name: 'Beginner Scale', difficulty: 'Beginner', category: 'scales', notes: [] },
    ]
    const progress: UserProgress = {
      ...emptyProgress,
      exerciseStats: {
        '3': {
          lastPracticedMs: Date.now() - 100000,
          bestAccuracy: 65,
          timesCompleted: 1,
          totalTimeMs: 1000,
        },
      },
    }
    const rec = getRecommendedExercise({
      exercises: exercisesWithRegression,
      userProgress: progress,
    })
    expect(rec?.id).toBe('0') // Regression to beginner scale
  })

  it('Rule 3 & 4: suggests next unplayed exercise in target difficulty', () => {
    const progress: UserProgress = {
      ...emptyProgress,
      exerciseStats: {
        '1': {
          lastPracticedMs: Date.now() - 2 * 86400000,
          bestAccuracy: 95,
          timesCompleted: 1,
          totalTimeMs: 1000,
        },
      },
    }
    const rec = getRecommendedExercise({ exercises: mockExercises, userProgress: progress })
    expect(rec?.id).toBe('2') // Next unplayed beginner
  })

  it('Rule 3 & 4: progresses to Intermediate if all Beginner mastered', () => {
    const progress: UserProgress = {
      ...emptyProgress,
      exerciseStats: {
        '1': {
          lastPracticedMs: Date.now() - 2 * 86400000,
          bestAccuracy: 95,
          timesCompleted: 1,
          totalTimeMs: 1000,
        },
        '2': {
          lastPracticedMs: Date.now() - 2 * 86400000,
          bestAccuracy: 95,
          timesCompleted: 1,
          totalTimeMs: 1000,
        },
      },
    }
    const rec = getRecommendedExercise({ exercises: mockExercises, userProgress: progress })
    expect(rec?.id).toBe('3') // First Intermediate
  })

  it('Rule 5: falls back to spaced repetition (oldest practiced)', () => {
    const progress: UserProgress = {
      ...emptyProgress,
      exerciseStats: {
        '1': {
          lastPracticedMs: Date.now() - 1000,
          bestAccuracy: 95,
          timesCompleted: 1,
          totalTimeMs: 1000,
        },
        '2': {
          lastPracticedMs: Date.now() - 3 * 86400000,
          bestAccuracy: 95,
          timesCompleted: 1,
          totalTimeMs: 1000,
        },
        '3': {
          lastPracticedMs: Date.now() - 1000,
          bestAccuracy: 95,
          timesCompleted: 1,
          totalTimeMs: 1000,
        },
        '4': {
          lastPracticedMs: Date.now() - 1000,
          bestAccuracy: 95,
          timesCompleted: 1,
          totalTimeMs: 1000,
        },
        '5': {
          lastPracticedMs: Date.now() - 1000,
          bestAccuracy: 95,
          timesCompleted: 1,
          totalTimeMs: 1000,
        },
      },
    }
    const rec = getRecommendedExercise({ exercises: mockExercises, userProgress: progress })
    expect(rec?.id).toBe('2') // Not played today (Rule 5)
  })
})
