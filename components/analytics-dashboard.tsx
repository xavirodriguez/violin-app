/**
 * AnalyticsDashboard
 */

'use client'

import { useAnalyticsStore, type UserProgress } from '@/stores/analytics-store'
import { getLast7DaysData, getHeatmapData } from './analytics/utils'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { exportSessionsToCSV, downloadCSV } from '@/lib/export/progress-exporter'
import { MetricsSection } from './analytics/MetricsSection'
import { SkillSection } from './analytics/SkillSection'
import { PracticeTimeSection } from './analytics/PracticeTimeSection'
import { HeatmapSection } from './analytics/HeatmapSection'
import { AchievementsSection } from './analytics/AchievementsSection'
import { IntonationHeatmap } from './analytics/IntonationHeatmap'
import { CurriculumMap } from './curriculum/curriculum-map'
import { SkillsDashboard } from './analytics/SkillsDashboard'
import { CoachAISection } from './analytics/CoachAISection'
import { ProgressReportsSection } from './analytics/ProgressReportsSection'
import { NorthStarMetrics } from './analytics/NorthStarMetrics'

/**
 * Lean orchestration component for the analytics dashboard.
 * Refactored for Senior Software Craftsmanship compliance.
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
      <DashboardHeader onExport={() => handleExport()} />
      <MetricsSection
        streak={streakInfo.current}
        todayDuration={todayStats.duration}
        totalSessions={progress.totalPracticeSessions}
        completedExercises={totalCompleted}
      />
      <SkillSection
        intonation={progress.intonationSkill}
        rhythm={progress.rhythmSkill}
        overall={calculateOverallProgress(progress)}
      />
      <PracticeTimeSection data={practiceTimeData} />
      <HeatmapSection data={heatmapData} />

      <NorthStarMetrics />

      <IntonationHeatmap exerciseStats={progress.exerciseStats} />

      <SkillsDashboard />

      <CoachAISection />

      <ProgressReportsSection />

      <CurriculumMap />

      <AchievementsSection achievements={progress.achievements} />
    </div>
  )
}

function DashboardHeader({ onExport }: { onExport: () => void }) {
  const title = '📊 Your Progress'
  const buttonText = 'Export CSV'

  return (
    <div className="mb-6 flex items-center justify-between">
      <h1 className="text-2xl font-bold">{title}</h1>
      <Button variant="outline" size="sm" onClick={onExport}>
        <Download className="mr-2 h-4 w-4" /> {buttonText}
      </Button>
    </div>
  )
}

function handleExport() {
  const store = useAnalyticsStore.getState()
  const allSessions = store.getSessionHistory(365)
  const csv = exportSessionsToCSV(allSessions)
  const date = new Date().toISOString().split('T')[0]
  const filename = `violin-progress-${date}.csv`

  const result = downloadCSV(csv, filename)
  return result
}

function calculateOverallProgress(progress: UserProgress) {
  const overallSkill = progress.overallSkill
  const scale = 1.0
  const factor = scale * overallSkill

  const result = factor
  return result
}
