import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { NoteTechnique } from '../lib/technique-types'
import type { Exercise } from '@/lib/domain/musical-types'
import { checkAchievements } from '@/lib/achievements/achievement-checker'
import type { AchievementCheckStats } from '@/lib/achievements/achievement-definitions'
import { analytics } from '@/lib/analytics-tracker'

/**
 * Data model for a completed practice session.
 *
 * @remarks
 * This model captures the summarized outcome of a session once it has
 * finished. It is used for history tracking and skill calculation.
 *
 * @public
 */
export interface PracticeSession {
  /** Unique session identifier (UUID). */
  id: string
  /** Unix timestamp when the session started. */
  startTimeMs: number
  /** Unix timestamp when the session ended. */
  endTimeMs: number
  /** Total duration in milliseconds. */
  durationMs: number
  /** ID of the exercise practiced. */
  exerciseId: string
  /** Name of the exercise. */
  exerciseName: string
  /** Mode of the session ('tuner' or 'practice'). */
  mode: 'tuner' | 'practice'
  /** Total number of pitch analysis frames processed. */
  notesAttempted: number
  /** Total number of notes successfully matched. */
  notesCompleted: number
  /** Overall accuracy percentage (0-100). */
  accuracy: number
  /** Overall average pitch deviation in cents. */
  averageCents: number
  /** Detailed results for each note played during the session. */
  noteResults: NoteResult[]
}

/**
 * Metric summary for an individual note within a session.
 *
 * @internal
 */
interface NoteResult {
  /** Index of the note in the exercise. */
  noteIndex: number
  /** Expected scientific pitch name (e.g., "A4"). */
  targetPitch: string
  /** Number of attempts/frames spent on this note. */
  attempts: number
  /** Time taken to complete the note in milliseconds. */
  timeToCompleteMs: number
  /** Average cents deviation for this note. */
  averageCents: number
  /** Whether the note was eventually played in-tune. */
  wasInTune: boolean
  /** Detected technique metrics (rhythm, attack, etc.). */
  technique?: NoteTechnique
}

/**
 * Long-term progress and skill model for the user.
 *
 * @remarks
 * This object is the primary target for local persistence. It tracks the
 * user's growth over time across different technical domains.
 *
 * @public
 */
export interface UserProgress {
  /** Unique user identifier. */
  userId: string
  /** Count of all sessions ever started. */
  totalPracticeSessions: number
  /** Lifetime practice time in seconds. */
  totalPracticeTime: number
  /** List of IDs for exercises that have been completed at least once. */
  exercisesCompleted: Exercise['id'][]
  /** Consecutive days practiced. */
  currentStreak: number
  /** Highest streak ever achieved by the user. */
  longestStreak: number
  /** Normalized skill level for intonation (0-100), based on accuracy trends. */
  intonationSkill: number
  /** Normalized skill level for rhythm (0-100), based on timing precision. */
  rhythmSkill: number
  /** Combined overall skill level (0-100). */
  overallSkill: number
  /** List of unlocked achievements and milestones. */
  achievements: Achievement[]
  /** Map of per-exercise lifetime statistics, indexed by exercise ID. */
  exerciseStats: Record<string, ExerciseStats>
}

/**
 * Persistent statistics for a specific exercise.
 *
 * @internal
 */
interface ExerciseStats {
  /** ID of the exercise. */
  exerciseId: string
  /** Number of times this exercise was completed. */
  timesCompleted: number
  /** Highest accuracy ever achieved on this exercise. */
  bestAccuracy: number
  /** Rolling average of accuracy across all attempts. */
  averageAccuracy: number
  /** Fastest completion time recorded for this exercise. */
  fastestCompletionMs: number
  /** Unix timestamp of the last time this exercise was practiced. */
  lastPracticedMs: number
}

/**
 * Represents a musical achievement or milestone earned by the user.
 *
 * @public
 */
export interface Achievement {
  /** Unique achievement ID. */
  id: string
  /** Display name. */
  name: string
  /** Description of the criteria met to earn this achievement. */
  description: string
  /** Icon or emoji representation for the UI. */
  icon: string
  /** Unix timestamp of when it was unlocked. */
  unlockedAtMs: number
}

/**
 * Interface for the Analytics Store, managing long-term progress and session history.
 *
 * @remarks
 * This store coordinates the persistence of user data and the calculation
 * of pedagogical metrics.
 *
 * @public
 */
