import { create } from 'zustand'
import superjson from 'superjson'
import { PracticeSession } from './session.store'
import { validatedPersist } from '@/lib/persistence/validated-persist'
import { createMigrator } from '@/lib/persistence/migrator'
import { ProgressStateSchema } from '@/lib/schemas/persistence.schema'
import { NoteTechnique } from '../lib/technique-types'

export interface ProgressEvent {
  ts: number
  exerciseId: string
  accuracy: number
  rhythmErrorMs: number
}

export interface SkillAggregates {
  intonation: number
  rhythm: number
  overall: number
}

export interface ProgressSnapshot {
  userId: string
  window: '7d' | '30d' | 'all'
  aggregates: SkillAggregates
  lastSessionId: string
}

export interface ExerciseStats {
  exerciseId: string
  timesCompleted: number
  bestAccuracy: number
  averageAccuracy: number
  fastestCompletionMs: number
  lastPracticedMs: number
}

export interface ProgressState {
  schemaVersion: 1
  totalPracticeSessions: number
  totalPracticeTime: number // in seconds
  exercisesCompleted: string[]
  currentStreak: number
  longestStreak: number
  intonationSkill: number
  rhythmSkill: number
  overallSkill: number
  exerciseStats: Record<string, ExerciseStats>
  eventBuffer: ProgressEvent[]
  snapshots: ProgressSnapshot[]
  eventCounter: number
}

interface ProgressActions {
  addSession: (session: PracticeSession) => void
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
