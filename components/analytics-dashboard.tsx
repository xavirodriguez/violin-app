/**
 * AnalyticsDashboard
 */

'use client'

import { useAnalyticsStore, type ExerciseStats } from '@/stores/analytics-store'
import { useFeatureFlag } from '@/lib/feature-flags'
import { getLast7DaysData, getHeatmapData } from './analytics/utils'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { exportSessionsToCSV, downloadCSV } from '@/lib/export/progress-exporter'
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
  const isHeatmapEnabled = useFeatureFlag('FEATURE_UI_INTONATION_HEATMAPS')

  const todayStats = getTodayStats()
  const streakInfo = getStreakInfo()
  const recentSessions = getSessionHistory(7)
  const lastSession = recentSessions[0]

  const practiceTimeData = getLast7DaysData(recentSessions)
  const heatmapData = getHeatmapData(lastSession)
  const totalCompleted = progress.exercisesCompleted?.length ?? 0

  const handleExport = () => {
    const allSessions = getSessionHistory(365)
    const csv = exportSessionsToCSV(allSessions)
    const filename = `violin-progress-${new Date().toISOString().split('T')[0]}.csv`
    downloadCSV(csv, filename)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">📊 Your Progress</h1>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" /> Export CSV
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

      {isHeatmapEnabled && (
        <IntonationHeatmap exerciseStats={progress.exerciseStats} />
      )}

      <AchievementsSection achievements={progress.achievements} />
    </div>
  )
}

function overallProgress(progress: UserProgress) {
  const value = progress.overallSkill
  return value
}

function IntonationHeatmap({ exerciseStats }: { exerciseStats: Record<string, ExerciseStats> }) {
  const statsEntries = Object.entries(exerciseStats)
  const hasStats = statsEntries.length > 0

  if (!hasStats) {
    return (
      <div className="bg-card border-border mb-6 rounded-lg border p-12 text-center">
        <p className="text-muted-foreground">Practice more exercises to see your heatmap</p>
      </div>
    )
  }

  return (
    <div className="bg-card border-border mb-6 rounded-lg border p-6">
      <h2 className="mb-4 text-xl font-bold">Exercise Accuracy Heatmap</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {statsEntries.map(([id, stats]) => {
          const accuracy = stats.averageAccuracy
          const bgColor =
            accuracy >= 80
              ? 'bg-green-600 text-white'
              : accuracy >= 50
                ? 'bg-yellow-600 text-black'
                : 'bg-destructive text-destructive-foreground'

          return (
            <div
              key={id}
              className={`${bgColor} group relative flex flex-col items-center justify-center rounded-md p-4 transition-transform hover:scale-105`}
              title={`${id}: Best ${stats.bestAccuracy.toFixed(1)}%, Avg ${stats.averageAccuracy.toFixed(1)}%, ${stats.timesCompleted} completions, Fast ${ (stats.fastestCompletionMs / 1000).toFixed(1) }s`}
            >
              <span className="text-xs font-bold uppercase tracking-tight opacity-80">{id}</span>
              <span className="text-lg font-black">{Math.round(accuracy)}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
