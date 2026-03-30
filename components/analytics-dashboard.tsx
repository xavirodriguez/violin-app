/**
 * AnalyticsDashboard
 */

'use client'

import { useAnalyticsStore } from '@/stores/analytics-store'
import { getLast7DaysData, getHeatmapData } from './analytics/utils'
import { MetricsSection } from './analytics/MetricsSection'
import { SkillSection } from './analytics/SkillSection'
import { PracticeTimeSection } from './analytics/PracticeTimeSection'
import { HeatmapSection } from './analytics/HeatmapSection'
import { AchievementsSection } from './analytics/AchievementsSection'

/**
 * Refactored for Senior Software Craftsmanship:
 * - Delegates specialized rendering to sub-components in `components/analytics/`.
 * - Uses utility functions from `components/analytics/utils.ts`.
 * - Intonation Heatmap is now a permanent feature (unconditional rendering).
 */
export function AnalyticsDashboard() {
  const { progress, getTodayStats, getStreakInfo, getSessionHistory } = useAnalyticsStore()
  const todayStats = getTodayStats()
  const streakInfo = getStreakInfo()
  const recentSessions = getSessionHistory(7)
  const lastSession = recentSessions[0]

  const practiceTimeData = getLast7DaysData(recentSessions)
  const heatmapData = getHeatmapData(lastSession)
  const totalCompleted = progress.exercisesCompleted?.length ?? 0

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="mb-6 text-2xl font-bold">📊 Your Progress</h1>

      <MetricsSection
        streak={streakInfo.current}
        todayDuration={todayStats.duration}
        totalSessions={progress.totalPracticeSessions}
        completedExercises={totalCompleted}
      />

      <SkillSection
        intonation={progress.intonationSkill}
        rhythm={progress.rhythmSkill}
        overall={overallProgress(progress)}
      />

      <PracticeTimeSection data={practiceTimeData} />

      <HeatmapSection data={heatmapData} />

      <AchievementsSection achievements={progress.achievements} />
    </div>
  )
}

function overallProgress(progress: any) {
  const value = progress.overallSkill
  const result = value

  return result
}
