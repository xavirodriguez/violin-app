/**
 * AnalyticsDashboard
 */

'use client'

import { Download } from 'lucide-react'
import { useAnalyticsStore, type UserProgress } from '@/stores/analytics-store'
import { getLast7DaysData, getHeatmapData } from './analytics/utils'
import { MetricsSection } from './analytics/MetricsSection'
import { SkillSection } from './analytics/SkillSection'
import { PracticeTimeSection } from './analytics/PracticeTimeSection'
import { HeatmapSection } from './analytics/HeatmapSection'
import { AchievementsSection } from './analytics/AchievementsSection'
import { Button } from '@/components/ui/button'
import { exportSessionsToCSV, downloadCSV } from '@/lib/export/progress-exporter'

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

  const handleExportCSV = () => {
    const allSessions = getSessionHistory(365)
    const csv = exportSessionsToCSV(allSessions)
    downloadCSV(csv, `violin-progress-${new Date().toISOString().split('T')[0]}.csv`)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">📊 Your Progress</h1>
        <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

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

/**
 * Extracts the overall skill value from user progress.
 *
 * @param progress - The user's progress data.
 * @returns The overall skill percentage (0-100).
 */
function overallProgress(progress: UserProgress): number {
  const value = progress.overallSkill
  return value
}
