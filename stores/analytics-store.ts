import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { analytics } from '@/lib/analytics-tracker'

export interface AnalyticsStore {
  sessions: any[]
  progress: {
    totalPracticeSessions: number
    totalPracticeTime: number
    exercisesCompleted: string[]
  }
  startSession: (params: { exerciseId: string; exerciseName: string; mode: string }) => void
  endSession: (accuracy: number, durationMs: number, exerciseId: string) => void
  getTodayStats: () => { duration: number; sessionsCount: number }
}

export const useAnalyticsStore = create<AnalyticsStore>()(
  persist(
    (set, get) => ({
      sessions: [],
      progress: { totalPracticeSessions: 0, totalPracticeTime: 0, exercisesCompleted: [] },
      startSession: (params) => {
        analytics.track('practice_session_started', params)
      },
      endSession: (accuracy, durationMs, exerciseId) => {
        const { progress, sessions } = get()
        const newSessions = [{ accuracy, durationMs, exerciseId, timestamp: Date.now() }, ...sessions].slice(0, 50)
        const exercisesCompleted = progress.exercisesCompleted.includes(exerciseId)
            ? progress.exercisesCompleted
            : [...progress.exercisesCompleted, exerciseId]

        set({
            sessions: newSessions,
            progress: {
                totalPracticeSessions: progress.totalPracticeSessions + 1,
                totalPracticeTime: progress.totalPracticeTime + Math.floor(durationMs / 1000),
                exercisesCompleted
            }
        })
        analytics.track('practice_session_completed', { exerciseId, accuracy, durationMs })
      },
      getTodayStats: () => {
        const today = new Date().setHours(0, 0, 0, 0)
        const todaySessions = get().sessions.filter(s => new Date(s.timestamp).setHours(0,0,0,0) === today)
        return {
            duration: todaySessions.reduce((sum, s) => sum + Math.floor(s.durationMs / 1000), 0),
            sessionsCount: todaySessions.length
        }
      },
    }),
    { name: 'violin-analytics-simplified' }
  )
)
