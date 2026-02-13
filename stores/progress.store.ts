import { create } from 'zustand'
import { PracticeSession } from './session.store'
import { validatedPersist } from '@/lib/persistence/validated-persist'
import { createMigrator } from '@/lib/persistence/migrator'
import { ProgressStateSchema } from '@/lib/schemas/persistence.schema'

/**
 * Event representing a completed exercise within the progress history.
 *
 * @remarks
 * Used in the high-density circular buffer to track historical trends.
 *
 * @public
 */
export interface ProgressEvent {
  /** Unix timestamp of when the session ended. */
  ts: number
  /** ID of the exercise practiced. */
  exerciseId: string
  /** Accuracy achieved during the session (0-100). */
  accuracy: number
  /** Average rhythmic error in milliseconds for the session. */
  rhythmErrorMs: number
}

/**
 * Aggregated skill metrics across multiple technical domains.
 *
 * @public
 */
export interface SkillAggregates {
  /** Intonation accuracy score (0-100). Higher is better. */
  intonation: number
  /** Rhythmic precision score (0-100). Based on onset timing error. */
  rhythm: number
  /** Overall combined skill level based on pedagogical heuristics. */
  overall: number
}

/**
 * A snapshot of the user's progress at a specific point in time.
 *
 * @remarks
 * Snapshots provide a historical record of technical growth, allowing the UI
 * to render progress charts over different time windows (7d, 30d).
 *
 * @public
 */
export interface ProgressSnapshot {
  /** The user identifier (defaults to 'anonymous' in standalone mode). */
  userId: string
  /** The time window covered by this snapshot. */
  window: '7d' | '30d' | 'all'
  /** Aggregated skill levels captured at the time of snapshot creation. */
  aggregates: SkillAggregates
  /** ID of the practice session that triggered this snapshot. */
  lastSessionId: string
}

/**
 * Lifetime statistics for an individual exercise.
 *
 * @remarks
 * These metrics are used by the `ExerciseRecommender` to determine mastery
 * and suggest review cycles.
 *
 * @public
 */
export interface ExerciseStats {
  /** ID of the exercise. */
  exerciseId: string
  /** Total number of times this exercise was successfully completed. */
  timesCompleted: number
  /** Highest accuracy percentage ever recorded for this exercise. */
  bestAccuracy: number
  /** Rolling average of accuracy across all historical attempts. */
  averageAccuracy: number
  /** Fastest completion time ever recorded (ms). */
  fastestCompletionMs: number
  /** Unix timestamp of the most recent practice attempt. */
  lastPracticedMs: number
}

/**
 * State structure for the Progress Store.
 *
 * @remarks
 * This interface defines the shape of the user's persistent technical profile.
 *
 * @public
 */
export interface ProgressState {
  /** Version of the persistence schema for handling automated migrations. */
  schemaVersion: 1
  /** Lifetime count of all started practice sessions. */
  totalPracticeSessions: number
  /** Total lifetime practice time in seconds. */
  totalPracticeTime: number
  /** IDs of unique exercises that have been completed at least once. */
  exercisesCompleted: string[]
  /** Current daily practice streak (number of consecutive days). */
  currentStreak: number
  /** Highest daily streak recorded since account creation. */
  longestStreak: number
  /** Current calculated intonation skill level (0-100). */
  intonationSkill: number
  /** Current calculated rhythm skill level (0-100). */
  rhythmSkill: number
  /** Combined overall skill level (0-100). */
  overallSkill: number
  /** Map of exercise IDs to their detailed lifetime statistics. */
  exerciseStats: Record<string, ExerciseStats>
  /** Circular buffer of recent progress events (maximum 1000 items). */
  eventBuffer: ProgressEvent[]
  /** Historical snapshots used for long-term trend analysis and charting. */
  snapshots: ProgressSnapshot[]
  /** Internal counter of sessions processed since last snapshot. */
  eventCounter: number
}

/**
 * Actions available in the Progress Store for updating user performance.
 *
 * @public
 */
interface ProgressActions {
  /**
   * Integrates a completed session into the long-term progress history.
   *
   * @remarks
   * **Side Effects**:
   * 1. Updates lifetime session count and total practice time.
   * 2. Recalculates exercise-specific mastery stats.
   * 3. Pushes a new event to the circular `eventBuffer`.
   * 4. Automatically triggers a technical `snapshot` every 50 events.
   * 5. Prunes the event buffer to remove items older than 90 days.
   *
   * @param session - The completed session data to persist and analyze.
   */
  addSession: (session: PracticeSession) => void

  /**
   * Re-calculates domain-specific skill levels (intonation, rhythm).
   *
   * @remarks
   * Skill levels are calculated using weighted heuristics that prioritize recent
   * session performance over historical data.
   *
   * @param sessions - Recent session history to analyze.
   */
  updateSkills: (sessions: PracticeSession[]) => void
}

/**
 * Default initial state for new users.
 * @internal
 */
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
 * This store is the "Brain" of the user's progress. It is optimized for
 * durability and efficient historical analysis.
 *
 * **Architecture**:
 * - **Persistence**: Uses `validatedPersist` to ensure `localStorage` data remains
 *   valid according to the `ProgressStateSchema`.
 * - **Data Lifecycle**: Implements automatic pruning of old high-frequency data (90-day TTL)
 *   while preserving long-term aggregates in `snapshots`.
 * - **Skill Engine**: Encapsulates heuristics for determining violin mastery levels.
 *
 * @example
 * ```ts
 * const { overallSkill, addSession } = useProgressStore();
 * ```
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
 *
 * @remarks
 * Analyzes the last 10 sessions to determine a normalized accuracy score.
 * It also considers the trend (improvement or decline) over the last 5 sessions.
 *
 * @param sessions - Recent historical data.
 * @returns Skill score (0-100).
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
 * Heuristic for calculating rhythm skill from session history.
 *
 * @remarks
 * Combines Mean Absolute Error (MAE) and "In Window" percentage (timing errors `\<= 40ms`)
 * to determine rhythmic stability.
 *
 * **Weighting**:
 * - MAE Score (50%): Penalizes large timing deviations.
 * - Window Success (50%): Rewards consistency within a professional tolerance.
 *
 * @param sessions - Recent historical data.
 * @returns Skill score (0-100).
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
