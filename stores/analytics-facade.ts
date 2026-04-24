import { useSessionStore } from './session.store'
import { useProgressStore } from './progress.store'
import { useAchievementsStore } from './achievements.store'
import { useSessionHistoryStore } from './session-history.store'
import { AchievementCheckStats } from '@/lib/achievements/achievement-definitions'
import { NoteTechnique } from '@/lib/technique-types'

/**
 * Temporary facade to maintain backward compatibility with the legacy analytics API.
 *
 * @remarks
 * This object aggregates multiple stores (Session, Progress, Achievements, History)
 * into a single interface. New code should prefer using the individual stores directly.
 *
 * @deprecated Use individual stores (e.g., `useSessionStore`, `useProgressStore`) directly.
 * @public
 */
export const useAnalyticsStore = Object.assign(
  () => {
    const session = useSessionStore()
    const progress = useProgressStore()
    const achievements = useAchievementsStore()
    const history = useSessionHistoryStore()

    return {
      /** The current active session, if any. */
      currentSession: session.current,
      /** History of completed sessions. */
      sessions: history.sessions,
      /** Aggregated user progress. */
      progress: {
        ...progress,
        achievements: achievements.unlocked,
      },
      /** Current streak of perfect notes. */
      currentPerfectStreak: session.perfectNoteStreak,
      /** Starts a new session. */
      startSession: session.start,
      /** Ends the current session and updates related stores. */
      endSession: () => {
        const completed = session.end()
        if (completed) {
          progress.addSession(completed)
          history.addSession(completed)
          progress.updateSkills(history.sessions)
        }
        return completed
      },
      /** Records an attempt at a note. */
      recordNoteAttempt: session.recordAttempt,
      /** Records a completed note and checks for achievements. */
      recordNoteCompletion: (noteIndex: number, timeMs: number, technique?: NoteTechnique) => {
        const store = useSessionStore.getState()
        store.recordCompletion(noteIndex, timeMs, technique)
        const stats = prepareAchievementCheckStats()
        const result = useAchievementsStore.getState().check(stats)
        return result
      },
      /** Manually triggers an achievement check. */
      checkAndUnlockAchievements: () => {
        const stats = prepareAchievementCheckStats()
        const checker = useAchievementsStore.getState()
        const unlocked = checker.check(stats)
        return unlocked
      },
      /** Retrieves filtered session history. */
      getSessionHistory: history.getHistory,
      /** Gets stats for a specific exercise. */
      getExerciseStats: (exerciseId: string) => {
        const statsMap = progress.exerciseStats
        const entry = statsMap[exerciseId]
        const result = entry || undefined
        return result
      },
      /** Returns summary stats for the current day. */
      getTodayStats: () => {
        const duration = 0
        const accuracy = 0
        const sessionsCount = 0
        return { duration, accuracy, sessionsCount }
      },
      /** Returns streak information. */
      getStreakInfo: () => {
        const current = progress.currentStreak
        const longest = progress.longestStreak
        const info = { current, longest }
        return info
      },
    }
  },
  {
    /** Imperative access to the facade's state. */
    getState: () => {
      const session = useSessionStore.getState()
      const progress = useProgressStore.getState()
      const achievements = useAchievementsStore.getState()
      const history = useSessionHistoryStore.getState()

      return {
        currentSession: session.current,
        sessions: history.sessions,
        progress: {
          ...progress,
          achievements: achievements.unlocked,
        },
        currentPerfectStreak: session.perfectNoteStreak,
        startSession: session.start,
        recordNoteAttempt: session.recordAttempt,
        recordNoteCompletion: session.recordCompletion,
        endSession: () => {
          const completed = useSessionStore.getState().end()
          if (completed) {
            useProgressStore.getState().addSession(completed)
            useSessionHistoryStore.getState().addSession(completed)
            useProgressStore.getState().updateSkills(useSessionHistoryStore.getState().sessions)
          }
          return completed
        },
        checkAndUnlockAchievements: () => {
          return []
        },
      }
    },
    /** Imperative state update (for compatibility). */
    setState: (
      partial: Partial<{
        progress: unknown
        sessions: unknown[]
        currentSession: unknown
        currentPerfectStreak: number
      }>,
    ) => {
      if (partial.progress) {
        useProgressStore.setState(partial.progress as any)
        const progressObj = partial.progress as { achievements?: unknown[] }
        if (progressObj.achievements) {
          useAchievementsStore.setState({ unlocked: progressObj.achievements as any[] })
        }
      }
      if (partial.sessions) useSessionHistoryStore.setState({ sessions: partial.sessions as any[] })
      if (partial.currentSession !== undefined)
        useSessionStore.setState({ current: partial.currentSession as any })
      if (partial.currentPerfectStreak !== undefined)
        useSessionStore.setState({ perfectNoteStreak: partial.currentPerfectStreak })
    },
    /** Persistence options for the facade (migrated from legacy). */
    persist: {
      getOptions: () => ({
        migrate: (persisted: unknown, version: number) => {
          if (!persisted) return persisted
          const persistedData = persisted as Record<string, unknown>

          if (version < 3) {
            migrateV1V2(persistedData)
          }

          const result = finalizeMigration(persistedData)
          return result
        },
      }),
    },
  },
)

