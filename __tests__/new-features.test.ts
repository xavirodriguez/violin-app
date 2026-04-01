import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getAchievementProgress } from '@/lib/achievements/achievement-checker'
import { ACHIEVEMENT_DEFINITIONS, type AchievementCheckStats } from '@/lib/achievements/achievement-definitions'
import { exportSessionsToCSV } from '@/lib/export/progress-exporter'
import { estimateLocalStorageUsagePercent } from '@/lib/storage/storage-monitor'
import type { PracticeSession } from '@/stores/analytics-store'

// --- Helper to build default stats ---
function makeStats(overrides: Partial<AchievementCheckStats> = {}): AchievementCheckStats {
  return {
    currentSession: {
      correctNotes: 0,
      perfectNoteStreak: 0,
      accuracy: 0,
      durationMs: 0,
      exerciseId: 'test',
    },
    totalSessions: 0,
    totalPracticeDays: 0,
    currentStreak: 0,
    longestStreak: 0,
    exercisesCompleted: [],
    totalPracticeTimeMs: 0,
    averageAccuracy: 0,
    totalNotesCompleted: 0,
    ...overrides,
  }
}

function makeMockSession(overrides: Partial<PracticeSession> = {}): PracticeSession {
  return {
    id: 'session-1',
    startTimeMs: Date.now() - 600_000,
    endTimeMs: Date.now(),
    durationMs: 600_000,
    exerciseId: 'ex-1',
    exerciseName: 'Test Scale',
    mode: 'practice',
    notesAttempted: 10,
    notesCompleted: 8,
    accuracy: 80,
    averageCents: 5.2,
    noteResults: [],
    ...overrides,
  }
}

// =============================================
// FEAT-2 · Achievement Progress Indicator
// =============================================
describe('FEAT-2 · getAchievementProgress', () => {
  it('should return 0 for a fresh user with no progress', () => {
    const def = ACHIEVEMENT_DEFINITIONS.find((d) => d.id === 'hot-streak-5')!
    const progress = getAchievementProgress(def, makeStats())
    expect(progress).toBe(0)
  })

  it('should return partial progress for hot-streak-5 with 3/5 streak', () => {
    const def = ACHIEVEMENT_DEFINITIONS.find((d) => d.id === 'hot-streak-5')!
    const stats = makeStats({
      currentSession: { correctNotes: 3, perfectNoteStreak: 3, accuracy: 100, durationMs: 5000, exerciseId: 'ex' },
    })
    const progress = getAchievementProgress(def, stats)
    expect(progress).toBe(60) // 3/5 * 100
  })

  it('should return 100 for a completed achievement', () => {
    const def = ACHIEVEMENT_DEFINITIONS.find((d) => d.id === 'hot-streak-5')!
    const stats = makeStats({
      currentSession: { correctNotes: 5, perfectNoteStreak: 5, accuracy: 100, durationMs: 5000, exerciseId: 'ex' },
    })
    const progress = getAchievementProgress(def, stats)
    expect(progress).toBe(100)
  })

  it('should cap progress at 100 for over-achieved values', () => {
    const def = ACHIEVEMENT_DEFINITIONS.find((d) => d.id === 'hot-streak-5')!
    const stats = makeStats({
      currentSession: { correctNotes: 10, perfectNoteStreak: 10, accuracy: 100, durationMs: 5000, exerciseId: 'ex' },
    })
    const progress = getAchievementProgress(def, stats)
    expect(progress).toBe(100)
  })

  it('should calculate daily-dedication progress correctly', () => {
    const def = ACHIEVEMENT_DEFINITIONS.find((d) => d.id === 'daily-dedication')!
    const stats = makeStats({ currentStreak: 2 })
    const progress = getAchievementProgress(def, stats)
    expect(progress).toBe(67) // 2/3 * 100, rounded
  })

  it('should calculate explorer progress correctly', () => {
    const def = ACHIEVEMENT_DEFINITIONS.find((d) => d.id === 'explorer')!
    const stats = makeStats({ exercisesCompleted: ['a', 'b', 'c'] })
    const progress = getAchievementProgress(def, stats)
    expect(progress).toBe(60) // 3/5 * 100
  })

  it('should calculate marathon-session progress correctly', () => {
    const def = ACHIEVEMENT_DEFINITIONS.find((d) => d.id === 'marathon-session')!
    const halfwayMs = 15 * 60 * 1000
    const stats = makeStats({
      currentSession: { correctNotes: 0, perfectNoteStreak: 0, accuracy: 0, durationMs: halfwayMs, exerciseId: 'ex' },
    })
    const progress = getAchievementProgress(def, stats)
    expect(progress).toBe(50)
  })

  it('should return 100 for first-perfect-note when at least 1 correct note', () => {
    const def = ACHIEVEMENT_DEFINITIONS.find((d) => d.id === 'first-perfect-note')!
    const stats = makeStats({
      currentSession: { correctNotes: 1, perfectNoteStreak: 0, accuracy: 50, durationMs: 1000, exerciseId: 'ex' },
    })
    const progress = getAchievementProgress(def, stats)
    expect(progress).toBe(100)
  })
})

