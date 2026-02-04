import { create } from 'zustand'
import { PracticeSession } from './session.store'
import { validatedPersist } from '@/lib/persistence/validated-persist'
import { createMigrator } from '@/lib/persistence/migrator'
import { ProgressStateSchema } from '@/lib/schemas/persistence.schema'

/**
 * Event representing a completed exercise within the progress history.
 *
 * @public
 */
export interface ProgressEvent {
  /** Unix timestamp of the event. */
  ts: number
  /** ID of the exercise. */
  exerciseId: string
  /** Accuracy achieved (0-100). */
  accuracy: number
  /** Average rhythmic error in milliseconds. */
  rhythmErrorMs: number
}

/**
 * Aggregated skill metrics.
 *
 * @public
 */
export interface SkillAggregates {
  /** Intonation accuracy score (0-100). */
  intonation: number
  /** Rhythmic precision score (0-100). */
  rhythm: number
  /** Overall combined skill level. */
  overall: number
}

/**
 * A snapshot of the user's progress at a specific point in time.
 *
 * @public
 */
export interface ProgressSnapshot {
  /** The user this snapshot belongs to. */
  userId: string
  /** The time window covered by the snapshot. */
  window: '7d' | '30d' | 'all'
  /** Aggregated skills at this snapshot. */
  aggregates: SkillAggregates
  /** ID of the session that triggered this snapshot. */
  lastSessionId: string
}

/**
 * Lifetime statistics for an individual exercise.
 *
 * @public
 */
export interface ExerciseStats {
  /** ID of the exercise. */
  exerciseId: string
  /** Number of times completed. */
  timesCompleted: number
  /** Best accuracy recorded. */
  bestAccuracy: number
  /** Average accuracy across all attempts. */
  averageAccuracy: number
  /** Fastest completion time in milliseconds. */
  fastestCompletionMs: number
  /** Unix timestamp of the last attempt. */
  lastPracticedMs: number
}

/**
 * State structure for the Progress Store.
 *
 * @public
 */
export interface ProgressState {
  /** Version of the persistence schema. */
  schemaVersion: 1
  /** Lifetime count of practice sessions. */
  totalPracticeSessions: number
  /** Total practice time in seconds. */
  totalPracticeTime: number
  /** IDs of exercises that have been completed. */
  exercisesCompleted: string[]
  /** Current daily practice streak. */
  currentStreak: number
  /** Highest daily streak recorded. */
  longestStreak: number
  /** Current intonation skill level (0-100). */
  intonationSkill: number
  /** Current rhythm skill level (0-100). */
  rhythmSkill: number
  /** Overall skill level (0-100). */
  overallSkill: number
  /** Map of per-exercise statistics. */
  exerciseStats: Record<string, ExerciseStats>
  /** Circular buffer of recent progress events (last 1000). */
  eventBuffer: ProgressEvent[]
  /** Historical snapshots of progress. */
  snapshots: ProgressSnapshot[]
  /** Counter of events processed, used for snapshot triggers. */
  eventCounter: number
}

/**
 * Actions available in the Progress Store.
 */
interface ProgressActions {
  /**
   * Integrates a completed session into the long-term progress.
   *
   * @param session - The completed session data.
   */
  addSession: (session: PracticeSession) => void

  /**
   * Re-calculates skill levels based on session history.
   *
   * @param sessions - Recent session history.
   */
  updateSkills: (sessions: PracticeSession[]) => void
}

const DEFAULT_PROGRESS: ProgressState = {
  schemaVersion: 1,
  totalPracticeSessions: 0,
  totalPracticeTime: 0,
  exercisesCompleted: [],
  currentStreak: 0,
  longestStreak: 0,
  intonationSkill: 0,
  rhythmSkill: 0,
  overallSkill: 0,
  exerciseStats: {},
  eventBuffer: [],
  snapshots: [],
  eventCounter: 0
}

/**
 * Zustand store for high-density, persistent progress tracking.
 *
 * @remarks
 * This store is optimized for long-term storage of user performance metrics.
 * It uses a circular event buffer (`eventBuffer`) and incremental snapshots
 * to keep the storage footprint manageable while retaining high-fidelity data.
 *
 * Data is validated against `ProgressStateSchema` and persisted using
 * custom logic that handles serialization and schema migrations.
 *
 * @public
 */
