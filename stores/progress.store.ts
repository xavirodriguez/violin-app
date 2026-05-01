import { create } from 'zustand'
import { z } from 'zod'
import { PracticeSession, ExerciseStats } from '@/lib/domain/practice'
import { validatedPersist } from '@/stores/persistence/validated-persist-middleware'
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
 * @remarks
 * Encapsulates the logic for aggregating raw session results into long-term
 * technical metrics, ensuring that the student's progress is accurately
 * reflected in their persistent profile.
 *
 * @public
 */
interface ProgressActions {
  /**
   * Integrates a completed session into the long-term progress history.
   *
   * @remarks
   * **Side Effects & Logic**:
   * 1. **Aggregation**: Updates lifetime session count and total practice time in seconds.
   * 2. **Mastery Stats**: Recalculates `ExerciseStats` for the given ID, including
   *    `bestAccuracy` and `fastestCompletionMs`.
   * 3. **Circular Buffer**: Pushes a new {@link ProgressEvent} to the `eventBuffer`.
   *    The buffer is capped at 1000 items to balance historical depth with memory usage.
   * 4. **Incremental Snapshots**: Automatically triggers a {@link ProgressSnapshot}
   *    every 50 events. This ensures long-term trends are preserved even if the
   *    buffer is pruned.
   * 5. **TTL Pruning**: Removes any events from the buffer that are older than
   *    90 days to comply with data retention best practices.
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
  eventCounter: 0,
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
  validatedPersist<ProgressState & ProgressActions>(
    ProgressStateSchema as z.ZodType<ProgressState>,
    (set, get) => ({
      ...DEFAULT_PROGRESS,

      addSession: (session: PracticeSession) => {
        const updates = assembleSessionUpdates({ session, get })
        set((state: ProgressState) => ({ ...state, ...updates }))
      },

      updateSkills: (sessions: PracticeSession[]) => {
        const intonationSkill = calculateIntonationSkill(sessions)
        const rhythmSkill = calculateRhythmSkill(sessions)

        set({
          intonationSkill,
          rhythmSkill,
          overallSkill: Math.round((intonationSkill + rhythmSkill) / 2),
        })
      },
    }),
    {
      name: 'violin-progress',
      version: 1,
      migrate: createMigrator<ProgressState>({
        1: (state) => ({
          ...state,
          intonationSkill: state.intonationSkill || 0,
          rhythmSkill: state.rhythmSkill || 0,
          overallSkill: state.overallSkill || 0,
          exerciseStats: state.exerciseStats || {},
          schemaVersion: 1 as const,
        }),
      }),
    },
  ),
)

/**
 * Heuristic for calculating intonation skill from session history.
 *
 * @remarks
 * Analyzes the last 10 sessions to determine a normalized accuracy score.
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
 * Heuristic for calculating rhythm skill level.
 *
 * @remarks
 * **Scoring Criteria**:
 * - **Mean Absolute Error (MAE)**: Measures the average distance from perfect
 *   rhythmic onset. A MAE of 0ms yields a score of 100, while 400ms yields 0.
 * - **Professional Window**: Calculates the percentage of notes played with
 *   less than 40ms of error (the standard for "in-time" performance in orchestral settings).
 * - **Final Score**: An equal weight average of the MAE score and the window percentage.
 *
 * @param sessions - The last 10 practice sessions.
 * @returns Skill score (0-100).
 * @internal
 */
function calculateRhythmSkill(sessions: PracticeSession[]): number {
  const recentSessions = sessions.slice(0, 10)
  const hasSessions = recentSessions.length > 0
  if (!hasSessions) return 0

  const metrics = accumulateRhythmMetrics(recentSessions)
  const result = calculateRhythmScore(metrics)

  return result
}

interface RhythmMetricsAccumulator {
  totalError: number
  inWindowCount: number
  totalCount: number
}

function accumulateRhythmMetrics(sessions: PracticeSession[]): RhythmMetricsAccumulator {
  let metrics: RhythmMetricsAccumulator = { totalError: 0, inWindowCount: 0, totalCount: 0 }

  for (const session of sessions) {
    metrics = processSessionRhythm(session, metrics)
  }

  return metrics
}

function processSessionRhythm(
  session: PracticeSession,
  acc: RhythmMetricsAccumulator,
): RhythmMetricsAccumulator {
  const result = { ...acc }
  for (const nr of session.noteResults) {
    const errorMs = nr.technique?.rhythm?.onsetErrorMs
    if (errorMs !== undefined) {
      const { totalError, inWindowCount, totalCount } = updateRhythmFromNote(errorMs, result)
      result.totalError = totalError
      result.inWindowCount = inWindowCount
      result.totalCount = totalCount
    }
  }
  return result
}

function updateRhythmFromNote(
  errorMs: number,
  current: RhythmMetricsAccumulator,
): RhythmMetricsAccumulator {
  const error = Math.abs(errorMs)
  const nextError = current.totalError + error
  const nextCount = current.totalCount + 1
  const isPerfect = error <= 40
  const nextInWindow = isPerfect ? current.inWindowCount + 1 : current.inWindowCount

  return {
    totalError: nextError,
    inWindowCount: nextInWindow,
    totalCount: nextCount,
  }
}

function calculateRhythmScore(metrics: RhythmMetricsAccumulator): number {
  const { totalError, inWindowCount, totalCount } = metrics
  if (totalCount === 0) return 0

  const mae = totalError / totalCount
  const percentInWindow = (inWindowCount / totalCount) * 100
  const maeScore = Math.max(0, 100 - mae / 4)
  const score = (maeScore + percentInWindow) / 2

  return Math.round(score)
}

function calculateSessionRhythmError(session: PracticeSession): number {
  const totalError = session.noteResults.reduce((acc, nr) => {
    return acc + (nr.technique?.rhythm?.onsetErrorMs ?? 0)
  }, 0)
  const count = session.noteResults.length || 1
  const avgError = totalError / count

  return avgError
}

function assembleProgressEvent(session: PracticeSession): ProgressEvent {
  const avgRhythmError = calculateSessionRhythmError(session)
  const event: ProgressEvent = {
    ts: session.endTimeMs,
    exerciseId: session.exerciseId,
    accuracy: session.accuracy,
    rhythmErrorMs: avgRhythmError,
  }

  return event
}

function manageEventBuffer(params: {
  event: ProgressEvent
  currentBuffer: ProgressEvent[]
}): ProgressEvent[] {
  const { event, currentBuffer } = params
  const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000
  const combined = [event, ...currentBuffer].slice(0, 1000)
  const pruned = combined.filter((e) => e.ts > ninetyDaysAgo)

  return pruned
}

function updateExerciseStatsMap(params: {
  exerciseId: string
  session: PracticeSession
  statsMap: Record<string, ExerciseStats>
}): Record<string, ExerciseStats> {
  const { exerciseId, session, statsMap } = params
  const existing = statsMap[exerciseId]
  const nextStats = computeNextExerciseStats(existing, session)

  return {
    ...statsMap,
    [exerciseId]: nextStats,
  }
}

function computeNextExerciseStats(
  existing: ExerciseStats | undefined,
  session: PracticeSession,
): ExerciseStats {
  const timesCompleted = (existing?.timesCompleted || 0) + 1
  const bestAccuracy = Math.max(existing?.bestAccuracy || 0, session.accuracy)
  const averageAccuracy = calculateNewAverageAccuracy(existing, session, timesCompleted)
  const fastestCompletionMs = calculateNewFastestCompletion(existing, session)

  return {
    exerciseId: session.exerciseId,
    timesCompleted,
    bestAccuracy,
    averageAccuracy,
    fastestCompletionMs,
    lastPracticedMs: session.endTimeMs,
  }
}

function calculateNewAverageAccuracy(
  existing: ExerciseStats | undefined,
  session: PracticeSession,
  nextCount: number,
): number {
  if (!existing) {
    return session.accuracy
  }
  const total = existing.averageAccuracy * existing.timesCompleted + session.accuracy
  const average = total / nextCount
  return average
}

function calculateNewFastestCompletion(
  existing: ExerciseStats | undefined,
  session: PracticeSession,
): number {
  const currentFastest = existing?.fastestCompletionMs ?? session.durationMs
  const sessionDuration = session.durationMs
  const result = Math.min(currentFastest, sessionDuration)

  return result
}

function generateSnapshotIfDue(params: {
  counter: number
  session: PracticeSession
  get: () => ProgressState
}): ProgressSnapshot[] {
  const { counter, session, get } = params
  const snapshots = get().snapshots
  const isDue = counter % 50 === 0

  if (!isDue) {
    return snapshots
  }

  const snapshot: ProgressSnapshot = assembleSnapshot(session, get)
  return [snapshot, ...snapshots].slice(0, 10)
}

function assembleSnapshot(session: PracticeSession, get: () => ProgressState): ProgressSnapshot {
  const snapshot: ProgressSnapshot = {
    userId: 'anonymous',
    window: 'all',
    aggregates: {
      intonation: get().intonationSkill,
      rhythm: get().rhythmSkill,
      overall: get().overallSkill,
    },
    lastSessionId: session.id,
  }
  return snapshot
}

function assembleSessionUpdates(params: {
  session: PracticeSession
  get: () => ProgressState
}): Partial<ProgressState> {
  const { session, get } = params
  const { exerciseStats, eventBuffer, eventCounter, exercisesCompleted } = get()
  const event = assembleProgressEvent(session)
  const nextCounter = eventCounter + 1
  const nextBuffer = manageEventBuffer({ event, currentBuffer: eventBuffer })
  const nextSnapshots = generateSnapshotIfDue({ counter: nextCounter, session, get })
  const nextStatsMap = updateExerciseStatsMap({
    exerciseId: session.exerciseId,
    session,
    statsMap: exerciseStats,
  })

  return assembleStateUpdates({
    session,
    get,
    exercisesCompleted,
    nextStatsMap,
    nextBuffer,
    nextSnapshots,
    nextCounter,
  })
}

function assembleStateUpdates(params: {
  session: PracticeSession
  get: () => ProgressState
  exercisesCompleted: string[]
  nextStatsMap: Record<string, ExerciseStats>
  nextBuffer: ProgressEvent[]
  nextSnapshots: ProgressSnapshot[]
  nextCounter: number
}): Partial<ProgressState> {
  const { session, get, exercisesCompleted, nextStatsMap, nextBuffer, nextSnapshots, nextCounter } =
    params
  const nextExercises = exercisesCompleted.includes(session.exerciseId)
    ? exercisesCompleted
    : [...exercisesCompleted, session.exerciseId]
  const practiceTimeAdd = Math.floor(session.durationMs / 1000)

  return {
    totalPracticeSessions: get().totalPracticeSessions + 1,
    totalPracticeTime: get().totalPracticeTime + practiceTimeAdd,
    exercisesCompleted: nextExercises,
    exerciseStats: nextStatsMap,
    eventBuffer: nextBuffer,
    snapshots: nextSnapshots,
    eventCounter: nextCounter,
  }
}