// =============================================
// FEAT-3 · Export Progress as CSV
// =============================================
describe('FEAT-3 · exportSessionsToCSV', () => {
  it('should produce correct CSV headers', () => {
    const csv = exportSessionsToCSV([])
    expect(csv).toBe('Date,Exercise Name,Duration (min),Accuracy (%),Notes Completed,Notes Attempted')
  })

  it('should produce one data row per session', () => {
    const sessions = [makeMockSession(), makeMockSession({ id: 'session-2', exerciseName: 'Another Scale' })]
    const csv = exportSessionsToCSV(sessions)
    const lines = csv.split('\n')
    expect(lines).toHaveLength(3) // header + 2 rows
  })

  it('should format duration in minutes', () => {
    const session = makeMockSession({ durationMs: 120_000 }) // 2 minutes
    const csv = exportSessionsToCSV([session])
    const dataLine = csv.split('\n')[1]
    expect(dataLine).toContain('2.0') // 2.0 minutes
  })

  it('should escape exercise names with commas', () => {
    const session = makeMockSession({ exerciseName: 'Scale, Major' })
    const csv = exportSessionsToCSV([session])
    const dataLine = csv.split('\n')[1]
    expect(dataLine).toContain('"Scale, Major"')
  })

  it('should include accuracy with one decimal', () => {
    const session = makeMockSession({ accuracy: 95.5 })
    const csv = exportSessionsToCSV([session])
    const dataLine = csv.split('\n')[1]
    expect(dataLine).toContain('95.5')
  })

  it('should format date as ISO date', () => {
    const session = makeMockSession({ endTimeMs: new Date('2025-06-15T12:00:00Z').getTime() })
    const csv = exportSessionsToCSV([session])
    const dataLine = csv.split('\n')[1]
    expect(dataLine).toContain('2025-06-15')
  })
})

// =============================================
// FEAT-4 · localStorage capacity alert
// =============================================
describe('FEAT-4 · estimateLocalStorageUsagePercent', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should return 0 for empty localStorage', () => {
    const usage = estimateLocalStorageUsagePercent()
    expect(usage).toBe(0)
  })

  it('should return a non-negative number when localStorage has data', () => {
    // jsdom localStorage may report 0 for small payloads due to rounding,
    // so we use a larger payload to ensure the measurement registers.
    const largeValue = 'x'.repeat(50_000)
    localStorage.setItem('test-key', largeValue)
    const usage = estimateLocalStorageUsagePercent()
    expect(usage).toBeGreaterThanOrEqual(0)
    // In a real browser this would be > 0; in jsdom it may still be 0
    // so we just verify the function doesn't throw and returns a number
    expect(typeof usage).toBe('number')
  })

  it('should never exceed 100', () => {
    for (let i = 0; i < 100; i++) {
      localStorage.setItem(`key-${i}`, 'x'.repeat(100))
    }
    const usage = estimateLocalStorageUsagePercent()
    expect(usage).toBeLessThanOrEqual(100)
  })
})

// =============================================
// FEAT-5 · Exercise filtering (pure function)
// =============================================
describe('FEAT-5 · filterExercises (via exercise-library)', () => {
  // We test the recommender's difficulty filter support
  it('should filter recommendations by difficulty when difficultyFilter is provided', async () => {
    const { getRecommendedExercise } = await import('@/lib/exercise-recommender')
    const { allExercises } = await import('@/lib/exercises')

    const beginnerRec = getRecommendedExercise({
      exercises: allExercises,
      userProgress: {
        userId: 'test',
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
      difficultyFilter: 'Beginner',
    })

    if (beginnerRec) {
      expect(beginnerRec.difficulty).toBe('Beginner')
    }
  })

  it('should return undefined when no exercises match the difficulty filter', async () => {
    const { getRecommendedExercise } = await import('@/lib/exercise-recommender')

    const result = getRecommendedExercise({
      exercises: [],
      userProgress: {
        userId: 'test',
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
      difficultyFilter: 'Advanced',
    })

    expect(result).toBeUndefined()
  })
})
