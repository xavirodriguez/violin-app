import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { NoteTechnique } from '../lib/technique-types'
import type { Exercise } from '@/lib/domain/musical-types'
import { checkAchievements } from '@/lib/achievements/achievement-checker'
import type { AchievementCheckStats } from '@/lib/achievements/achievement-definitions'
import { analytics } from '@/lib/analytics-tracker'

/**
 * Data model for a completed practice session.
 */
export interface PracticeSession {
  id: string
  startTimeMs: number
  endTimeMs: number
  durationMs: number
  exerciseId: string
  exerciseName: string
  mode: 'tuner' | 'practice'
  notesAttempted: number
  notesCompleted: number
  accuracy: number
  averageCents: number
  noteResults: NoteResult[]
}

/** @internal */
export interface NoteResult {
  noteIndex: number
  targetPitch: string
  attempts: number
  timeToCompleteMs: number
  averageCents: number
  wasInTune: boolean
  technique?: NoteTechnique
}

/**
 * Long-term progress and skill model for the user.
 */
export interface UserProgress {
  userId: string
  totalPracticeSessions: number
  totalPracticeTime: number
  exercisesCompleted: Exercise['id'][]
  currentStreak: number
  longestStreak: number
  intonationSkill: number
  rhythmSkill: number
  overallSkill: number
  achievements: Achievement[]
  exerciseStats: Record<string, ExerciseStats>
}

/** @internal */
export interface ExerciseStats {
  exerciseId: string
  timesCompleted: number
  bestAccuracy: number
  averageAccuracy: number
  fastestCompletionMs: number
  lastPracticedMs: number
}

/**
 * Represents a musical achievement or milestone earned by the user.
 */
export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlockedAtMs: number
}

/** Parameters for recording a note attempt. */
export interface RecordAttemptParams {
  noteIndex: number
  targetPitch: string
  cents: number
  wasInTune: boolean
}

/** Parameters for recording a note completion. */
export interface RecordCompletionParams {
  noteIndex: number
  timeToCompleteMs: number
  technique?: NoteTechnique
}

/**
 * Interface for the Analytics Store, managing long-term progress and session history.
 */
export interface AnalyticsStore {
  currentSession: PracticeSession | undefined
  sessions: PracticeSession[]
  progress: UserProgress
  onAchievementUnlocked?: (achievement: Achievement) => void
  currentPerfectStreak: number

  startSession: (exerciseId: string, exerciseName: string, mode: 'tuner' | 'practice') => void
  endSession: () => void
  recordNoteAttempt: (noteIndex: number, targetPitch: string, cents: number, wasInTune: boolean) => void
  recordNoteCompletion: (noteIndex: number, timeToCompleteMs: number, technique?: NoteTechnique) => void
  checkAndUnlockAchievements: () => void
  getSessionHistory: (days?: number) => PracticeSession[]
  getExerciseStats: (exerciseId: string) => ExerciseStats | undefined
  getTodayStats: () => { duration: number; accuracy: number; sessionsCount: number }
  getStreakInfo: () => { current: number; longest: number }
}

const DAY_MS = 86_400_000