export const useProgressStore = create<ProgressState & ProgressActions>()(
  validatedPersist(
    ProgressStateSchema as any,
    (set, get) => ({
      ...DEFAULT_PROGRESS,

      addSession: (session: PracticeSession) => {
        const { exerciseStats, eventBuffer, eventCounter } = get()

        // 1. Create ProgressEvent
        const avgRhythmError = session.noteResults.reduce((acc, nr) => {
          return acc + (nr.technique?.rhythm.onsetErrorMs ?? 0)
        }, 0) / (session.noteResults.length || 1)

        const newEvent: ProgressEvent = {
          ts: session.endTimeMs,
          exerciseId: session.exerciseId,
          accuracy: session.accuracy,
          rhythmErrorMs: avgRhythmError
        }

        // 2. Manage Buffer (Circular N=1000)
        const newBuffer = [newEvent, ...eventBuffer].slice(0, 1000)

        // 3. Incremental Snapshots (Every 50 events)
        const newEventCounter = eventCounter + 1
        let newSnapshots = get().snapshots
        if (newEventCounter % 50 === 0) {
          const snapshot: ProgressSnapshot = {
            userId: 'anonymous', // Default for now
            window: 'all',
            aggregates: {
              intonation: get().intonationSkill,
              rhythm: get().rhythmSkill,
              overall: get().overallSkill
            },
            lastSessionId: session.id
          }
          newSnapshots = [snapshot, ...newSnapshots].slice(0, 10) // Keep last 10 snapshots
        }

        // 4. Pruning Logic (Time-based > 90 days)
        const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000
        const prunedBuffer = newBuffer.filter(e => e.ts > ninetyDaysAgo)

        const existingStats = exerciseStats[session.exerciseId]
        const nextExerciseStats: ExerciseStats = {
          exerciseId: session.exerciseId,
          timesCompleted: (existingStats?.timesCompleted || 0) + 1,
          bestAccuracy: Math.max(existingStats?.bestAccuracy || 0, session.accuracy),
          averageAccuracy: existingStats
            ? (existingStats.averageAccuracy * existingStats.timesCompleted + session.accuracy) / (existingStats.timesCompleted + 1)
            : session.accuracy,
          fastestCompletionMs: existingStats
            ? Math.min(existingStats.fastestCompletionMs, session.durationMs)
            : session.durationMs,
          lastPracticedMs: session.endTimeMs
        }

        set((state: ProgressState) => ({
          totalPracticeSessions: state.totalPracticeSessions + 1,
          totalPracticeTime: state.totalPracticeTime + Math.floor(session.durationMs / 1000),
          exercisesCompleted: state.exercisesCompleted.includes(session.exerciseId)
            ? state.exercisesCompleted
            : [...state.exercisesCompleted, session.exerciseId],
          exerciseStats: {
            ...state.exerciseStats,
            [session.exerciseId]: nextExerciseStats
          },
          eventBuffer: prunedBuffer,
          snapshots: newSnapshots,
          eventCounter: newEventCounter
        }))
      },

      updateSkills: (sessions: PracticeSession[]) => {
        // Ported from original analytics-store.ts
        const intonationSkill = calculateIntonationSkill(sessions)
        const rhythmSkill = calculateRhythmSkill(sessions)

        set({
          intonationSkill,
          rhythmSkill,
          overallSkill: Math.round((intonationSkill + rhythmSkill) / 2)
        })
      }
    }),
    {
      name: 'violin-progress',
      version: 1,
      migrate: createMigrator({
        1: (state: any) => ({
          ...state,
          intonationSkill: state.intonationSkill || 0,
          rhythmSkill: state.rhythmSkill || 0,
          overallSkill: state.overallSkill || 0,
          exerciseStats: state.exerciseStats || {},
          schemaVersion: 1
        })
      })
    }
  )
)

/**
 * Heuristic for calculating intonation skill from session history.
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
 * Heuristic for calculating rhythm skill from session history.
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
