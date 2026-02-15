import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'

extendZodWithOpenApi(z)

/**
 * Zod schema for validating the technical performance metrics of a single note.
 *
 * @remarks
 * Used for both real-time validation and persistent storage of technique analysis results.
 *
 * @public
 */
export const NoteTechniqueSchema = z.object({
  vibrato: z.object({
    present: z.boolean(),
    rateHz: z.number(),
    widthCents: z.number(),
    regularity: z.number()
  }),
  pitchStability: z.object({
    settlingStdCents: z.number(),
    globalStdCents: z.number(),
    driftCentsPerSec: z.number(),
    inTuneRatio: z.number()
  }),
  rhythm: z.object({
    onsetErrorMs: z.number().optional(),
    durationErrorMs: z.number().optional()
  })
})

/**
 * Zod schema for validating the summarized results of practicing a single note.
 *
 * @public
 */
export const NoteResultSchema = z.object({
  noteIndex: z.number(),
  targetPitch: z.string(),
  attempts: z.number(),
  timeToCompleteMs: z.number().optional(),
  averageCents: z.number(),
  wasInTune: z.boolean(),
  technique: NoteTechniqueSchema.optional()
})

/**
 * Zod schema for validating a complete practice session.
 *
 * @remarks
 * This schema ensures that session data is durable and can be safely rehydrated
 * from `localStorage`.
 *
 * @public
 */
export const PracticeSessionSchema = z.object({
  id: z.string(),
  startTimeMs: z.number(),
  endTimeMs: z.number(),
  durationMs: z.number(),
  exerciseId: z.string(),
  exerciseName: z.string(),
  mode: z.enum(['tuner', 'practice']),
  noteResults: z.array(NoteResultSchema),
  notesAttempted: z.number(),
  notesCompleted: z.number(),
  accuracy: z.number(),
  averageCents: z.number()
})

/**
 * Zod schema for validating lifetime statistics for an individual exercise.
 *
 * @public
 */
export const ExerciseStatsSchema = z.object({
  exerciseId: z.string(),
  timesCompleted: z.number(),
  bestAccuracy: z.number(),
  averageAccuracy: z.number(),
  fastestCompletionMs: z.number(),
  lastPracticedMs: z.number()
})

export const ProgressEventSchema = z.object({
  ts: z.number(),
  exerciseId: z.string(),
  accuracy: z.number(),
  rhythmErrorMs: z.number()
})

export const SkillAggregatesSchema = z.object({
  intonation: z.number(),
  rhythm: z.number(),
  overall: z.number()
})

export const ProgressSnapshotSchema = z.object({
  userId: z.string(),
  window: z.enum(['7d', '30d', 'all']),
  aggregates: SkillAggregatesSchema,
  lastSessionId: z.string()
})

/**
 * Zod schema for the entire persistent progress state.
 *
 * @remarks
 * Defines the canonical structure of the user's technical profile in storage.
 *
 * @public
 */
export const ProgressStateSchema = z.object({
  schemaVersion: z.literal(1).default(1),
  totalPracticeSessions: z.number(),
  totalPracticeTime: z.number(),
  exercisesCompleted: z.array(z.string()),
  currentStreak: z.number(),
  longestStreak: z.number(),
  intonationSkill: z.number(),
  rhythmSkill: z.number(),
  overallSkill: z.number(),
  exerciseStats: z.record(ExerciseStatsSchema),
  eventBuffer: z.array(ProgressEventSchema).default([]),
  snapshots: z.array(ProgressSnapshotSchema).default([]),
  eventCounter: z.number().default(0)
})

/**
 * Zod schema for a single user achievement milestone.
 *
 * @public
 */
export const AchievementSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  icon: z.string(),
  unlockedAtMs: z.number()
})

export const AchievementsStateSchema = z.object({
  schemaVersion: z.literal(1).default(1),
  unlocked: z.array(AchievementSchema),
  pending: z.array(AchievementSchema)
})

export const SessionHistoryStateSchema = z.object({
  sessions: z.array(PracticeSessionSchema)
})

/**
 * Zod schema for validating persistent user preferences.
 *
 * @public
 */
export const PreferencesStateSchema = z.object({
  schemaVersion: z.literal(1).default(1),
  feedbackLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  showTechnicalDetails: z.boolean(),
  enableCelebrations: z.boolean(),
  enableHaptics: z.boolean(),
  soundFeedbackEnabled: z.boolean()
})
