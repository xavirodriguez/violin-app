import { describe, it, expect } from 'vitest'
import { getAchievementProgress } from '@/lib/achievements/achievement-checker'
import { ACHIEVEMENT_DEFINITIONS, AchievementCheckStats } from '@/lib/achievements/achievement-definitions'

describe('getAchievementProgress', () => {
  const baseStats: AchievementCheckStats = {
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
  }

  it('should return 100 if condition is met', () => {
    const def = ACHIEVEMENT_DEFINITIONS.find(d => d.id === 'hot-streak-5')!
    const stats = { ...baseStats, currentSession: { ...baseStats.currentSession, perfectNoteStreak: 5 } }
    expect(getAchievementProgress(def, stats)).toBe(100)
  })

  it('should return 40 for hot-streak-5 with 2 notes', () => {
    const def = ACHIEVEMENT_DEFINITIONS.find(d => d.id === 'hot-streak-5')!
    const stats = { ...baseStats, currentSession: { ...baseStats.currentSession, perfectNoteStreak: 2 } }
    expect(getAchievementProgress(def, stats)).toBe(40)
  })

  it('should return 50 for explorer with 2.5 (clamped) exercises', () => {
    const def = ACHIEVEMENT_DEFINITIONS.find(d => d.id === 'explorer')!
    const stats = { ...baseStats, exercisesCompleted: ['1', '2'] }
    expect(getAchievementProgress(def, stats)).toBe(40)

    const stats2 = { ...baseStats, exercisesCompleted: ['1', '2', '3'] }
    expect(getAchievementProgress(def, stats2)).toBe(60)
  })

  it('should return 0 for unknown achievement id', () => {
    const def = { ...ACHIEVEMENT_DEFINITIONS[0], id: 'unknown' }
    expect(getAchievementProgress(def, baseStats)).toBe(0)
  })
})
