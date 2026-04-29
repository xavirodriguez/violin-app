import { useSessionStore } from './session.store'
import { PracticeSession } from '@/lib/domain/practice-session'
import { useProgressStore, ProgressState } from './progress.store'
import { useAchievementsStore, Achievement } from './achievements.store'
import { useSessionHistoryStore } from './session-history.store'
import { AchievementCheckStats } from '@/lib/achievements/achievement-definitions'
import { NoteTechnique } from '@/lib/technique-types'
import type {
  LegacyPersistedFacadeState,
  LegacySessionV2,
  LegacyNoteResultV2,
  LegacyAchievementV2,
  LegacyExerciseStatsV2,
} from '@/lib/persistence/legacy-types'

interface AnalyticsFacadePartialState {
  progress?: Partial<ProgressState> & {
    achievements?: Achievement[]
  }
  sessions?: PracticeSession[]
  currentSession?: PracticeSession | undefined
  currentPerfectStreak?: number
}

function calculateTotalNotes(params: {
  history: { sessions: PracticeSession[] }
  current?: { notesCompleted: number }
}): number {
  const { history, current } = params
  const totalCompleted = history.sessions.reduce((sum, s) => sum + s.notesCompleted, 0)
  const totalNotes = totalCompleted + (current?.notesCompleted || 0)
  return totalNotes
}

function buildFinalStats(params: {
  progress: ProgressState
  currentStats: AchievementCheckStats['currentSession']
  totalNotes: number
}): AchievementCheckStats {
  const { progress, currentStats, totalNotes } = params
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

function assembleCheckStats(params: {
  session: { current?: { notesCompleted: number } }
  progress: ProgressState
  history: { sessions: PracticeSession[] }
  currentStats: AchievementCheckStats['currentSession']
}): AchievementCheckStats {
  const { session, progress, history, currentStats } = params
  const totalNotes = calculateTotalNotes({ history, current: session.current })
  return buildFinalStats({ progress, currentStats, totalNotes })
}

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
      recordNoteAttempt: (params: {
        noteIndex: number
        pitch: string
        cents: number
        inTune: boolean
      }) => {
        useSessionStore.getState().recordAttempt(params)
      },
      /** Records a completed note and checks for achievements. */
      recordNoteCompletion: (params: {
        noteIndex: number
        timeMs: number
        technique?: NoteTechnique
      }) => {
        const sessionStore = useSessionStore.getState()
        sessionStore.recordCompletion(params)
        const stats = prepareAchievementCheckStats()
        useAchievementsStore.getState().check(stats)
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
        recordNoteAttempt: (params: {
          noteIndex: number
          pitch: string
          cents: number
          inTune: boolean
        }) => session.recordAttempt(params),
        recordNoteCompletion: (params: {
          noteIndex: number
          timeMs: number
          technique?: NoteTechnique
        }) => session.recordCompletion(params),
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
    setState: (partial: AnalyticsFacadePartialState) => {
      if (partial.progress) {
        const { achievements, ...progressState } = partial.progress
        useProgressStore.setState(progressState)
        if (achievements) {
          useAchievementsStore.setState({ unlocked: achievements })
        }
      }
      if (partial.sessions) useSessionHistoryStore.setState({ sessions: partial.sessions })
      if (partial.currentSession !== undefined)
        useSessionStore.setState({ current: partial.currentSession })
      if (partial.currentPerfectStreak !== undefined)
        useSessionStore.setState({ perfectNoteStreak: partial.currentPerfectStreak })
    },
    /** Persistence options for the facade (migrated from legacy). */
    persist: {
      getOptions: () => ({
        migrate: (persisted: unknown, version: number) => {
          if (!persisted || typeof persisted !== 'object') return persisted
          const persistedData = persisted as LegacyPersistedFacadeState

          function toMs(value: unknown): number {
            if (typeof value === 'number') return value
            if (value instanceof Date) return value.getTime()
            if (typeof value === 'string') {
              const ms = new Date(value).getTime()
              return Number.isFinite(ms) ? ms : 0
            }
            return 0
          }

          if (version < 3) {
            if (Array.isArray(persistedData.sessions)) {
              persistedData.sessions = persistedData.sessions.map((s: LegacySessionV2) => {
                const session = s
                const { duration, ...rest } = session
                return {
                  ...rest,
                  durationMs: ((session.durationMs as number) ?? (duration as number) ?? 0) * 1000,
                  noteResults: Array.isArray(session.noteResults)
                    ? session.noteResults.map((nr: LegacyNoteResultV2) => {
                        const noteResult = nr
                        const { timeToComplete, ...nrRest } = noteResult
                        return {
                          ...nrRest,
                          timeToCompleteMs:
                            (noteResult.timeToCompleteMs as number) ??
                            (timeToComplete as number) ??
                            0,
                        }
                      })
                    : [],
                }
              })
            }
            const progress = persistedData.progress
            if (progress?.exerciseStats) {
              Object.values(progress.exerciseStats).forEach((stats: LegacyExerciseStatsV2) => {
                if (
                  stats.fastestCompletion !== undefined &&
                  stats.fastestCompletionMs === undefined
                ) {
                  stats.fastestCompletionMs = (stats.fastestCompletion as number) * 1000
                  delete stats.fastestCompletion
                }
              })
            }
          }

          const sessions = Array.isArray(persistedData.sessions)
            ? persistedData.sessions.map((s: LegacySessionV2) => {
                const session = s
                const { startTime, endTime, ...rest } = session
                return {
                  ...rest,
                  startTimeMs: toMs(session?.startTimeMs ?? startTime),
                  endTimeMs: toMs(session?.endTimeMs ?? endTime),
                }
              })
            : []

          const progress = persistedData.progress || {}
          const achievements = Array.isArray(progress.achievements)
            ? progress.achievements.map((a: LegacyAchievementV2) => {
                const achievement = a
                const { unlockedAt, ...rest } = achievement
                return {
                  ...rest,
                  unlockedAtMs: toMs(achievement?.unlockedAtMs ?? unlockedAt),
                }
              })
            : []

          const exerciseStats = progress.exerciseStats || {}
          const migratedExerciseStats = Object.fromEntries(
            Object.entries(exerciseStats).map(([k, v]) => {
              const stats = v
              const { lastPracticed, ...rest } = stats
              return [
                k,
                {
                  ...rest,
                  lastPracticedMs: toMs(stats?.lastPracticedMs ?? lastPracticed),
                },
              ]
            }),
          )

          return {
            ...persistedData,
            sessions,
            progress: {
              ...progress,
              achievements,
              exerciseStats: migratedExerciseStats,
            },
          }
        },
      }),
    },
  },
)

