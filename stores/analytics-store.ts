import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { NoteTechnique } from '../lib/technique-types'

// Data Models
interface Note {
  pitch: string
  duration: string
  measure: number
}

interface Exercise {
  id: string
  name: string
  notes: Note[]
}

/** Represents a single, completed practice session. */
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

/** Contains detailed metrics for a single note within a practice session. */
interface NoteResult {
  noteIndex: number
  targetPitch: string
  attempts: number
  timeToCompleteMs: number
  averageCents: number
  wasInTune: boolean
  technique?: NoteTechnique
}

/** A comprehensive model of the user's long-term progress and stats. */
interface UserProgress {
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

/** Stores lifetime performance statistics for a specific exercise. */
interface ExerciseStats {
  exerciseId: string
  timesCompleted: number
  bestAccuracy: number
  averageAccuracy: number
  fastestCompletionMs: number
  lastPracticedMs: number
}

/** Represents a single unlockable achievement. */
export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlockedAtMs: number
}

/**
 * Defines the state and actions for the analytics Zustand store.
 */
interface AnalyticsStore {
  currentSession: PracticeSession | null
  sessions: PracticeSession[]
  progress: UserProgress
  startSession: (exerciseId: string, exerciseName: string, mode: 'tuner' | 'practice') => void
  endSession: () => void
  recordNoteAttempt: (
    noteIndex: number,
    targetPitch: string,
    cents: number,
    wasInTune: boolean,
  ) => void
  recordNoteCompletion: (
    noteIndex: number,
    timeToCompleteMs: number,
    technique?: NoteTechnique,
  ) => void
  getSessionHistory: (days?: number) => PracticeSession[]
  getExerciseStats: (exerciseId: string) => ExerciseStats | null
  getTodayStats: () => { duration: number; accuracy: number; sessionsCount: number }
  getStreakInfo: () => { current: number; longest: number }
}

const DAY_MS = 86_400_000

function startOfDayMs(ms: number): number {
  const d = new Date(ms)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function toMs(value: unknown): number {
  if (typeof value === 'number') return value
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'string') {
    const ms = new Date(value).getTime()
    return Number.isFinite(ms) ? ms : 0
  }
  return 0
}

