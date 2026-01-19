import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Data Models from prompt
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

export interface PracticeSession {
  id: string
  startTime: Date
  endTime: Date
  duration: number // seconds
  exerciseId: string
  exerciseName: string
  mode: 'tuner' | 'practice'

  // Metrics
  notesAttempted: number
  notesCompleted: number
  accuracy: number // percentage (0-100)
  averageCents: number // average deviation

  // Per-note details
  noteResults: NoteResult[]
}

interface NoteResult {
  noteIndex: number
  targetPitch: string
  attempts: number
  timeToComplete: number // milliseconds
  averageCents: number
  wasInTune: boolean
}

interface UserProgress {
  userId: string
  totalPracticeSessions: number
  totalPracticeTime: number // seconds
  exercisesCompleted: Exercise['id'][]
  currentStreak: number // days
  longestStreak: number // days
  sessions?: PracticeSession[]

  // Skill levels (0-100)
  intonationSkill: number
  rhythmSkill: number
  overallSkill: number

  // Achievements
  achievements: Achievement[]

  // Statistics by exercise
  exerciseStats: Record<string, ExerciseStats>
}

interface ExerciseStats {
  exerciseId: string
  timesCompleted: number
  bestAccuracy: number
  averageAccuracy: number
  fastestCompletion: number // seconds
  lastPracticed: Date
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlockedAt: Date
}

interface AnalyticsStore {
  // Current session
  currentSession: PracticeSession | null

  // Historical data
  sessions: PracticeSession[]
  progress: UserProgress

  // Actions
  startSession: (exerciseId: string, exerciseName: string, mode: 'tuner' | 'practice') => void
  endSession: () => void
  recordNoteAttempt: (
    noteIndex: number,
    targetPitch: string,
    cents: number,
    wasInTune: boolean,
  ) => void
  recordNoteCompletion: (noteIndex: number, timeToComplete: number) => void

  // Queries
  getSessionHistory: (days?: number) => PracticeSession[]
  getExerciseStats: (exerciseId: string) => ExerciseStats | null
  getTodayStats: () => { duration: number; accuracy: number; sessionsCount: number }
  getStreakInfo: () => { current: number; longest: number }
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
        const session: PracticeSession = {
          id: crypto.randomUUID(),
          startTime: new Date(),
          endTime: new Date(), // Will be updated
          duration: 0,
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

        // Calculate final metrics
        const endTime = new Date()
        const duration = Math.floor((endTime.getTime() - currentSession.startTime.getTime()) / 1000)

        const completedSession: PracticeSession = {
          ...currentSession,
          endTime,
          duration,
        }

        // Update sessions
        const newSessions = [completedSession, ...sessions]

        // Update progress
        const newProgress = {
          ...progress,
          totalPracticeSessions: progress.totalPracticeSessions + 1,
          totalPracticeTime: progress.totalPracticeTime + duration,
        }

        // Update exercise stats
        const exerciseId = currentSession.exerciseId
        const existingStats = progress.exerciseStats[exerciseId]

        newProgress.exerciseStats[exerciseId] = {
          exerciseId,
          timesCompleted: (existingStats?.timesCompleted || 0) + 1,
          bestAccuracy: Math.max(existingStats?.bestAccuracy || 0, completedSession.accuracy),
          averageAccuracy: existingStats
            ? (existingStats.averageAccuracy * existingStats.timesCompleted +
                completedSession.accuracy) /
              (existingStats.timesCompleted + 1)
            : completedSession.accuracy,
          fastestCompletion: existingStats
            ? Math.min(existingStats.fastestCompletion, duration)
            : duration,
          lastPracticed: endTime,
        }

        // Update streak
        const today = new Date().setHours(0, 0, 0, 0)
        const lastSession = sessions[0]
        const lastSessionDate = lastSession ? new Date(lastSession.endTime).setHours(0, 0, 0, 0) : 0
        const yesterday = today - 86400000 // 24 hours

        if (lastSessionDate === yesterday || sessions.length === 0) {
          newProgress.currentStreak = progress.currentStreak + 1
          newProgress.longestStreak = Math.max(newProgress.longestStreak, newProgress.currentStreak)
        } else if (lastSessionDate < yesterday) {
          newProgress.currentStreak = 1
        }

        // Calculate skill levels
        newProgress.intonationSkill = calculateIntonationSkill(newSessions)
        // placeholder for rhythm skill
        newProgress.rhythmSkill = newProgress.rhythmSkill || 0
        newProgress.overallSkill = Math.round(
          (newProgress.intonationSkill + newProgress.rhythmSkill) / 2,
        )

        // Check for new achievements
        const newAchievements = checkAchievements(newProgress, completedSession)
        newProgress.achievements = [...progress.achievements, ...newAchievements]

        set({
          currentSession: null,
          sessions: newSessions.slice(0, 100), // Keep last 100 sessions
          progress: newProgress,
        })
      },