export interface AnalyticsStore {
  /** The session currently being recorded, if any. */
  currentSession: PracticeSession | null
  /** History of the last 100 completed sessions. */
  sessions: PracticeSession[]
  /** Aggregated user progress, skill levels, and achievements. */
  progress: UserProgress
  /** Optional callback for when a new achievement is unlocked (used for toasts/animations). */
  onAchievementUnlocked?: (achievement: Achievement) => void

  /**
   * Initializes a new practice session recording.
   *
   * @remarks
   * Resets the `currentSession` state and tracks the start event.
   *
   * @param exerciseId - The ID of the exercise to practice.
   * @param exerciseName - The display name of the exercise.
   * @param mode - The session mode.
   */
  startSession: (exerciseId: string, exerciseName: string, mode: 'tuner' | 'practice') => void

  /**
   * Finalizes the current session, updates lifetime stats, and checks for achievements.
   *
   * @remarks
   * Triggers the `updateStreak`, `calculateSkills`, and `checkAndUnlockAchievements` processes.
   */
  endSession: () => void

  /**
   * Records a pitch detection attempt for the current active session.
   *
   * @remarks
   * High-frequency call that updates rolling averages for the current note.
   *
   * @param noteIndex - Index of the note being played.
   * @param targetPitch - Expected pitch name.
   * @param cents - Deviation in cents.
   * @param wasInTune - Whether the attempt met the tolerance threshold.
   */
  recordNoteAttempt: (
    noteIndex: number,
    targetPitch: string,
    cents: number,
    wasInTune: boolean,
  ) => void

  /**
   * Records the successful completion of a note.
   *
   * @remarks
   * Updates the session progress and triggers achievement checks for streaks.
   *
   * @param noteIndex - Index of the note.
   * @param timeToCompleteMs - Time taken to hold the note in tune.
   * @param technique - Detected technique details (e.g., rhythm metrics).
   */
  recordNoteCompletion: (
    noteIndex: number,
    timeToCompleteMs: number,
    technique?: NoteTechnique,
  ) => void

  /**
   * Evaluates current user stats against defined achievement criteria.
   *
   * @remarks
   * If new achievements are found, they are added to the progress state and
   * the `onAchievementUnlocked` callback is triggered.
   */
  checkAndUnlockAchievements: () => void

  /**
   * Current streak of notes played with high accuracy (`< 5` cents) in the current session.
   */
  currentPerfectStreak: number

  /**
   * Retrieves a filtered history of sessions within a time window.
   *
   * @param days - Number of days to look back. Defaults to 7.
   * @returns Filtered session array.
   */
  getSessionHistory: (days?: number) => PracticeSession[]

  /**
   * Gets the persistent statistics for a specific exercise.
   *
   * @param exerciseId - The ID to look up.
   * @returns The stats object or null if never practiced.
   */
  getExerciseStats: (exerciseId: string) => ExerciseStats | null

  /**
   * Calculates aggregated performance stats for the current calendar day.
   *
   * @returns Summary of duration, accuracy, and session count.
   */
  getTodayStats: () => { duration: number; accuracy: number; sessionsCount: number }

  /**
   * Returns current and longest practice streaks.
   */
  getStreakInfo: () => { current: number; longest: number }
}

const DAY_MS = 86_400_000

/**
 * Normalizes a timestamp to the beginning of the day.
 * @internal
 */
function startOfDayMs(ms: number): number {
  const d = new Date(ms)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/**
 * Coerces unknown values into a numeric timestamp in milliseconds.
 * @internal
 */
function toMs(value: unknown): number {
  if (typeof value === 'number') return value
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'string') {
    const ms = new Date(value).getTime()
    return Number.isFinite(ms) ? ms : 0
  }
  return 0
}

/**
 * Zustand store for persistent analytics, progress tracking, and achievement management.
 *
 * @remarks
 * This store uses `persist` middleware to save user progress to local storage.
 *
 * **Key Features**:
 * 1. **Session Lifecycle**: Handles the transition from active recording to historical data.
 * 2. **Skill Level Heuristics**: Calculates normalized intonation and rhythm scores based on recent performance trends.
 * 3. **Daily Streaks**: Tracks consistency using a rolling 24-hour window.
 * 4. **Schema Migrations**: Implements robust logic for handling legacy data formats (versions 1-3) during rehydration.
 *
 * @example
 * ```ts
 * const { progress, endSession } = useAnalyticsStore();
 * ```
 *
 * @public
 */