/** @internal */
function startOfDayMs(ms: number): number {
  const d = new Date(ms)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** @internal */
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
 * Zustand store for persistent analytics and progress tracking.
 */
export const useAnalyticsStore = create<AnalyticsStore>()(
  persist<AnalyticsStore, [], [], Pick<AnalyticsStore, 'sessions' | 'progress'>>(
    (set, get) => ({
      currentSession: undefined,
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
        if (currentSession === undefined) return

        const completedSession = finalizeSessionData(currentSession)
        const newSessions = [completedSession, ...sessions]
        const newProgress = getUpdatedProgress(progress, completedSession, sessions)

        trackCompletionAnalytics(completedSession)

        set({
          currentSession: undefined,
          sessions: newSessions.slice(0, 100),
          progress: newProgress,
        })
      },

      recordNoteAttempt: (noteIndex, targetPitch, cents, wasInTune) => {
        set((state) => {
          const prevSession = state.currentSession
          if (prevSession === undefined) return state

          const params = { noteIndex, targetPitch, cents, wasInTune }
          const nextNoteResults = updateNoteResults({
            noteResults: prevSession.noteResults,
            ...params,
          })

          const summary = calculateSessionSummary(nextNoteResults)

          return {
            currentSession: {
              ...prevSession,
              notesAttempted: prevSession.notesAttempted + 1,
              noteResults: nextNoteResults,
              ...summary,
            },
          }
        })
      },

      recordNoteCompletion: (noteIndex, timeToCompleteMs, technique) => {
        const state = get()
        if (state.currentSession === undefined) return

        const noteResult = state.currentSession.noteResults.find((nr) => nr.noteIndex === noteIndex)
        const wasPerfect = noteResult !== undefined && Math.abs(noteResult.averageCents) < 5
        const newPerfectStreak = wasPerfect ? state.currentPerfectStreak + 1 : 0

        handleStreakMilestones(newPerfectStreak)

        set((state) => {
          const prevSession = state.currentSession
          if (prevSession === undefined) return state
          const params = { noteIndex, timeToCompleteMs, technique }
          const nextNoteResults = updateCompletedNote(prevSession.noteResults, params)
          return {
            currentPerfectStreak: newPerfectStreak,
            currentSession: {
              ...prevSession,
              notesCompleted: prevSession.notesCompleted + 1,
              noteResults: nextNoteResults,
            },
          }
        })

        get().checkAndUnlockAchievements()
      },

      checkAndUnlockAchievements: () => {
        const state = get()
        if (state.currentSession === undefined) return

        const stats = buildAchievementStats(state)
        const unlockedIds = state.progress.achievements.map((a) => a.id)
        const newAchievements = checkAchievements({ stats, unlockedAchievementIds: unlockedIds })

        if (newAchievements.length > 0) {
          processNewAchievements(set, state, newAchievements)
        }
      },

      getSessionHistory: (days = 7) => {
        const cutoffMs = Date.now() - days * DAY_MS
        return get().sessions.filter((session) => session.endTimeMs >= cutoffMs)
      },

      getExerciseStats: (exerciseId) => {
        return get().progress.exerciseStats[exerciseId] || undefined
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
        return migratePersistence(persisted, version)
      },
      partialize: (state) => ({
        sessions: state.sessions,
        progress: state.progress,
      }),
    },
  ),
)

function finalizeSessionData(session: PracticeSession): PracticeSession {
  const endTimeMs = Date.now()
  const durationMs = endTimeMs - session.startTimeMs
  const finalized: PracticeSession = { ...session, endTimeMs, durationMs }

  return finalized
}

function getUpdatedProgress(
  progress: UserProgress,
  completedSession: PracticeSession,
  sessions: PracticeSession[],
): UserProgress {
  const nextExerciseStats = updateExerciseStats(
    progress.exerciseStats,
    completedSession.exerciseId,
    completedSession.accuracy,
    completedSession.durationMs,
    completedSession.endTimeMs,
  )

  const newProgress: UserProgress = {
    ...progress,
    totalPracticeSessions: progress.totalPracticeSessions + 1,
    totalPracticeTime: progress.totalPracticeTime + Math.floor(completedSession.durationMs / 1000),
    exerciseStats: nextExerciseStats,
    exercisesCompleted: progress.exercisesCompleted.includes(completedSession.exerciseId)
      ? progress.exercisesCompleted
      : [...progress.exercisesCompleted, completedSession.exerciseId],
  }

  updateStreak(newProgress, sessions)
  const allSessions = [completedSession, ...sessions]
  calculateSkills(newProgress, allSessions)

  return newProgress
}

function trackCompletionAnalytics(session: PracticeSession): void {
  analytics.track('practice_session_completed', {
    exerciseId: session.exerciseId,
    durationMs: session.durationMs,
    accuracy: session.accuracy,
  })
}

function calculateSessionSummary(noteResults: NoteResult[]) {
  const inTuneNotes = noteResults.filter((nr) => nr.wasInTune).length
  const accuracy = noteResults.length > 0 ? (inTuneNotes / noteResults.length) * 100 : 0
  const totalCents = noteResults.reduce((sum, nr) => sum + Math.abs(nr.averageCents), 0)
  const averageCents = noteResults.length > 0 ? totalCents / noteResults.length : 0

  return { accuracy, averageCents }
}

function handleStreakMilestones(streak: number): void {
  const isMilestone = streak > 0 && streak % 5 === 0
  if (isMilestone) {
    analytics.track('perfect_note_streak', { streak_length: streak })
  }
}

function updateCompletedNote(noteResults: NoteResult[], params: RecordCompletionParams): NoteResult[] {
  const { noteIndex, timeToCompleteMs, technique } = params
  const results = noteResults.map((nr) =>
    nr.noteIndex === noteIndex ? { ...nr, timeToCompleteMs, technique } : nr,
  )

  return results
}

function buildAchievementStats(state: AnalyticsStore): AchievementCheckStats {
  const { currentSession, currentPerfectStreak, sessions, progress } = state
  if (currentSession === undefined) {
    throw new Error('Cannot build achievement stats without active session')
  }

  const totalCompleted = sessions.reduce((sum, s) => sum + s.notesCompleted, 0)
  const totalNotesCompleted = totalCompleted + currentSession.notesCompleted

  return {
    currentSession: {
      correctNotes: currentSession.notesCompleted,
      perfectNoteStreak: currentPerfectStreak,
      accuracy: currentSession.accuracy,
      durationMs: Date.now() - currentSession.startTimeMs,
      exerciseId: currentSession.exerciseId,
    },
    totalSessions: sessions.length,
    totalPracticeDays: calculatePracticeDays(sessions),
    currentStreak: progress.currentStreak,
    longestStreak: progress.longestStreak,
    exercisesCompleted: progress.exercisesCompleted || [],
    totalPracticeTimeMs: progress.totalPracticeTime * 1000,
    averageAccuracy: progress.overallSkill,
    totalNotesCompleted,
  }
}

function processNewAchievements(
  set: (update: Partial<AnalyticsStore> | ((s: AnalyticsStore) => Partial<AnalyticsStore>)) => void,
  state: AnalyticsStore,
  newAchievements: Achievement[],
): void {
  set((prev) => ({
    progress: {
      ...prev.progress,
      achievements: [...prev.progress.achievements, ...newAchievements],
    },
  }))

  newAchievements.forEach((achievement) => {
    state.onAchievementUnlocked?.(achievement)
    analytics.track('achievement_unlocked', {
      achievementId: achievement.id,
      achievementName: achievement.name,
    })
  })
}

function calculateIntonationSkill(sessions: PracticeSession[]): number {
  if (sessions.length === 0) return 0
  const recentSessions = sessions.slice(0, 10)
  const totalAcc = recentSessions.reduce((sum, s) => sum + s.accuracy, 0)
  const avgAccuracy = totalAcc / recentSessions.length
  const trend = recentSessions.length >= 5 ? recentSessions[0].accuracy - recentSessions[4].accuracy : 0
  const skill = Math.min(100, Math.max(0, avgAccuracy + trend * 0.5))

  return skill
}

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

function calculateSkills(progress: UserProgress, sessions: PracticeSession[]) {
  progress.intonationSkill = calculateIntonationSkill(sessions)
  progress.rhythmSkill = calculateRhythmSkill(sessions)
  const overall = Math.round((progress.intonationSkill + progress.rhythmSkill) / 2)
  progress.overallSkill = overall
}

function calculatePracticeDays(sessions: PracticeSession[]): number {
  const dates = sessions.map((s) => new Date(s.endTimeMs).toDateString())
  const uniqueDays = new Set(dates)

  return uniqueDays.size
}

function updateNoteResults(params: RecordAttemptParams & { noteResults: NoteResult[] }): NoteResult[] {
  const { noteResults, noteIndex, targetPitch, cents, wasInTune } = params
  const existing = noteResults.find((nr) => nr.noteIndex === noteIndex)
  if (existing) {
    return noteResults.map((nr) => {
      if (nr.noteIndex !== noteIndex) return nr
      const nextAttempts = nr.attempts + 1
      const nextAverageCents = (nr.averageCents * nr.attempts + cents) / nextAttempts
      return { ...nr, targetPitch, attempts: nextAttempts, averageCents: nextAverageCents, wasInTune }
    })
  }
  return [
    ...noteResults,
    { noteIndex, targetPitch, attempts: 1, timeToCompleteMs: 0, averageCents: cents, wasInTune },
  ]
}

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

function migratePersistence(persisted: unknown, version: number): AnalyticsStore {
  const persistedData = persisted as Record<string, unknown>
  if (version < 3) {
    migrateV1V2(persistedData)
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

  const exerciseStats = (progress.exerciseStats as Record<string, Record<string, unknown>>) || {}
  const migratedExerciseStats = Object.fromEntries(
    Object.entries(exerciseStats).map(([k, v]) => {
      const stats = v as Record<string, unknown>
      const { lastPracticed, ...rest } = stats || {}
      return [k, { ...rest, lastPracticedMs: toMs(stats?.lastPracticedMs ?? lastPracticed) }]
    }),
  )

  return {
    ...persistedData,
    sessions,
    progress: { ...progress, achievements, exerciseStats: migratedExerciseStats },
  } as AnalyticsStore
}

function migrateV1V2(data: Record<string, unknown>): void {
  if (Array.isArray(data.sessions)) {
    data.sessions = data.sessions.map((s: unknown) => {
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
                timeToCompleteMs: (noteResult.timeToCompleteMs as number) ?? (timeToComplete as number) ?? 0,
              }
            })
          : [],
      }
    })
  }
  const progress = data.progress as Record<string, unknown> | undefined
  if (progress?.exerciseStats) {
    Object.values(progress.exerciseStats as Record<string, Record<string, unknown>>).forEach((stats) => {
      if (stats.fastestCompletion !== undefined && stats.fastestCompletionMs === undefined) {
        stats.fastestCompletionMs = (stats.fastestCompletion as number) * 1000
        delete stats.fastestCompletion
      }
    })
  }
}
