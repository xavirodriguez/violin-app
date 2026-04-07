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

  startSession: (exerciseId: string, exerciseName: string, mode: 'tuner' | 'practice') => void
  endSession: () => void
  recordNoteAttempt: (noteIndex: number, targetPitch: string, cents: number, wasInTune: boolean) => void
  recordNoteCompletion: (noteIndex: number, timeToCompleteMs: number, technique?: NoteTechnique) => void
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

      startSession: (exerciseId, exerciseName, mode) => {
        const nowMs = Date.now()
        analytics.track('practice_session_started', { exerciseId, exerciseName, mode })
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
        if (currentSession === undefined) return

        const completedSession = finalizeSessionData(currentSession)
        const newSessions = [completedSession, ...sessions]
        const newProgress = getUpdatedProgress(progress, completedSession, sessions)

        handleSessionCompletion({ completedSession, sessions: newSessions, progress: newProgress })
        checkStorageThresholds()
      },

      recordNoteAttempt: (noteIndex, targetPitch, cents, wasInTune) => {
        const params = { noteIndex, targetPitch, cents, wasInTune }
        set((state) => handleAttemptRecording({ state, params }))
      },

      recordNoteCompletion: (noteIndex, timeToCompleteMs, technique) => {
        const state = get()
        if (state.currentSession === undefined) return

        const noteResult = state.currentSession.noteResults.find((nr) => nr.noteIndex === noteIndex)
        const wasPerfect = noteResult !== undefined && Math.abs(noteResult.averageCents) < 5
        const newPerfectStreak = wasPerfect ? state.currentPerfectStreak + 1 : 0

        handleStreakMilestones(newPerfectStreak)

        set((state) => {
          const prevSession = state.currentSession
          if (prevSession === undefined) return state
          const params = { noteIndex, timeToCompleteMs, technique }
          const nextNoteResults = updateCompletedNote(prevSession.noteResults, params)
          return {
            currentPerfectStreak: newPerfectStreak,
            currentSession: {
              ...prevSession,
              notesCompleted: prevSession.notesCompleted + 1,
              noteResults: nextNoteResults,
            },
          }
        })

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
        const cutoffMs = Date.now() - days * DAY_MS
        return get().sessions.filter((session) => session.endTimeMs >= cutoffMs)
      },

      getExerciseStats: (exerciseId) => {
        return get().progress.exerciseStats[exerciseId] || undefined
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

function finalizeSessionData(session: PracticeSession): PracticeSession {
  const endTimeMs = Date.now()
  const durationMs = endTimeMs - session.startTimeMs
  const finalized: PracticeSession = { ...session, endTimeMs, durationMs }

  return finalized
}

function getUpdatedProgress(
  progress: UserProgress,
  completedSession: PracticeSession,
  sessions: PracticeSession[],
): UserProgress {
  const nextExerciseStats = updateExerciseStats(
    progress.exerciseStats,
    completedSession.exerciseId,
    completedSession.accuracy,
    completedSession.durationMs,
    completedSession.endTimeMs,
  )

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

function updateExerciseStats(
  exerciseStats: Record<string, ExerciseStats>,
  exerciseId: string,
  accuracy: number,
  durationMs: number,
  endTimeMs: number,
): Record<string, ExerciseStats> {
  const existing = exerciseStats[exerciseId]
  const updated: ExerciseStats = {
    exerciseId,
    timesCompleted: (existing?.timesCompleted || 0) + 1,
    bestAccuracy: Math.max(existing?.bestAccuracy || 0, accuracy),
    averageAccuracy: existing
      ? (existing.averageAccuracy * existing.timesCompleted + accuracy) /
        (existing.timesCompleted + 1)
      : accuracy,
    fastestCompletionMs: existing ? Math.min(existing.fastestCompletionMs, durationMs) : durationMs,
    lastPracticedMs: endTimeMs,
  }
  return { ...exerciseStats, [exerciseId]: updated }
}

/**
 * Updates the user's practice streak based on session history.
 *
 * @param progress - The mutable progress object to update.
 * @param sessions - The PREVIOUS session history (before the current session was added).
 *
 * @remarks
 * Separates "first session ever" from "continuing yesterday's streak":
 * - First session ever (`sessions.length === 0`): sets streak to 1.
 * - Last session was yesterday: increments streak.
 * - Last session was today: no change (already counted).
 * - Last session was older than yesterday: resets streak to 1.
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
  const { noteResults, noteIndex, targetPitch, cents, wasInTune } = params
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

function accumulateRhythmMetrics(sessions: PracticeSession[]): RhythmMetrics {
  let totalError = 0
  let inWindowCount = 0
  let totalCount = 0

  for (const session of sessions) {
    const sessionMetrics = processSessionRhythm(session)
    totalError += sessionMetrics.error
    inWindowCount += sessionMetrics.inWindow
    totalCount += sessionMetrics.count
  }

  return { totalError, inWindowCount, totalCount }
}

function processSessionRhythm(session: PracticeSession) {
  const initial = { error: 0, inWindow: 0, count: 0 }
  const results = session.noteResults

  const finalMetrics = results.reduce((metrics, nr) => {
    return updateRhythmMetricsFromNote(metrics, nr)
  }, initial)

  return finalMetrics
}

function updateRhythmMetricsFromNote(metrics: any, nr: NoteResult) {
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
 *
 * @remarks
 * - Above 80%: warning toast suggesting data export.
 * - Above 95%: error toast suggesting cleanup of old sessions.
 */
function checkStorageCapacity(): void {
  try {
    const usage = estimateLocalStorageUsagePercent()
    notifyStorageThresholds(usage)
  } catch {
    // localStorage may not be available in some environments
  }
}

function notifyStorageThresholds(usage: number): void {
  const isCritical = usage >= 95
  const isHigh = usage >= 80

  if (isCritical) {
    showCriticalStorageError()
  } else if (isHigh) {
    showHighStorageWarning()
  }
}

function showCriticalStorageError() {
  const msg = 'Your practice history is almost full. Export data and clean sessions.'
  toast.error(msg, { duration: 10_000 })
}

function showHighStorageWarning() {
  const msg = 'Your practice history is almost full. Consider exporting your data.'
  toast.warning(msg, { duration: 8_000 })
}

function migratePersistence(persisted: unknown, version: number): AnalyticsStore {
  const persistedData = persisted as Record<string, unknown>
  const isOldVersion = version < 3
  if (isOldVersion) {
    migrateV1V2(persistedData)
  }

  const sessions = migrateSessions(persistedData.sessions)
  const progressData = (persistedData.progress as Record<string, unknown>) || {}
  const result = assembleMigratedData(persistedData, sessions, progressData)

  return result
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
  if (stats.fastestCompletion !== undefined && stats.fastestCompletionMs === undefined) {
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

function emitStorageFullToast(): void {
  toast.warning('Storage almost full!', {
    description: 'Please clean up your practice history to avoid data loss.',
    action: {
      label: 'Clean old sessions',
      onClick: () => useAnalyticsStore.getState().cleanOldSessions(50),
    },
  })
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

  const summary = calculateSessionSummary(nextNoteResults)
  const currentSession = {
    ...prevSession,
    notesAttempted: prevSession.notesAttempted + 1,
    noteResults: nextNoteResults,
    ...summary,
  }

  return { currentSession }
}
