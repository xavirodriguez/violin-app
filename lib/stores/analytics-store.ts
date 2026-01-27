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

/** Represents a single, completed practice session. */
export interface PracticeSession {
  /** A unique identifier for the session. */
  id: string
  /** The ISO 8601 timestamp when the session started. */
  startTime: Date
  /** The ISO 8601 timestamp when the session ended. */
  endTime: Date
  /** The total duration of the session, in seconds. */
  duration: number
  /** The ID of the exercise that was practiced. */
  exerciseId: string
  /** The name of the exercise that was practiced. */
  exerciseName: string
  /** The mode the user was in during the session. */
  mode: 'tuner' | 'practice'
  /** The total number of notes the user attempted to play. */
  notesAttempted: number
  /** The total number of notes the user successfully completed. */
  notesCompleted: number
  /** The overall accuracy for the session, as a percentage from 0 to 100. */
  accuracy: number
  /** The average pitch deviation for all attempted notes, in cents. */
  averageCents: number
  /** Detailed results for each note within the exercise. */
  noteResults: NoteResult[]
}

/** Contains detailed metrics for a single note within a practice session. */
interface NoteResult {
  /** The zero-based index of the note in the exercise. */
  noteIndex: number
  /** The target pitch of the note (e.g., "G4"). */
  targetPitch: string
  /** The number of times the user tried to play this note. */
  attempts: number
  /** The time it took to successfully match the note from the first attempt, in milliseconds. */
  timeToComplete: number
  /** The average pitch deviation for this specific note across all attempts, in cents. */
  averageCents: number
  /** A boolean indicating if the final attempt was in tune. */
  wasInTune: boolean
}

/** A comprehensive model of the user's long-term progress and stats. */
interface UserProgress {
  /** The unique identifier for the user. */
  userId: string
  /** The total number of practice sessions the user has completed. */
  totalPracticeSessions: number
  /** The cumulative time the user has spent practicing, in seconds. */
  totalPracticeTime: number
  /** A list of unique exercise IDs that the user has completed at least once. */
  exercisesCompleted: Exercise['id'][]
  /** The current consecutive daily practice streak, in days. */
  currentStreak: number
  /** The longest consecutive daily practice streak the user has ever achieved, in days. */
  longestStreak: number
  /** A calculated skill score for intonation (pitch accuracy), from 0 to 100. */
  intonationSkill: number
  /** A calculated skill score for rhythm (timing accuracy), from 0 to 100. */
  rhythmSkill: number
  /** A combined overall skill score, from 0 to 100. */
  overallSkill: number
  /** A list of achievements the user has unlocked. */
  achievements: Achievement[]
  /** A record of performance statistics for each exercise, keyed by exercise ID. */
  exerciseStats: Record<string, ExerciseStats>
}

/** Stores lifetime performance statistics for a specific exercise. */
interface ExerciseStats {
  /** The ID of the exercise these stats belong to. */
  exerciseId: string
  /** The total number of times this exercise has been completed. */
  timesCompleted: number
  /** The highest accuracy score achieved for this exercise, from 0 to 100. */
  bestAccuracy: number
  /** The average accuracy score across all completions of this exercise, from 0 to 100. */
  averageAccuracy: number
  /** The shortest time taken to complete this exercise, in seconds. */
  fastestCompletion: number
  /** The date this exercise was last practiced. */
  lastPracticed: Date
}

/** Represents a single unlockable achievement. */
export interface Achievement {
  /** A unique identifier for the achievement. */
  id: string
  /** The display name of the achievement. */
  name: string
  /** A description of how to unlock the achievement. */
  description: string
  /** An emoji or icon representing the achievement. */
  icon: string
  /** The date the achievement was unlocked. */
  unlockedAt: Date
}

/**
 * Defines the state and actions for the analytics Zustand store.
 *
 * @remarks
 * This store is responsible for tracking user performance, both within a single
 * practice session and over the long term. It persists its data to local storage.
 */
interface AnalyticsStore {
  /**
   * The currently active practice session. `null` if no session is in progress.
   */
  currentSession: PracticeSession | null

  /**
   * A historical log of the user's most recent practice sessions.
   */
  sessions: PracticeSession[]

  /**
   * The user's aggregated long-term progress, skills, and achievements.
   */
  progress: UserProgress

  /**
   * Starts a new practice session.
   *
   * @param exerciseId - The ID of the exercise being practiced.
   * @param exerciseName - The name of the exercise.
   * @param mode - The practice mode ('tuner' or 'practice').
   */
  startSession: (exerciseId: string, exerciseName: string, mode: 'tuner' | 'practice') => void

  /**
   * Ends the current practice session, calculates final metrics, and persists the data.
   */
  endSession: () => void

  /**
   * Records an attempt to play a specific note.
   *
   * @param noteIndex - The index of the note in the exercise.
   * @param targetPitch - The target pitch of the note.
   * @param cents - The pitch deviation of the attempt.
   * @param wasInTune - Whether the attempt was considered in tune.
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
   * @param noteIndex - The index of the completed note.
   * @param timeToComplete - The time taken to complete the note, in milliseconds.
   */
  recordNoteCompletion: (noteIndex: number, timeToComplete: number) => void

  /**
   * Retrieves a filtered list of recent practice sessions.
   *
   * @param days - The number of past days to include sessions from.
   * @defaultValue 7
   * @returns An array of `PracticeSession` objects.
   */
  getSessionHistory: (days?: number) => PracticeSession[]

  /**
   * Retrieves the lifetime statistics for a specific exercise.
   *
   * @param exerciseId - The ID of the exercise to look up.
   * @returns The `ExerciseStats` object, or `null` if none exist.
   */
  getExerciseStats: (exerciseId: string) => ExerciseStats | null

  /**
   * Calculates and returns key performance statistics for the current day.
   */
  getTodayStats: () => { duration: number; accuracy: number; sessionsCount: number }

  /**
   * Returns the user's current and longest practice streaks.
   */
  getStreakInfo: () => { current: number; longest: number }
}

/**
 * A Zustand store for tracking and persisting user analytics and progress.
 *
 * @remarks
 * This store captures detailed metrics from each practice session, aggregates
 * historical data, and calculates long-term skill progression. It uses the
 * `persist` middleware to save its state to the browser's local storage under
 * the key 'violin-analytics', making user progress durable across sessions.
 */
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
        const newAchievements = checkAchievements(newProgress, completedSession, newSessions)
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

/**
 * Calculates a user's intonation skill level based on historical performance.
 *
 * @remarks
 * This function analyzes the last 10 practice sessions to determine a skill score.
 * It calculates a baseline from the average accuracy and applies a small bonus or
 * penalty based on the recent trend (improvement or decline), making the score
 * responsive to recent performance.
 *
 * @internal
 *
 * @param sessions - A list of the user's past practice sessions.
 * @returns A skill score between 0 and 100.
 */
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

function checkAchievements(
  progress: UserProgress,
  session: PracticeSession,
  allSessions: PracticeSession[],
): Achievement[] {
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
      unlockedAt: new Date(),
    })
  }

  return achievements
}
