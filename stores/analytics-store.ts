import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { NoteTechnique } from '../lib/technique-types'
import type { Exercise } from '@/lib/domain/musical-types'
import { checkAchievements } from '@/lib/achievements/achievement-checker'
import type { AchievementCheckStats } from '@/lib/achievements/achievement-definitions'
import { analytics } from '@/lib/analytics-tracker'
import { estimateLocalStorageUsagePercent } from '@/lib/storage/storage-monitor'
import { toast } from 'sonner'

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
  cleanOldSessions: (count?: number) => void
  sessions: PracticeSession[]
  progress: UserProgress
  onAchievementUnlocked?: (achievement: Achievement) => void
  currentPerfectStreak: number

  startSession: (params: { exerciseId: string; exerciseName: string; mode: 'tuner' | 'practice' }) => void
  endSession: () => void
  recordNoteAttempt: (params: RecordAttemptParams) => void
  recordNoteCompletion: (params: RecordCompletionParams) => void
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

      startSession: (params) => {
        analytics.track('practice_session_started', params)
        const session = createInitialSession(params)
        set({ currentSession: session })
      },

      endSession: () => {
        const { currentSession, sessions, progress } = get()
        const isInactive = currentSession === undefined
        if (isInactive) return

        const completedSession = finalizeSessionData(currentSession!)
        const newSessions = [completedSession, ...sessions]
        const newProgress = getUpdatedProgress({ progress, completedSession, sessions })

        handleSessionCompletion({ completedSession, sessions: newSessions, progress: newProgress })
        checkStorageThresholds()
      },

      recordNoteAttempt: (params) => {
        set((state) => handleAttemptRecording({ state, params }))
      },

      recordNoteCompletion: (params) => {
        const state = get()
        if (state.currentSession === undefined) return
        const newStreak = calculateStreakUpdate(state, params.noteIndex)

        handleStreakMilestones(newStreak)
        set((s) => applyCompletionUpdates({ state: s, params, newStreak }))
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
        const now = Date.now()
        const cutoffMs = now - days * DAY_MS
        const allSessions = get().sessions
        const recentSessions = allSessions.filter((session) => session.endTimeMs >= cutoffMs)

        return recentSessions
      },

      getExerciseStats: (exerciseId) => {
        const { exerciseStats } = get().progress
        const targetStats = exerciseStats[exerciseId]
        const statsToReturn = targetStats || undefined

        return statsToReturn
      },

      getTodayStats: () => {
        const today = startOfDayMs(Date.now())
        const sessions = get().sessions.filter((s) => startOfDayMs(s.endTimeMs) === today)
        return calculateDailyMetrics(sessions)
      },

      getStreakInfo: () => {
        const { progress } = get()
        const current = progress.currentStreak
        const longest = progress.longestStreak
        const streakInfo = { current, longest }

        return streakInfo
      },

      cleanOldSessions: (count = 50) => {
        set((state) => ({
          sessions: state.sessions.slice(0, Math.max(0, state.sessions.length - count)),
        }))
        toast.success('History cleaned', {
          description: `Removed oldest ${count} sessions.`,
        })
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

function createInitialSession(params: {
  exerciseId: string
  exerciseName: string
  mode: 'tuner' | 'practice'
}): PracticeSession {
  const { exerciseId, exerciseName, mode } = params
  const nowMs = Date.now()
  return {
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
}

function calculateStreakUpdate(state: AnalyticsStore, noteIndex: number): number {
  const session = state.currentSession
  if (!session) return 0
  const noteResult = session.noteResults.find((nr) => nr.noteIndex === noteIndex)
  const wasPerfect = noteResult !== undefined && Math.abs(noteResult.averageCents) < 5
  return wasPerfect ? state.currentPerfectStreak + 1 : 0
}

function applyCompletionUpdates(params: {
  state: AnalyticsStore
  params: RecordCompletionParams
  newStreak: number
}): Partial<AnalyticsStore> {
  const { state, params: compParams, newStreak } = params
  const prevSession = state.currentSession
  if (prevSession === undefined) return state

  const nextNoteResults = updateCompletedNote(prevSession.noteResults, compParams)
  return {
    currentPerfectStreak: newStreak,
    currentSession: {
      ...prevSession,
      notesCompleted: prevSession.notesCompleted + 1,
      noteResults: nextNoteResults,
    },
  }
}

function calculateDailyMetrics(sessions: PracticeSession[]) {
  const durationSec = sessions.reduce((sum, s) => sum + Math.floor(s.durationMs / 1000), 0)
  const totalAcc = sessions.reduce((sum, s) => sum + s.accuracy, 0)
  const avgAccuracy = sessions.length > 0 ? totalAcc / sessions.length : 0

  return {
    duration: durationSec,
    accuracy: avgAccuracy,
    sessionsCount: sessions.length,
  }
}

function finalizeSessionData(session: PracticeSession): PracticeSession {
  const endTimeMs = Date.now()
  const durationMs = endTimeMs - session.startTimeMs
  const finalized: PracticeSession = { ...session, endTimeMs, durationMs }

  return finalized
}

function getUpdatedProgress(params: {
  progress: UserProgress
  completedSession: PracticeSession
  sessions: PracticeSession[]
}): UserProgress {
  const { progress, completedSession, sessions } = params
  const nextExerciseStats = updateExerciseStats({
    exerciseStats: progress.exerciseStats,
    exerciseId: completedSession.exerciseId,
    accuracy: completedSession.accuracy,
    durationMs: completedSession.durationMs,
    endTimeMs: completedSession.endTimeMs,
  })

  const newProgress = assembleUpdatedProgress({
    progress,
    completedSession,
    nextExerciseStats,
  })

  updateStreak(newProgress, sessions)
  calculateSkills(newProgress, [completedSession, ...sessions])

  return newProgress
}

function assembleUpdatedProgress(params: {
  progress: UserProgress
  completedSession: PracticeSession
  nextExerciseStats: Record<string, ExerciseStats>
}): UserProgress {
  const { progress, completedSession, nextExerciseStats } = params
  const isNewId = !progress.exercisesCompleted.includes(completedSession.exerciseId)
  const exercisesCompleted = isNewId
    ? [...progress.exercisesCompleted, completedSession.exerciseId]
    : progress.exercisesCompleted

  return {
    ...progress,
    totalPracticeSessions: progress.totalPracticeSessions + 1,
    totalPracticeTime: progress.totalPracticeTime + Math.floor(completedSession.durationMs / 1000),
    exerciseStats: nextExerciseStats,
    exercisesCompleted,
  }
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

  const stats = assembleAchievementStats({
    currentSession,
    currentPerfectStreak,
    sessions,
    progress,
  })

  return stats
}

function assembleAchievementStats(params: {
  currentSession: PracticeSession
  currentPerfectStreak: number
  sessions: PracticeSession[]
  progress: UserProgress
}): AchievementCheckStats {
  const { currentSession, currentPerfectStreak, sessions, progress } = params
  const currentDurationMs = Date.now() - currentSession.startTimeMs
  const totalNotesCompleted = calculateTotalNotesCompleted(sessions, currentSession)

  return {
    currentSession: {
      correctNotes: currentSession.notesCompleted,
      perfectNoteStreak: currentPerfectStreak,
      accuracy: currentSession.accuracy,
      durationMs: currentDurationMs,
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

function calculateTotalNotesCompleted(
  sessions: PracticeSession[],
  current: PracticeSession,
): number {
  const pastCompleted = sessions.reduce((sum, s) => sum + s.notesCompleted, 0)
  const total = pastCompleted + current.notesCompleted

  return total
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

interface UpdateStatsParams {
  exerciseStats: Record<string, ExerciseStats>
  exerciseId: string
  accuracy: number
  durationMs: number
  endTimeMs: number
}

function updateExerciseStats(params: UpdateStatsParams): Record<string, ExerciseStats> {
  const { exerciseStats, exerciseId, accuracy, durationMs, endTimeMs } = params
  const existing = exerciseStats[exerciseId]
  const updated: ExerciseStats = assembleUpdatedStats({
    existing,
    exerciseId,
    accuracy,
    durationMs,
    endTimeMs,
  })
  return { ...exerciseStats, [exerciseId]: updated }
}

function assembleUpdatedStats(params: {
  existing?: ExerciseStats
  exerciseId: string
  accuracy: number
  durationMs: number
  endTimeMs: number
}): ExerciseStats {
  const { existing, exerciseId, accuracy, durationMs, endTimeMs } = params
  const bestAccuracy = Math.max(existing?.bestAccuracy || 0, accuracy)
  const avgAccuracy = existing
    ? (existing.averageAccuracy * existing.timesCompleted + accuracy) /
      (existing.timesCompleted + 1)
    : accuracy

  return {
    exerciseId,
    timesCompleted: (existing?.timesCompleted || 0) + 1,
    bestAccuracy,
    averageAccuracy: avgAccuracy,
    fastestCompletionMs: existing ? Math.min(existing.fastestCompletionMs, durationMs) : durationMs,
    lastPracticedMs: endTimeMs,
  }
}

/**
 * Updates the user's practice streak based on session history.
 */
function updateStreak(progress: UserProgress, sessions: PracticeSession[]) {
  const lastSession = sessions[1]
  const lastDay = lastSession ? startOfDayMs(lastSession.endTimeMs) : 0
  const streakInfo = calculateStreakUpdates(lastDay)

  applyStreakUpdate(progress, streakInfo)
  updateLongestStreak(progress)
}

function applyStreakUpdate(progress: UserProgress, info: { shouldReset: boolean; shouldIncrement: boolean }) {
  if (info.shouldReset) {
    progress.currentStreak = 1
  } else if (info.shouldIncrement) {
    progress.currentStreak += 1
  }
}

function updateLongestStreak(progress: UserProgress) {
  const current = progress.currentStreak
  const longest = progress.longestStreak
  progress.longestStreak = Math.max(longest, current)
}

function calculateStreakUpdates(lastDay: number) {
  const today = startOfDayMs(Date.now())
  const yesterday = today - DAY_MS

  const shouldReset = lastDay === 0 || lastDay < yesterday
  const shouldIncrement = lastDay === yesterday

  return { shouldReset, shouldIncrement }
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
  const { noteResults, noteIndex } = params
  const existing = noteResults.find((nr) => nr.noteIndex === noteIndex)
  if (existing) {
    return applyAttemptToExisting(noteResults, params)
  }
  return [...noteResults, createInitialNoteResult(params)]
}

function applyAttemptToExisting(
  results: NoteResult[],
  params: RecordAttemptParams,
): NoteResult[] {
  const { noteIndex, targetPitch, cents, wasInTune } = params
  return results.map((nr) => {
    if (nr.noteIndex !== noteIndex) return nr
    const nextAttempts = nr.attempts + 1
    const nextAverageCents = (nr.averageCents * nr.attempts + cents) / nextAttempts
    const updated = {
      ...nr,
      targetPitch,
      attempts: nextAttempts,
      averageCents: nextAverageCents,
      wasInTune,
    }
    return updated
  })
}

function createInitialNoteResult(params: RecordAttemptParams): NoteResult {
  const { noteIndex, targetPitch, cents, wasInTune } = params
  return {
    noteIndex,
    targetPitch,
    attempts: 1,
    timeToCompleteMs: 0,
    averageCents: cents,
    wasInTune,
  }
}

function calculateRhythmSkill(sessions: PracticeSession[]): number {
  if (sessions.length === 0) return 0
  const recentSessions = sessions.slice(0, 10)
  const metrics = accumulateRhythmMetrics(recentSessions)

  if (metrics.totalCount === 0) return 0
  const score = calculateRhythmScore(metrics)

  return Math.round(score)
}

interface RhythmMetrics {
  totalError: number
  inWindowCount: number
  totalCount: number
}

interface InternalRhythmAccumulator {
  error: number
  inWindow: number
  count: number
}

function accumulateRhythmMetrics(sessions: PracticeSession[]): RhythmMetrics {
  let metrics: RhythmMetrics = { totalError: 0, inWindowCount: 0, totalCount: 0 }

  for (const session of sessions) {
    metrics = processSessionRhythm(session, metrics)
  }

  return metrics
}

function processSessionRhythm(session: PracticeSession, current: RhythmMetrics): RhythmMetrics {
  let metrics = { ...current }

  for (const nr of session.noteResults) {
    const onsetError = nr.technique?.rhythm.onsetErrorMs
    if (onsetError !== undefined) {
      metrics = applyNoteRhythm(onsetError, metrics)
    }
  }

  return metrics
}

function applyNoteRhythm(onsetError: number, metrics: RhythmMetrics): RhythmMetrics {
  const error = Math.abs(onsetError)
  const inWindow = error <= 40 ? 1 : 0

  return {
    totalError: metrics.totalError + error,
    inWindowCount: metrics.inWindowCount + inWindow,
    totalCount: metrics.totalCount + 1,
  }
}

function processSessionRhythm(session: PracticeSession): InternalRhythmAccumulator {
  const initial: InternalRhythmAccumulator = { error: 0, inWindow: 0, count: 0 }
  const results = session.noteResults

  const finalMetrics = results.reduce((metrics, nr) => {
    return updateRhythmMetricsFromNote(metrics, nr)
  }, initial)

  return finalMetrics
}

function updateRhythmMetricsFromNote(
  metrics: InternalRhythmAccumulator,
  nr: NoteResult,
): InternalRhythmAccumulator {
  const onsetError = nr.technique?.rhythm.onsetErrorMs
  if (onsetError === undefined) return metrics

  const absError = Math.abs(onsetError)
  const isInside = absError <= 40

  return {
    error: metrics.error + absError,
    inWindow: metrics.inWindow + (isInside ? 1 : 0),
    count: metrics.count + 1,
  }
}

function calculateRhythmScore(metrics: RhythmMetrics): number {
  const { totalError, inWindowCount, totalCount } = metrics
  const mae = totalError / totalCount
  const percentInWindow = (inWindowCount / totalCount) * 100
  const maeScore = Math.max(0, 100 - mae / 4)

  const finalScore = (maeScore + percentInWindow) / 2
  return finalScore
}

/**
 * Checks localStorage usage and warns the user via toast if capacity is high.
 */


function migratePersistence(persisted: unknown, version: number): AnalyticsStore {
  const persistedData = persisted as Record<string, unknown>
  const isOldVersion = version < 3
  if (isOldVersion) {
    migrateV1V2(persistedData)
  }

  const migratedSessions = migrateSessions(persistedData.sessions)
  const progressData = (persistedData.progress as Record<string, unknown>) || {}
  const migratedStore = assembleMigratedData(persistedData, migratedSessions, progressData)

  return migratedStore
}

function assembleMigratedData(
  persistedData: Record<string, unknown>,
  sessions: PracticeSession[],
  progressData: Record<string, unknown>,
): AnalyticsStore {
  const achievements = migrateAchievements(progressData.achievements)
  const exerciseStats = migrateExerciseStats(progressData.exerciseStats)

  return {
    ...persistedData,
    sessions,
    progress: { ...progressData, achievements, exerciseStats },
  } as AnalyticsStore
}

function migrateSessions(sessions: unknown): PracticeSession[] {
  if (!Array.isArray(sessions)) return []

  return sessions.map((s: unknown) => {
    const session = s as Record<string, unknown>
    const { startTime, endTime, ...rest } = session || {}
    return {
      ...rest,
      startTimeMs: toMs(session?.startTimeMs ?? startTime),
      endTimeMs: toMs(session?.endTimeMs ?? endTime),
    } as unknown as PracticeSession
  })
}

function migrateAchievements(achievements: unknown): Achievement[] {
  if (!Array.isArray(achievements)) return []

  return achievements.map((a: unknown) => {
    const achievement = a as Record<string, unknown>
    const { unlockedAt, ...rest } = achievement || {}
    return {
      ...rest,
      unlockedAtMs: toMs(achievement?.unlockedAtMs ?? unlockedAt),
    } as unknown as Achievement
  })
}

function migrateExerciseStats(stats: unknown): Record<string, ExerciseStats> {
  const rawStats = (stats as Record<string, Record<string, unknown>>) || {}
  const entries = Object.entries(rawStats).map(([k, v]) => {
    const s = v as Record<string, unknown>
    const { lastPracticed, ...rest } = s || {}
    const lastPracticedMs = toMs(s?.lastPracticedMs ?? lastPracticed)
    return [k, { ...rest, lastPracticedMs }]
  })

  return Object.fromEntries(entries) as Record<string, ExerciseStats>
}

function migrateV1V2(data: Record<string, unknown>): void {
  if (Array.isArray(data.sessions)) {
    data.sessions = data.sessions.map(migrateSessionV1V2)
  }
  const progress = data.progress as Record<string, unknown> | undefined
  if (progress?.exerciseStats) {
    const stats = progress.exerciseStats as Record<string, Record<string, unknown>>
    Object.values(stats).forEach(migrateExerciseStatsV1V2)
  }
}

function migrateSessionV1V2(s: unknown): Record<string, unknown> {
  const session = s as Record<string, unknown>
  const { duration, ...rest } = session || {}
  const durationMs = ((session.durationMs as number) ?? (duration as number) ?? 0) * 1000
  const noteResults = Array.isArray(session.noteResults)
    ? session.noteResults.map(migrateNoteResultV1V2)
    : []

  return { ...rest, durationMs, noteResults }
}

function migrateNoteResultV1V2(nr: unknown): Record<string, unknown> {
  const noteResult = nr as Record<string, unknown>
  const { timeToComplete, ...nrRest } = noteResult || {}
  const ms = (noteResult.timeToCompleteMs as number) ?? (timeToComplete as number) ?? 0

  return { ...nrRest, timeToCompleteMs: ms }
}

function migrateExerciseStatsV1V2(stats: Record<string, unknown>): void {
  const hasFastest = stats.fastestCompletion !== undefined
  const needsMigration = stats.fastestCompletionMs === undefined
  if (hasFastest && needsMigration) {
    stats.fastestCompletionMs = (stats.fastestCompletion as number) * 1000
    delete stats.fastestCompletion
  }
}

function handleSessionCompletion(params: {
  completedSession: PracticeSession
  sessions: PracticeSession[]
  progress: UserProgress
}): void {
  const { completedSession, sessions, progress } = params
  trackCompletionAnalytics(completedSession)

  useAnalyticsStore.setState({
    currentSession: undefined,
    sessions: sessions.slice(0, 100),
    progress,
  })
}

function checkStorageThresholds(): void {
  const usage = estimateLocalStorageUsagePercent()
  if (usage > 95) {
    emitStorageFullToast()
  } else if (usage > 80) {
    toast('Storage usage high', { description: 'Consider exporting your data soon.' })
  }
}

function handleAttemptRecording(params: {
  state: AnalyticsStore
  params: RecordAttemptParams
}): Partial<AnalyticsStore> {
  const { state, params: attemptParams } = params
  const prevSession = state.currentSession
  if (prevSession === undefined) return state

  const nextNoteResults = updateNoteResults({
    noteResults: prevSession.noteResults,
    ...attemptParams,
  })

  const currentSession = assembleUpdatedSession({ prevSession, nextNoteResults })
  return { currentSession }
}

function assembleUpdatedSession(params: {
  prevSession: PracticeSession
  nextNoteResults: NoteResult[]
}): PracticeSession {
  const { prevSession, nextNoteResults } = params
  const summary = calculateSessionSummary(nextNoteResults)
  return {
    ...prevSession,
    notesAttempted: prevSession.notesAttempted + 1,
    noteResults: nextNoteResults,
    ...summary,
  }
}

function createNewPracticeSession(params: {
  exerciseId: string
  exerciseName: string
  mode: 'tuner' | 'practice'
  nowMs: number
}): PracticeSession {
  const { exerciseId, exerciseName, mode, nowMs } = params
  return {
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
}

function calculateNewPerfectStreak(state: AnalyticsStore, noteIndex: number): number {
  const session = state.currentSession!
  const noteResult = session.noteResults.find((nr) => nr.noteIndex === noteIndex)
  const isPerfect = noteResult !== undefined && Math.abs(noteResult.averageCents) < 5
  const newStreak = isPerfect ? state.currentPerfectStreak + 1 : 0

  return newStreak
}

function applyNoteCompletionUpdate(
  prevState: AnalyticsStore,
  params: {
    noteIndex: number
    timeToCompleteMs: number
    technique?: NoteTechnique
    newPerfectStreak: number
  },
): Partial<AnalyticsStore> {
  const prevSession = prevState.currentSession
  if (prevSession === undefined) return prevState

  const nextNoteResults = updateCompletedNote(prevSession.noteResults, params)
  const currentSession = {
    ...prevSession,
    notesCompleted: prevSession.notesCompleted + 1,
    noteResults: nextNoteResults,
  }

  return {
    currentPerfectStreak: params.newPerfectStreak,
    currentSession,
  }
}

function calculateAggregatedTodayStats(todaySessions: PracticeSession[]) {
  const count = todaySessions.length
  const durationSec = todaySessions.reduce(
    (sum, s) => sum + Math.floor(s.durationMs / 1000),
    0,
  )
  const totalAccuracy = todaySessions.reduce((sum, s) => sum + s.accuracy, 0)
  const accuracy = count > 0 ? totalAccuracy / count : 0

  return {
    duration: durationSec,
    accuracy,
    sessionsCount: count,
  }
}
