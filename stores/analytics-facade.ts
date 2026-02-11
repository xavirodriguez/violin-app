import { useSessionStore } from './session.store'
import { useProgressStore } from './progress.store'
import { useAchievementsStore } from './achievements.store'
import { useSessionHistoryStore } from './session-history.store'
import { AchievementCheckStats } from '@/lib/achievements/achievement-definitions'

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
        achievements: achievements.unlocked
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
      recordNoteCompletion: (noteIndex: number, timeMs: number, technique?: any) => {
        useSessionStore.getState().recordCompletion(noteIndex, timeMs, technique)

        const latestSession = useSessionStore.getState()
        const latestProgress = useProgressStore.getState()

        // Side effect: check achievements
        const stats: AchievementCheckStats = {
          currentSession: {
            correctNotes: latestSession.current?.notesCompleted || 0,
            perfectNoteStreak: latestSession.perfectNoteStreak,
            accuracy: latestSession.current?.accuracy || 0,
            durationMs: latestSession.current ? Date.now() - latestSession.current.startTimeMs : 0,
            exerciseId: latestSession.current?.exerciseId || '',
          },
          totalSessions: latestProgress.totalPracticeSessions,
          totalPracticeDays: 1,
          currentStreak: latestProgress.currentStreak,
          longestStreak: latestProgress.longestStreak,
          exercisesCompleted: latestProgress.exercisesCompleted,
          totalPracticeTimeMs: latestProgress.totalPracticeTime * 1000,
          averageAccuracy: latestProgress.overallSkill,
        }
        useAchievementsStore.getState().check(stats)
      },
      /** Manually triggers an achievement check. */
      checkAndUnlockAchievements: () => {
        const stats: AchievementCheckStats = {
          currentSession: {
            correctNotes: session.current?.notesCompleted || 0,
            perfectNoteStreak: session.perfectNoteStreak,
            accuracy: session.current?.accuracy || 0,
            durationMs: session.current ? Date.now() - session.current.startTimeMs : 0,
            exerciseId: session.current?.exerciseId || '',
          },
          totalSessions: progress.totalPracticeSessions,
          totalPracticeDays: 1,
          currentStreak: progress.currentStreak,
          longestStreak: progress.longestStreak,
          exercisesCompleted: progress.exercisesCompleted,
          totalPracticeTimeMs: progress.totalPracticeTime * 1000,
          averageAccuracy: progress.overallSkill,
        }
        return achievements.check(stats)
      },
      /** Retrieves filtered session history. */
      getSessionHistory: history.getHistory,
      /** Gets stats for a specific exercise. */
      getExerciseStats: (exerciseId: string) => progress.exerciseStats[exerciseId] || null,
      /** Returns summary stats for the current day. */
      getTodayStats: () => ({ duration: 0, accuracy: 0, sessionsCount: 0 }),
      /** Returns streak information. */
      getStreakInfo: () => ({ current: progress.currentStreak, longest: progress.longestStreak })
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
          achievements: achievements.unlocked
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
        }
      }
    },
    /** Imperative state update (for compatibility). */
    setState: (partial: Partial<{
      progress: any;
      sessions: any[];
      currentSession: any;
      currentPerfectStreak: number;
    }>) => {
      if (partial.progress) {
        useProgressStore.setState(partial.progress)
        if (partial.progress.achievements) {
          useAchievementsStore.setState({ unlocked: partial.progress.achievements })
        }
      }
      if (partial.sessions) useSessionHistoryStore.setState({ sessions: partial.sessions })
      if (partial.currentSession !== undefined) useSessionStore.setState({ current: partial.currentSession })
      if (partial.currentPerfectStreak !== undefined) useSessionStore.setState({ perfectNoteStreak: partial.currentPerfectStreak })
    },
    /** Persistence options for the facade (migrated from legacy). */
    persist: {
      getOptions: () => ({
        migrate: (persisted: any, version: number) => {
          if (!persisted) return persisted
          const persistedData = persisted as Record<string, any>

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
              persistedData.sessions = persistedData.sessions.map((s: any) => {
                const session = s as Record<string, any>
                const { duration, ...rest } = session || {}
                return {
                  ...rest,
                  durationMs: ((session.durationMs as number) ?? (duration as number) ?? 0) * 1000,
                  noteResults: Array.isArray(session.noteResults)
                    ? session.noteResults.map((nr: any) => {
                        const noteResult = nr as Record<string, any>
                        const { timeToComplete, ...nrRest } = noteResult || {}
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
            const progress = persistedData.progress as Record<string, any> | undefined
            if (progress?.exerciseStats) {
              Object.values(
                progress.exerciseStats as Record<string, Record<string, any>>,
              ).forEach((stats) => {
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
            ? persistedData.sessions.map((s: any) => {
                const session = s as Record<string, any>
                const { startTime, endTime, ...rest } = session || {}
                return {
                  ...rest,
                  startTimeMs: toMs(session?.startTimeMs ?? startTime),
                  endTimeMs: toMs(session?.endTimeMs ?? endTime),
                }
              })
            : []

          const progress = (persistedData.progress as Record<string, any>) || {}
          const achievements = Array.isArray(progress.achievements)
            ? progress.achievements.map((a: any) => {
                const achievement = a as Record<string, any>
                const { unlockedAt, ...rest } = achievement || {}
                return {
                  ...rest,
                  unlockedAtMs: toMs(achievement?.unlockedAtMs ?? unlockedAt),
                }
              })
            : []

          const exerciseStats =
            (progress.exerciseStats as Record<string, Record<string, any>>) || {}
          const migratedExerciseStats = Object.fromEntries(
            Object.entries(exerciseStats).map(([k, v]) => {
              const stats = v as Record<string, any>
              const { lastPracticed, ...rest } = stats || {}
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
        }
      })
    }
  }
)