      recordNoteAttempt: (noteIndex, targetPitch, cents, wasInTune) => {
        set((state) => {
          if (!state.currentSession) return state

          const session = { ...state.currentSession }
          session.notesAttempted++

          // Find or create note result
          let noteResult = session.noteResults.find((nr) => nr.noteIndex === noteIndex)
          if (!noteResult) {
            noteResult = {
              noteIndex,
              targetPitch,
              attempts: 0,
              timeToComplete: 0,
              averageCents: 0,
              wasInTune: false,
            }
            session.noteResults.push(noteResult)
          }

          // Update attempts and average cents
          noteResult.attempts++
          noteResult.averageCents =
            (noteResult.averageCents * (noteResult.attempts - 1) + cents) / noteResult.attempts
          noteResult.wasInTune = wasInTune

          // Recalculate session accuracy
          const inTuneNotes = session.noteResults.filter((nr) => nr.wasInTune).length
          session.accuracy = (inTuneNotes / session.noteResults.length) * 100

          // Recalculate average cents
          const totalCents = session.noteResults.reduce(
            (sum, nr) => sum + Math.abs(nr.averageCents),
            0,
          )
          session.averageCents = totalCents / session.noteResults.length

          return { currentSession: session }
        })
      },

      recordNoteCompletion: (noteIndex, timeToComplete) => {
        set((state) => {
          if (!state.currentSession) return state

          const session = { ...state.currentSession }
          session.notesCompleted++

          const noteResult = session.noteResults.find((nr) => nr.noteIndex === noteIndex)
          if (noteResult) {
            noteResult.timeToComplete = timeToComplete
          }

          return { currentSession: session }
        })
      },

      getSessionHistory: (days = 7) => {
        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() - days)

        return get().sessions.filter((session) => new Date(session.endTime) >= cutoff)
      },

      getExerciseStats: (exerciseId) => {
        return get().progress.exerciseStats[exerciseId] || null
      },

      getTodayStats: () => {
        const today = new Date().setHours(0, 0, 0, 0)
        const todaySessions = get().sessions.filter((session) => {
          const sessionDate = new Date(session.endTime).setHours(0, 0, 0, 0)
          return sessionDate === today
        })

        const duration = todaySessions.reduce((sum, s) => sum + s.duration, 0)
        const avgAccuracy =
          todaySessions.length > 0
            ? todaySessions.reduce((sum, s) => sum + s.accuracy, 0) / todaySessions.length
            : 0

        return {
          duration,
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
      partialize: (state) => ({
        sessions: state.sessions,
        progress: state.progress,
      }),
    },
  ),
)

function calculateIntonationSkill(sessions: PracticeSession[]): number {
  if (sessions.length === 0) return 0

  // Take average of last 10 sessions
  const recentSessions = sessions.slice(0, 10)
  const avgAccuracy = recentSessions.reduce((sum, s) => sum + s.accuracy, 0) / recentSessions.length

  // Weight recent sessions more heavily
  const trend =
    recentSessions.length >= 5 ? recentSessions[0].accuracy - recentSessions[4].accuracy : 0

  return Math.min(100, Math.max(0, avgAccuracy + trend * 0.5))
}

function checkAchievements(progress: UserProgress, session: PracticeSession): Achievement[] {
  const achievements: Achievement[] = []

  // First Perfect Scale
  if (session.accuracy === 100 && !progress.achievements.find((a) => a.id === 'first-perfect')) {
    achievements.push({
      id: 'first-perfect',
      name: 'First Perfect Scale',
      description: 'Completed a scale with 100% accuracy!',
      icon: '🎯',
      unlockedAt: new Date(),
    })
  }

  // 7-Day Streak
  if (progress.currentStreak === 7 && !progress.achievements.find((a) => a.id === 'week-streak')) {
    achievements.push({
      id: 'week-streak',
      name: '7-Day Streak',
      description: 'Practiced for 7 days in a row!',
      icon: '🔥',
      unlockedAt: new Date(),
    })
  }

  // 100 Notes Mastered
  const totalNotesCompleted =
    (progress.sessions || []).reduce(
      (sum: number, s: any) => sum + (s.notesCompleted || 0),
      0,
    ) + session.notesCompleted
  if (totalNotesCompleted >= 100 && !progress.achievements.find((a) => a.id === '100-notes')) {
    achievements.push({
      id: '100-notes',
      name: '100 Notes Mastered',
      description: 'Successfully played 100 notes in tune!',
      icon: '📈',
      unlockedAt: new Date(),
    })
  }

  return achievements
}