export const useAnalyticsStore = create<AnalyticsStore>()(
  persist<AnalyticsStore, [], [], Pick<AnalyticsStore, 'sessions' | 'progress'>>(
    (set, get) => ({
      currentSession: null,
      sessions: [],
      currentPerfectStreak: 0,
      onAchievementUnlocked: undefined,
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

      startSession: (exerciseId, exerciseName, mode) => {
        const nowMs = Date.now()
        analytics.track('practice_session_started', { exerciseId, exerciseName, mode })
        const session: PracticeSession = {
          id: crypto.randomUUID(),
          startTimeMs: nowMs,
          endTimeMs: nowMs,
          durationMs: 0,
          exerciseId,
          exerciseName,
          mode,
          notesAttempted: 0,
          notesCompleted: 0,
          accuracy: 0,
          averageCents: 0,
          noteResults: [],
        }
        set({ currentSession: session })
      },

      endSession: () => {
        const { currentSession, sessions, progress } = get()
        if (!currentSession) return

        const endTimeMs = Date.now()
        const durationMs = endTimeMs - currentSession.startTimeMs
        const completedSession: PracticeSession = { ...currentSession, endTimeMs, durationMs }
        const newSessions = [completedSession, ...sessions]

        const nextExerciseStats = updateExerciseStats(
          progress.exerciseStats,
          currentSession.exerciseId,
          completedSession.accuracy,
          durationMs,
          endTimeMs,
        )

        const newProgress: UserProgress = {
          ...progress,
          totalPracticeSessions: progress.totalPracticeSessions + 1,
          totalPracticeTime: progress.totalPracticeTime + Math.floor(durationMs / 1000),
          exerciseStats: nextExerciseStats,
          exercisesCompleted: progress.exercisesCompleted.includes(currentSession.exerciseId)
            ? progress.exercisesCompleted
            : [...progress.exercisesCompleted, currentSession.exerciseId],
        }

        updateStreak(newProgress, sessions)
        calculateSkills(newProgress, newSessions)

        analytics.track('practice_session_completed', {
          exerciseId: currentSession.exerciseId,
          durationMs,
          accuracy: completedSession.accuracy,
        })

        const newAchievements = checkLegacyAchievements(newProgress, completedSession, newSessions)
        newProgress.achievements = [...progress.achievements, ...newAchievements]

        set({
          currentSession: null,
          sessions: newSessions.slice(0, 100),
          progress: newProgress,
        })
      },

      recordNoteAttempt: (noteIndex, targetPitch, cents, wasInTune) => {
        set((state) => {
          const prevSession = state.currentSession
          if (!prevSession) return state

          const nextNoteResults = updateNoteResults(
            prevSession.noteResults,
            noteIndex,
            targetPitch,
            cents,
            wasInTune,
          )

          const inTuneNotes = nextNoteResults.filter((nr) => nr.wasInTune).length
          const accuracy =
            nextNoteResults.length > 0 ? (inTuneNotes / nextNoteResults.length) * 100 : 0
          const totalCents = nextNoteResults.reduce((sum, nr) => sum + Math.abs(nr.averageCents), 0)
          const averageCents = nextNoteResults.length > 0 ? totalCents / nextNoteResults.length : 0

          return {
            currentSession: {
              ...prevSession,
              notesAttempted: prevSession.notesAttempted + 1,
              noteResults: nextNoteResults,
              accuracy,
              averageCents,
            },
          }
        })
      },

      recordNoteCompletion: (noteIndex, timeToCompleteMs, technique) => {
        const state = get()
        if (!state.currentSession) return

        const noteResult = state.currentSession.noteResults.find((nr) => nr.noteIndex === noteIndex)
        // Pedagogy: a "perfect" note is within 5 cents
        const wasPerfect = noteResult && Math.abs(noteResult.averageCents) < 5

        // Update streak
        const newStreak = wasPerfect ? state.currentPerfectStreak + 1 : 0
        if (newStreak > 0 && newStreak % 5 === 0) {
          analytics.track('perfect_note_streak', { streak_length: newStreak })
        }

        set((state) => {
          const prevSession = state.currentSession
          if (!prevSession) return state
          const nextNoteResults = prevSession.noteResults.map((nr) =>
            nr.noteIndex === noteIndex ? { ...nr, timeToCompleteMs, technique } : nr,
          )
          return {
            currentPerfectStreak: newStreak,
            currentSession: {
              ...prevSession,
              notesCompleted: prevSession.notesCompleted + 1,
              noteResults: nextNoteResults,
            },
          }
        })

        // Check achievements after each completed note
        get().checkAndUnlockAchievements()
      },

      checkAndUnlockAchievements: () => {
        const state = get()
        if (!state.currentSession) return

        // Build stats for checker
        const stats: AchievementCheckStats = {
          currentSession: {
            correctNotes: state.currentSession.notesCompleted,
            perfectNoteStreak: state.currentPerfectStreak,
            accuracy: state.currentSession.accuracy,
            durationMs: Date.now() - state.currentSession.startTimeMs,
            exerciseId: state.currentSession.exerciseId,
          },
          totalSessions: state.sessions.length,
          totalPracticeDays: calculatePracticeDays(state.sessions),
          currentStreak: state.progress.currentStreak,
          longestStreak: state.progress.longestStreak,
          exercisesCompleted: state.progress.exercisesCompleted || [],
          totalPracticeTimeMs: state.progress.totalPracticeTime * 1000,
          averageAccuracy: state.progress.overallSkill,
        }

        // Get IDs of already unlocked achievements
        const unlockedIds = state.progress.achievements.map((a) => a.id)

        // Check for new achievements
        const newAchievements = checkAchievements(stats, unlockedIds)

        if (newAchievements.length > 0) {
          set((state) => ({
            progress: {
              ...state.progress,
              achievements: [...state.progress.achievements, ...newAchievements],
            },
          }))

          // Notify each newly unlocked achievement
          newAchievements.forEach((achievement) => {
            state.onAchievementUnlocked?.(achievement)
            analytics.track('achievement_unlocked', {
              achievementId: achievement.id,
              achievementName: achievement.name
            })
          })
        }
      },

      getSessionHistory: (days = 7) => {
        const cutoffMs = Date.now() - days * DAY_MS
        return get().sessions.filter((session) => session.endTimeMs >= cutoffMs)
      },

      getExerciseStats: (exerciseId) => {
        return get().progress.exerciseStats[exerciseId] || null
      },

      getTodayStats: () => {
        const today = startOfDayMs(Date.now())
        const todaySessions = get().sessions.filter(
          (session) => startOfDayMs(session.endTimeMs) === today,
        )
        const durationSec = todaySessions.reduce(
          (sum, s) => sum + Math.floor(s.durationMs / 1000),
          0,
        )
        const avgAccuracy =
          todaySessions.length > 0
            ? todaySessions.reduce((sum, s) => sum + s.accuracy, 0) / todaySessions.length
            : 0
        return {
          duration: durationSec,
          accuracy: avgAccuracy,
          sessionsCount: todaySessions.length,
        }
      },

      getStreakInfo: () => {
        const { currentStreak, longestStreak } = get().progress
        return { current: currentStreak, longest: longestStreak }
      },
    }),
    {
      name: 'violin-analytics',
      version: 3,
      migrate: (persisted: unknown, version: number) => {
        if (!persisted) return persisted as AnalyticsStore
        const persistedData = persisted as Record<string, unknown>
        if (version < 3) {
          if (Array.isArray(persistedData.sessions)) {
            persistedData.sessions = persistedData.sessions.map((s: unknown) => {
              const session = s as Record<string, unknown>
              const { duration, ...rest } = session || {}
              return {
                ...rest,
                durationMs: ((session.durationMs as number) ?? (duration as number) ?? 0) * 1000,
                noteResults: Array.isArray(session.noteResults)
                  ? session.noteResults.map((nr: unknown) => {
                      const noteResult = nr as Record<string, unknown>
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
          const progress = persistedData.progress as Record<string, unknown> | undefined
          if (progress?.exerciseStats) {
            Object.values(
              progress.exerciseStats as Record<string, Record<string, unknown>>,
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
          ? persistedData.sessions.map((s: unknown) => {
              const session = s as Record<string, unknown>
              const { startTime, endTime, ...rest } = session || {}
              return {
                ...rest,
                startTimeMs: toMs(session?.startTimeMs ?? startTime),
                endTimeMs: toMs(session?.endTimeMs ?? endTime),
              }
            })
          : []

        const progress = (persistedData.progress as Record<string, unknown>) || {}
        const achievements = Array.isArray(progress.achievements)
          ? progress.achievements.map((a: unknown) => {
              const achievement = a as Record<string, unknown>
              const { unlockedAt, ...rest } = achievement || {}
              return {
                ...rest,
                unlockedAtMs: toMs(achievement?.unlockedAtMs ?? unlockedAt),
              }
            })
          : []

        const exerciseStats =
          (progress.exerciseStats as Record<string, Record<string, unknown>>) || {}
        const migratedExerciseStats = Object.fromEntries(
          Object.entries(exerciseStats).map(([k, v]) => {
            const stats = v as Record<string, unknown>
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
        } as AnalyticsStore
      },
      partialize: (state) => ({
        sessions: state.sessions,
        progress: state.progress,
      }),
    },
  ),
)

/**
 * Calculates a normalized skill level for intonation based on recent sessions.
 *
 * @remarks
 * Uses a weighted average where recent performance has more impact on the score.
 *
 * @param sessions - History of completed sessions.
 * @returns Normalized skill score (0-100).
 * @internal
 */
function calculateIntonationSkill(sessions: PracticeSession[]): number {
  if (sessions.length === 0) return 0
  const recentSessions = sessions.slice(0, 10)
  const avgAccuracy = recentSessions.reduce((sum, s) => sum + s.accuracy, 0) / recentSessions.length
  const trend =
    recentSessions.length >= 5 ? recentSessions[0].accuracy - recentSessions[4].accuracy : 0
  return Math.min(100, Math.max(0, avgAccuracy + trend * 0.5))
}

/**
 * Updates persistent lifetime statistics for a specific exercise.
 *
 * @param exerciseStats - Current exercise stats map.
 * @param exerciseId - Target exercise ID.
 * @param accuracy - Accuracy achieved in the latest attempt.
 * @param durationMs - Time taken to complete.
 * @param endTimeMs - Completion timestamp.
 * @returns Updated exercise stats map.
 * @internal
 */
function updateExerciseStats(
  exerciseStats: Record<string, ExerciseStats>,
  exerciseId: string,
  accuracy: number,
  durationMs: number,
  endTimeMs: number,
): Record<string, ExerciseStats> {
  const existing = exerciseStats[exerciseId]
  const updated: ExerciseStats = {
    exerciseId,
    timesCompleted: (existing?.timesCompleted || 0) + 1,
    bestAccuracy: Math.max(existing?.bestAccuracy || 0, accuracy),
    averageAccuracy: existing
      ? (existing.averageAccuracy * existing.timesCompleted + accuracy) /
        (existing.timesCompleted + 1)
      : accuracy,
    fastestCompletionMs: existing ? Math.min(existing.fastestCompletionMs, durationMs) : durationMs,
    lastPracticedMs: endTimeMs,
  }
  return { ...exerciseStats, [exerciseId]: updated }
}

/**
 * Updates the user's daily practice streak based on the latest activity.
 *
 * @remarks
 * A streak is maintained if the user practices at least once every calendar day.
 *
 * @param progress - The user progress object to mutate.
 * @param sessions - Session history for context.
 * @internal
 */
function updateStreak(progress: UserProgress, sessions: PracticeSession[]) {
  const today = startOfDayMs(Date.now())
  const lastSession = sessions[0]
  const lastSessionDay = lastSession ? startOfDayMs(lastSession.endTimeMs) : 0
  const yesterday = today - DAY_MS

  if (sessions.length === 0 || lastSessionDay === yesterday) {
    progress.currentStreak += 1
    progress.longestStreak = Math.max(progress.longestStreak, progress.currentStreak)
  } else if (lastSessionDay < yesterday) {
    progress.currentStreak = 1
  }
}

/**
 * Recalculates all high-level skill metrics for the user.
 *
 * @param progress - The user progress object to update.
 * @param sessions - Recent session history.
 * @internal
 */
function calculateSkills(progress: UserProgress, sessions: PracticeSession[]) {
  progress.intonationSkill = calculateIntonationSkill(sessions)
  progress.rhythmSkill = calculateRhythmSkill(sessions)
  progress.overallSkill = Math.round((progress.intonationSkill + progress.rhythmSkill) / 2)
}

/**
 * Calculates the total number of unique calendar days practiced.
 *
 * @param sessions - Full session history.
 * @returns Count of unique days.
 * @internal
 */
function calculatePracticeDays(sessions: PracticeSession[]): number {
  const uniqueDays = new Set(sessions.map((s) => new Date(s.endTimeMs).toDateString()))
  return uniqueDays.size
}

/**
 * Helper to update the note results array with a new attempt.
 *
 * @remarks
 * Implements an incremental average calculation for cents deviation.
 *
 * @param noteResults - Current results array.
 * @param noteIndex - Target note index.
 * @param targetPitch - Scientific pitch name.
 * @param cents - Pitch deviation in cents.
 * @param wasInTune - Whether the note was played in tune.
 * @returns New results array.
 * @internal
 */
function updateNoteResults(
  noteResults: NoteResult[],
  noteIndex: number,
  targetPitch: string,
  cents: number,
  wasInTune: boolean,
): NoteResult[] {
  const existing = noteResults.find((nr) => nr.noteIndex === noteIndex)
  if (existing) {
    return noteResults.map((nr) => {
      if (nr.noteIndex !== noteIndex) return nr
      const nextAttempts = nr.attempts + 1
      const nextAverageCents = (nr.averageCents * nr.attempts + cents) / nextAttempts
      return {
        ...nr,
        targetPitch,
        attempts: nextAttempts,
        averageCents: nextAverageCents,
        wasInTune,
      }
    })
  }
  return [
    ...noteResults,
    {
      noteIndex,
      targetPitch,
      attempts: 1,
      timeToCompleteMs: 0,
      averageCents: cents,
      wasInTune,
    },
  ]
}

/**
 * Calculates a normalized skill level for rhythm based on recent sessions.
 *
 * @remarks
 * Uses Mean Absolute Error (MAE) of onset times to determine rhythmic precision.
 *
 * @param sessions - Recent session history.
 * @returns Normalized rhythm score (0-100).
 * @internal
 */
function calculateRhythmSkill(sessions: PracticeSession[]): number {
  if (sessions.length === 0) return 0
  const recentSessions = sessions.slice(0, 10)
  let totalError = 0
  let inWindowCount = 0
  let totalCount = 0
  for (const session of recentSessions) {
    for (const nr of session.noteResults) {
      if (nr.technique?.rhythm.onsetErrorMs !== undefined) {
        const error = Math.abs(nr.technique.rhythm.onsetErrorMs)
        totalError += error
        if (error <= 40) inWindowCount++
        totalCount++
      }
    }
  }
  if (totalCount === 0) return 0
  const mae = totalError / totalCount
  const percentInWindow = (inWindowCount / totalCount) * 100
  const maeScore = Math.max(0, 100 - mae / 4)
  const score = (maeScore + percentInWindow) / 2
  return Math.round(score)
}

/**
 * Checks for legacy achievements based on session outcomes.
 *
 * @remarks
 * This function handles simple achievements that don't require the full
 * asynchronous `achievement-checker` logic.
 *
 * @param progress - Current user progress.
 * @param session - The latest completed session.
 * @param allSessions - History of all sessions.
 * @returns Array of newly unlocked achievements.
 * @internal
 */
function checkLegacyAchievements(
  progress: UserProgress,
  session: PracticeSession,
  allSessions: PracticeSession[],
): Achievement[] {
  const achievements: Achievement[] = []
  if (session.accuracy === 100 && !progress.achievements.find((a) => a.id === 'first-perfect')) {
    achievements.push({
      id: 'first-perfect',
      name: 'First Perfect Scale',
      description: 'Completed a scale with 100% accuracy!',
      icon: '🎯',
      unlockedAtMs: Date.now(),
    })
  }
  if (progress.currentStreak === 7 && !progress.achievements.find((a) => a.id === 'week-streak')) {
    achievements.push({
      id: 'week-streak',
      name: '7-Day Streak',
      description: 'Practiced for 7 days in a row!',
      icon: '🔥',
      unlockedAtMs: Date.now(),
    })
  }
  const totalNotesCompleted = allSessions.reduce(
    (sum: number, s: PracticeSession) => sum + s.notesCompleted,
    0,
  )
  if (totalNotesCompleted >= 100 && !progress.achievements.find((a) => a.id === '100-notes')) {
    achievements.push({
      id: '100-notes',
      name: '100 Notes Mastered',
      description: 'Successfully played 100 notes in tune!',
      icon: '📈',
      unlockedAtMs: Date.now(),
    })
  }
  return achievements
}
