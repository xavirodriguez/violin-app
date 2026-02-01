import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAnalyticsStore, type AnalyticsStore } from './analytics-store'
import { type NoteTechnique } from '../lib/technique-types'

describe('useAnalyticsStore', () => {
  beforeEach(() => {
    // Reset store state before each test if needed.
    // Zustand persist might keep state between tests if not handled.
    useAnalyticsStore.setState({
      currentSession: null,
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

  it('should start a session with timestamps', () => {
    const { startSession } = useAnalyticsStore.getState()
    const now = Date.now()
    vi.setSystemTime(now)

    startSession('ex1', 'Exercise 1', 'practice')

    const session = useAnalyticsStore.getState().currentSession
    expect(session).not.toBeNull()
    expect(session?.startTimeMs).toBe(now)
    expect(session?.endTimeMs).toBe(now)
    expect(session?.exerciseId).toBe('ex1')
  })

  it('should record note attempts immutably', () => {
    const { startSession, recordNoteAttempt } = useAnalyticsStore.getState()
    startSession('ex1', 'Exercise 1', 'practice')

    recordNoteAttempt(0, 'A4', 10, true)

    const session1 = useAnalyticsStore.getState().currentSession
    expect(session1?.noteResults).toHaveLength(1)
    expect(session1?.noteResults[0].attempts).toBe(1)
    expect(session1?.noteResults[0].averageCents).toBe(10)

    recordNoteAttempt(0, 'A4', 20, true)
    const session2 = useAnalyticsStore.getState().currentSession
    expect(session2?.noteResults[0].attempts).toBe(2)
    expect(session2?.noteResults[0].averageCents).toBe(15) // (10 + 20) / 2

    // Verify immutability (session1 should be different from session2)
    expect(session1).not.toBe(session2)
  })

  it('should end a session and update stats', () => {
    const { startSession, recordNoteAttempt, endSession } = useAnalyticsStore.getState()
    const startTime = Date.now()
    vi.setSystemTime(startTime)
    startSession('ex1', 'Exercise 1', 'practice')

    recordNoteAttempt(0, 'A4', 0, true)

    const endTime = startTime + 5000 // 5 seconds later
    vi.setSystemTime(endTime)

    endSession()

    const state = useAnalyticsStore.getState()
    expect(state.currentSession).toBeNull()
    expect(state.sessions).toHaveLength(1)
    expect(state.sessions[0].durationMs).toBe(5000)
    expect(state.sessions[0].endTimeMs).toBe(endTime)
    expect(state.progress.totalPracticeSessions).toBe(1)
    expect(state.progress.exerciseStats['ex1'].timesCompleted).toBe(1)
    expect(state.progress.exerciseStats['ex1'].lastPracticedMs).toBe(endTime)
  })

  it('should migrate data from version 0/1 to 3', () => {
    const storeOptions = useAnalyticsStore.persist.getOptions()
    const migrate = storeOptions.migrate as (
      persisted: unknown,
      version: number,
    ) => Record<string, unknown>

    const oldData = {
      sessions: [
        {
          id: 's1',
          startTime: '2023-01-01T10:00:00.000Z',
          endTime: '2023-01-01T10:05:00.000Z',
          duration: 300,
          exerciseId: 'ex1',
          exerciseName: 'Ex 1',
          mode: 'practice',
          notesAttempted: 10,
          notesCompleted: 5,
          accuracy: 50,
          averageCents: 10,
          noteResults: [
            {
              noteIndex: 0,
              targetPitch: 'G4',
              attempts: 1,
              timeToComplete: 1000,
              averageCents: 0,
              wasInTune: true,
            },
          ],
        },
      ],
      progress: {
        achievements: [
          {
            id: 'a1',
            name: 'Ach 1',
            description: 'Desc 1',
            icon: '🏆',
            unlockedAt: '2023-01-01T10:05:00.000Z',
          },
        ],
        exerciseStats: {
          ex1: {
            exerciseId: 'ex1',
            timesCompleted: 1,
            bestAccuracy: 50,
            averageAccuracy: 50,
            fastestCompletion: 300,
            lastPracticed: '2023-01-01T10:05:00.000Z',
          },
        },
      },
    }

    const migrated = migrate(oldData, 0) as unknown as AnalyticsStore

    const firstSession = migrated.sessions[0] as unknown as Record<string, unknown>
    const firstNoteResult = migrated.sessions[0].noteResults[0] as unknown as Record<
      string,
      unknown
    >
    const firstAchievement = migrated.progress.achievements[0] as unknown as Record<string, unknown>
    const ex1Stats = migrated.progress.exerciseStats.ex1 as unknown as Record<string, unknown>

    expect(migrated.sessions[0].startTimeMs).toBe(new Date('2023-01-01T10:00:00.000Z').getTime())
    expect(migrated.sessions[0].endTimeMs).toBe(new Date('2023-01-01T10:05:00.000Z').getTime())
    expect(migrated.sessions[0].durationMs).toBe(300000)
    expect(migrated.sessions[0].noteResults[0].timeToCompleteMs).toBe(1000)
    expect(migrated.progress.achievements[0].unlockedAtMs).toBe(
      new Date('2023-01-01T10:05:00.000Z').getTime(),
    )
    expect(migrated.progress.exerciseStats.ex1.lastPracticedMs).toBe(
      new Date('2023-01-01T10:05:00.000Z').getTime(),
    )
    expect(migrated.progress.exerciseStats.ex1.fastestCompletionMs).toBe(300000)

    // Check that old fields are removed or handled
    expect(firstSession.startTime).toBeUndefined()
    expect(firstSession.endTime).toBeUndefined()
    expect(firstNoteResult.timeToComplete).toBeUndefined()
    expect(firstAchievement.unlockedAt).toBeUndefined()
    expect(ex1Stats.lastPracticed).toBeUndefined()
    expect(ex1Stats.fastestCompletion).toBeUndefined()
  })

  it('should calculate rhythm skill correctly based on technical metrics', () => {
    const { startSession, recordNoteAttempt, recordNoteCompletion, endSession } =
      useAnalyticsStore.getState()
    startSession('ex1', 'Exercise 1', 'practice')

    // Note 1: Perfect timing (0ms error)
    recordNoteAttempt(0, 'A4', 0, true)
    recordNoteCompletion(0, 500, {
      rhythm: { onsetErrorMs: 0 },
      vibrato: { present: false, rateHz: 0, widthCents: 0, regularity: 0 },
      pitchStability: {
        settlingStdCents: 0,
        globalStdCents: 0,
        driftCentsPerSec: 0,
        inTuneRatio: 1,
      },
      attackRelease: { attackTimeMs: 0, pitchScoopCents: 0, releaseStability: 0 },
      resonance: { suspectedWolf: false, rmsBeatingScore: 0, pitchChaosScore: 0, lowConfRatio: 0 },
      transition: {
        transitionTimeMs: 0,
        glissAmountCents: 0,
        landingErrorCents: 0,
        correctionCount: 0,
      },
    } as unknown as NoteTechnique)

    // Note 2: Poor timing (200ms error)
    recordNoteAttempt(1, 'B4', 0, true)
    recordNoteCompletion(1, 500, {
      rhythm: { onsetErrorMs: 200 },
    } as unknown as NoteTechnique)

    endSession()

    const { progress } = useAnalyticsStore.getState()
    // MAE = 100ms. maeScore = 100 - 100/4 = 75.
    // In Window: 1 of 2 = 50%.
    // Total score = (75 + 50) / 2 = 62.5 -> 63
    expect(progress.rhythmSkill).toBe(63)
  })
})