function prepareAchievementCheckStats(): AchievementCheckStats {
  const session = useSessionStore.getState()
  const progress = useProgressStore.getState()
  const history = useSessionHistoryStore.getState()

  const currentStats = {
    correctNotes: session.current?.notesCompleted || 0,
    perfectNoteStreak: session.perfectNoteStreak,
    accuracy: session.current?.accuracy || 0,
    durationMs: session.current ? Date.now() - session.current.startTimeMs : 0,
    exerciseId: session.current?.exerciseId || '',
  }

  return assembleCheckStats({ session, progress, history, currentStats })
}

function assembleCheckStats(params: {
  session: { current?: { notesCompleted: number } }
  progress: unknown
  history: { sessions: any[] }
  currentStats: unknown
}): AchievementCheckStats {
  const { session, progress, history, currentStats } = params
  const totalCompleted = history.sessions.reduce((sum, s) => sum + s.notesCompleted, 0)
  const totalNotes = totalCompleted + (session.current?.notesCompleted || 0)

  return {
    currentSession: currentStats,
    totalSessions: progress.totalPracticeSessions,
    totalPracticeDays: 1,
    currentStreak: progress.currentStreak,
    longestStreak: progress.longestStreak,
    exercisesCompleted: progress.exercisesCompleted,
    totalPracticeTimeMs: progress.totalPracticeTime * 1000,
    averageAccuracy: progress.overallSkill,
    totalNotesCompleted: totalNotes,
  }
}

function toMs(value: unknown): number {
  if (typeof value === 'number') return value
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'string') {
    const ms = new Date(value).getTime()
    const result = Number.isFinite(ms) ? ms : 0
    return result
  }
  return 0
}

function migrateV1V2(data: Record<string, unknown>): void {
  if (Array.isArray(data.sessions)) {
    data.sessions = data.sessions.map(migrateSessionV1V2)
  }
  const progress = data.progress as Record<string, unknown> | undefined
  if (progress?.exerciseStats) {
    const stats = progress.exerciseStats as Record<string, Record<string, unknown>>
    Object.values(stats).forEach(migrateExerciseStatsV1V2)
  }
}

function migrateSessionV1V2(s: unknown): Record<string, unknown> {
  const session = s as Record<string, unknown>
  const { duration, ...rest } = session || {}
  const durationMs = ((session.durationMs as number) ?? (duration as number) ?? 0) * 1000
  const noteResults = Array.isArray(session.noteResults)
    ? session.noteResults.map(migrateNoteResultV1V2)
    : []

  const result = { ...rest, durationMs, noteResults }
  return result
}

function migrateNoteResultV1V2(nr: unknown): Record<string, unknown> {
  const noteResult = nr as Record<string, unknown>
  const { timeToComplete, ...nrRest } = noteResult || {}
  const ms = (noteResult.timeToCompleteMs as number) ?? (timeToComplete as number) ?? 0

  const result = { ...nrRest, timeToCompleteMs: ms }
  return result
}

function migrateExerciseStatsV1V2(stats: Record<string, unknown>): void {
  const hasFastest = stats.fastestCompletion !== undefined
  const needsMigration = stats.fastestCompletionMs === undefined
  if (hasFastest && needsMigration) {
    stats.fastestCompletionMs = (stats.fastestCompletion as number) * 1000
    delete stats.fastestCompletion
  }
}

function finalizeMigration(data: Record<string, unknown>): Record<string, unknown> {
  const sessions = migrateSessionsV3(data.sessions)
  const progress = (data.progress as Record<string, unknown>) || {}
  const achievements = migrateAchievementsV3(progress.achievements)
  const exerciseStats = migrateExerciseStatsV3(progress.exerciseStats)

  return assembleMigratedData({ data, sessions, progress, achievements, exerciseStats })
}

function assembleMigratedData(params: {
  data: Record<string, unknown>
  sessions: unknown[]
  progress: Record<string, unknown>
  achievements: unknown[]
  exerciseStats: Record<string, unknown>
}): Record<string, unknown> {
  const { data, sessions, progress, achievements, exerciseStats } = params
  return {
    ...data,
    sessions,
    progress: {
      ...progress,
      achievements,
      exerciseStats,
    },
  }
}

function migrateSessionsV3(sessions: unknown): unknown[] {
  if (!Array.isArray(sessions)) return []
  return sessions.map((s) => {
    const session = s as Record<string, unknown>
    const { startTime, endTime, ...rest } = session || {}
    return {
      ...rest,
      startTimeMs: toMs(session?.startTimeMs ?? startTime),
      endTimeMs: toMs(session?.endTimeMs ?? endTime),
    }
  })
}

function migrateAchievementsV3(achievements: unknown): unknown[] {
  if (!Array.isArray(achievements)) return []
  return achievements.map((a) => {
    const achievement = a as Record<string, unknown>
    const { unlockedAt, ...rest } = achievement || {}
    return {
      ...rest,
      unlockedAtMs: toMs(achievement?.unlockedAtMs ?? unlockedAt),
    }
  })
}

function migrateExerciseStatsV3(stats: unknown): Record<string, unknown> {
  const rawStats = (stats as Record<string, Record<string, unknown>>) || {}
  const entries = Object.entries(rawStats).map(([k, v]) => {
    const s = v as Record<string, unknown>
    const { lastPracticed, ...rest } = s || {}
    const lastPracticedMs = toMs(s?.lastPracticedMs ?? lastPracticed)
    return [k, { ...rest, lastPracticedMs }]
  })

  const result = Object.fromEntries(entries)
  return result
}
