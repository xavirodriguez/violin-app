import { UserProgress } from '@/stores/analytics-store'
import { ObjectiveMastery } from '@/stores/mastery-store'
import { PersistedPracticeSession } from '@/lib/domain/practice'

export interface StudentReport {
  studentName: string
  generationDate: number
  summary: {
    totalPracticeMinutes: number
    sessionsCount: number
    averageAccuracy: number
    activeStreak: number
  }
  skillsOverview: {
    label: string
    mastery: number
    status: 'Mastered' | 'Developing' | 'Needs Review'
  }[]
  recentActivity: {
    date: number
    exerciseName: string
    accuracy: number
    durationMs: number
  }[]
  teacherNotes: string
}

/**
 * ReportingService
 *
 * Aggregates data for external pedagogical review (Parents/Teachers).
 */
export class ReportingService {
  static generateReport(
    progress: UserProgress,
    mastery: Record<string, ObjectiveMastery>,
    sessions: PersistedPracticeSession[]
  ): StudentReport {
    const skillsOverview = Object.entries(mastery).map(([id, data]) => {
      let status: 'Mastered' | 'Developing' | 'Needs Review' = 'Developing'
      if (data.mastery >= 0.9) status = 'Mastered'
      else if (data.trend === 'down') status = 'Needs Review'

      return {
        label: id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        mastery: data.mastery,
        status
      }
    })

    const recentActivity = sessions.slice(0, 5).map(s => ({
      date: s.endTimeMs,
      exerciseName: s.exerciseName,
      accuracy: s.accuracy,
      durationMs: s.durationMs
    }))

    return {
      studentName: 'Violin Student', // Placeholder for future profile system
      generationDate: Date.now(),
      summary: {
        totalPracticeMinutes: Math.round(progress.totalPracticeTime / 60),
        sessionsCount: progress.totalPracticeSessions,
        averageAccuracy: progress.overallSkill,
        activeStreak: progress.currentStreak
      },
      skillsOverview,
      recentActivity,
      teacherNotes: progress.overallSkill > 75
        ? "Excellent progress! Focus on maintaining high standards of intonation as exercises get more complex."
        : "Good consistent effort. Remember to take your time and listen carefully to the reference before playing."
    }
  }
}