export const useAnalyticsStore = create<AnalyticsStore>()(
  persist(
    (set, get) => ({
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

      startSession: (exerciseId, exerciseName, mode) => {
        const nowMs = Date.now()
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

        const completedSession: PracticeSession = {
          ...currentSession,
          endTimeMs,
          durationMs,
        }

        const newSessions = [completedSession, ...sessions]

        const exerciseId = currentSession.exerciseId
        const existingStats = progress.exerciseStats[exerciseId]

        const updatedStats: ExerciseStats = {
          exerciseId,
          timesCompleted: (existingStats?.timesCompleted || 0) + 1,
          bestAccuracy: Math.max(existingStats?.bestAccuracy || 0, completedSession.accuracy),
          averageAccuracy: existingStats
            ? (existingStats.averageAccuracy * existingStats.timesCompleted +
                completedSession.accuracy) /
              (existingStats.timesCompleted + 1)
            : completedSession.accuracy,
          fastestCompletionMs: existingStats
            ? Math.min(existingStats.fastestCompletionMs, durationMs)
            : durationMs,
          lastPracticedMs: endTimeMs,
        }

        const nextExerciseStats = {
          ...progress.exerciseStats,
          [exerciseId]: updatedStats,
        }

        const newProgress: UserProgress = {
          ...progress,
          totalPracticeSessions: progress.totalPracticeSessions + 1,
          totalPracticeTime: progress.totalPracticeTime + Math.floor(durationMs / 1000),
          exerciseStats: nextExerciseStats,
          exercisesCompleted: progress.exercisesCompleted.includes(exerciseId)
            ? progress.exercisesCompleted
            : [...progress.exercisesCompleted, exerciseId],
        }

        const today = startOfDayMs(Date.now())
        const lastSession = sessions[0]
        const lastSessionDay = lastSession ? startOfDayMs(lastSession.endTimeMs) : 0
        const yesterday = today - DAY_MS

        if (sessions.length === 0 || lastSessionDay === yesterday) {
          newProgress.currentStreak = progress.currentStreak + 1
          newProgress.longestStreak = Math.max(newProgress.longestStreak, newProgress.currentStreak)
        } else if (lastSessionDay < yesterday) {
          newProgress.currentStreak = 1
        }

        newProgress.intonationSkill = calculateIntonationSkill(newSessions)
        newProgress.rhythmSkill = calculateRhythmSkill(newSessions)
        newProgress.overallSkill = Math.round(
          (newProgress.intonationSkill + newProgress.rhythmSkill) / 2,
        )

        const newAchievements = checkAchievements(newProgress, completedSession, newSessions)
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

          const existing = prevSession.noteResults.find((nr) => nr.noteIndex === noteIndex)

          const nextNoteResults: NoteResult[] = existing
            ? prevSession.noteResults.map((nr) => {
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
            : [
                ...prevSession.noteResults,
                {
                  noteIndex,
                  targetPitch,
                  attempts: 1,
                  timeToCompleteMs: 0,
                  averageCents: cents,
                  wasInTune,
                },
              ]

          const inTuneNotes = nextNoteResults.filter((nr) => nr.wasInTune).length
          const accuracy =
            nextNoteResults.length > 0 ? (inTuneNotes / nextNoteResults.length) * 100 : 0
          const totalCents = nextNoteResults.reduce((sum, nr) => sum + Math.abs(nr.averageCents), 0)
          const averageCents = nextNoteResults.length > 0 ? totalCents / nextNoteResults.length : 0

          const nextSession: PracticeSession = {
            ...prevSession,
            notesAttempted: prevSession.notesAttempted + 1,
            noteResults: nextNoteResults,
            accuracy,
            averageCents,
          }
          return { currentSession: nextSession }
        })
      },

      recordNoteCompletion: (noteIndex, timeToCompleteMs, technique) => {
        set((state) => {
          const prevSession = state.currentSession
          if (!prevSession) return state
          const nextNoteResults = prevSession.noteResults.map((nr) =>
            nr.noteIndex === noteIndex ? { ...nr, timeToCompleteMs, technique } : nr,
          )
          return {
            currentSession: {
              ...prevSession,
              notesCompleted: prevSession.notesCompleted + 1,
              noteResults: nextNoteResults,
            },
          }
        })
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
<<<<<<< HEAD:lib/stores/analytics-store.ts
      version: 3,
      migrate: (persisted: any, version: number) => {
=======
      version: 2,
      migrate: (persisted: unknown) => {
>>>>>>> main:stores/analytics-store.ts
        if (!persisted) return persisted
        if (version < 3) {
          if (Array.isArray(persisted.sessions)) {
            persisted.sessions = persisted.sessions.map((s: any) => {
              const { duration, ...rest } = s || {}
              return {
                ...rest,
                durationMs: (s.durationMs ?? duration ?? 0) * 1000,
                noteResults: Array.isArray(s.noteResults)
                  ? s.noteResults.map((nr: any) => {
                      const { timeToComplete, ...nrRest } = nr || {}
                      return {
                        ...nrRest,
                        timeToCompleteMs: nr.timeToCompleteMs ?? timeToComplete ?? 0,
                      }
                    })
                  : [],
              }
            })
          }
          if (persisted.progress?.exerciseStats) {
            Object.values(persisted.progress.exerciseStats).forEach((stats: any) => {
              if (stats.fastestCompletion !== undefined && stats.fastestCompletionMs === undefined) {
                stats.fastestCompletionMs = stats.fastestCompletion * 1000
                delete stats.fastestCompletion
              }
            })
          }
        }

        const sessions = Array.isArray(persisted.sessions)
          ? persisted.sessions.map((s: unknown) => {
              const { startTime, endTime, ...rest } = s || {}
              return {
                ...rest,
                startTimeMs: toMs(s?.startTimeMs ?? startTime),
                endTimeMs: toMs(s?.endTimeMs ?? endTime),
              }
            })
          : []

        const progress = persisted.progress || {}
        const achievements = Array.isArray(progress.achievements)
          ? progress.achievements.map((a: unknown) => {
              const { unlockedAt, ...rest } = a || {}
              return {
                ...rest,
                unlockedAtMs: toMs(a?.unlockedAtMs ?? unlockedAt),
              }
            })
          : []

        const exerciseStats = progress.exerciseStats || {}
        const migratedExerciseStats = Object.fromEntries(
          Object.entries(exerciseStats).map(([k, v]: [string, unknown]) => {
            const { lastPracticed, ...rest } = v || {}
            return [
              k,
              {
                ...rest,
                lastPracticedMs: toMs(v?.lastPracticedMs ?? lastPracticed),
              },
            ]
          }),
        )

        return {
          ...persisted,
          sessions,
          progress: {
            ...progress,
            achievements,
            exerciseStats: migratedExerciseStats,
          },
        }
      },
      partialize: (state) => ({
        sessions: state.sessions,
        progress: state.progress,
      }),
    },
  ),
)

function calculateIntonationSkill(sessions: PracticeSession[]): number {
  if (sessions.length === 0) return 0
  const recentSessions = sessions.slice(0, 10)
  const avgAccuracy = recentSessions.reduce((sum, s) => sum + s.accuracy, 0) / recentSessions.length
  const trend =
    recentSessions.length >= 5 ? recentSessions[0].accuracy - recentSessions[4].accuracy : 0
  return Math.min(100, Math.max(0, avgAccuracy + trend * 0.5))
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

function checkAchievements(
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
