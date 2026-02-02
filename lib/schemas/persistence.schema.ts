import { z } from 'zod'

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

export const NoteResultSchema = z.object({
  noteIndex: z.number(),
  targetPitch: z.string(),
  attempts: z.number(),
  timeToCompleteMs: z.number().optional(),
  averageCents: z.number(),
  wasInTune: z.boolean(),
  technique: NoteTechniqueSchema.optional()
})

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

export const ExerciseStatsSchema = z.object({
  exerciseId: z.string(),
  timesCompleted: z.number(),
  bestAccuracy: z.number(),
  averageAccuracy: z.number(),
  fastestCompletionMs: z.number(),
  lastPracticedMs: z.number()
})

export const ProgressStateSchema = z.object({
  totalPracticeSessions: z.number(),
  totalPracticeTime: z.number(),
  exercisesCompleted: z.array(z.string()),
  currentStreak: z.number(),
  longestStreak: z.number(),
  intonationSkill: z.number(),
  rhythmSkill: z.number(),
  overallSkill: z.number(),
  exerciseStats: z.record(ExerciseStatsSchema)
})

export const AchievementSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  icon: z.string(),
  unlockedAtMs: z.number()
})

export const AchievementsStateSchema = z.object({
  unlocked: z.array(AchievementSchema),
  pending: z.array(AchievementSchema)
})

export const SessionHistoryStateSchema = z.object({
  sessions: z.array(PracticeSessionSchema)
})

export const PreferencesStateSchema = z.object({
  feedbackLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  showTechnicalDetails: z.boolean(),
  enableCelebrations: z.boolean(),
  enableHaptics: z.boolean(),
  soundFeedbackEnabled: z.boolean()
})
