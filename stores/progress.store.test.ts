import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useProgressStore } from './progress.store'

describe('ProgressStore persistence', () => {
  beforeEach(() => {
    localStorage.clear()
    useProgressStore.setState({
        totalPracticeSessions: 0,
        totalPracticeTime: 0,
        exercisesCompleted: [],
        currentStreak: 0,
        longestStreak: 0,
        intonationSkill: 0,
        rhythmSkill: 0,
        overallSkill: 0,
        exerciseStats: {}
    })
  })

  it('logs validation error when rehydrating invalid state', async () => {
    // Corromper localStorage with invalid type (string instead of number)
    const invalidState = {
      state: {
        totalPracticeSessions: 'INVALID_TYPE',
        totalPracticeTime: 100
      },
      version: 1
    }
    localStorage.setItem('violin-progress', JSON.stringify(invalidState))

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // Trigger rehydration by creating/accessing the store
    // In Vitest, we might need to wait for the next tick if it's async
    await useProgressStore.persist.rehydrate()

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Persist] ❌ Validation failed for violin-progress'),
      expect.anything()
    )

    consoleSpy.mockRestore()
  })

  it('migrates from version 0 to 1', () => {
    const legacyState = {
      totalPracticeSessions: 5,
      totalPracticeTime: 3600000
      // missing intonationSkill, etc.
    }

    const migrate = useProgressStore.persist.getOptions().migrate
    if (!migrate) throw new Error('Migrate function not found')

    const migrated = migrate(legacyState, 0) as any

    expect(migrated).toMatchObject({
      totalPracticeSessions: 5,
      totalPracticeTime: 3600000,
      intonationSkill: 0,
      rhythmSkill: 0
    })
  })
})
