/**
 * AnalyticsDashboard
 * Provides a comprehensive view of the user's practice history, skill levels, and achievements.
 */

'use client'

import { useAnalyticsStore, PracticeSession, Achievement } from '@/lib/stores/analytics-store'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

/**
 * Main dashboard component that aggregates various analytics visualizations.
 *
 * @returns A JSX element with key metrics, skill bars, a practice time chart, and achievements.
 *
 * @remarks
 * Data Flow:
 * - Subscribes to `useAnalyticsStore` for the user's progress data.
 * - Uses internal utility functions to format data for the `recharts` components.
 */
export function AnalyticsDashboard() {
  const { progress, getTodayStats, getStreakInfo, getSessionHistory } = useAnalyticsStore()
  const todayStats = getTodayStats()
  const streakInfo = getStreakInfo()
  const recentSessions = getSessionHistory(7)

  // Prepare chart data
  const practiceTimeData = getLast7DaysData(recentSessions)

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="mb-6 text-2xl font-bold">📊 Your Progress</h1>

      {/* Key Metrics */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
        <MetricCard icon="🔥" value={streakInfo.current} label="Day Streak" />
        <MetricCard icon="⏱️" value={formatTime(todayStats.duration)} label="Today" />
        <MetricCard icon="✓" value={progress.totalPracticeSessions} label="Sessions" />
      </div>

      {/* Skill Levels */}
      <div className="bg-card border-border mb-6 rounded-lg border p-4">
        <h2 className="mb-4 text-xl font-bold">Skill Levels</h2>
        <SkillBar label="Intonation" value={progress.intonationSkill} />
        <SkillBar label="Rhythm" value={progress.rhythmSkill} />
        <SkillBar label="Overall" value={progress.overallSkill} />
      </div>

      {/* Practice Time Chart */}
      <div className="bg-card border-border mb-6 rounded-lg border p-4">
        <h2 className="mb-4 text-xl font-bold">Practice Time (Last 7 Days)</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={practiceTimeData}>
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="minutes" fill="#4ADE80" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Achievements */}
      <div className="bg-card border-border rounded-lg border p-4">
        <h2 className="mb-4 text-xl font-bold">Recent Achievements 🏆</h2>
        {progress.achievements.length === 0 ? (
          <p className="text-muted-foreground">No achievements yet. Keep practicing!</p>
        ) : (
          progress.achievements
            .slice(-3)
            .reverse()
            .map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))
        )}
      </div>
    </div>
  )
}

/**
 * Internal component for rendering a high-level metric card.
 * @internal
 */
function MetricCard({
  icon,
  value,
  label,
}: {
  icon: string
  value: string | number
  label: string
}) {
  return (
    <div className="bg-card border-border flex flex-col items-center justify-center rounded-lg border p-4 text-center">
      <div className="mb-2 text-4xl">{icon}</div>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-muted-foreground">{label}</div>
    </div>
  )
}

/**
 * Internal component for rendering a progress bar for a specific skill.
 * @internal
 */
function SkillBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="mb-2 flex items-center gap-4">
      <div className="text-muted-foreground w-24">{label}:</div>
      <div className="bg-muted h-4 flex-1 overflow-hidden rounded-full">
        <div className="bg-primary h-full" style={{ width: `${value}%` }} />
      </div>
      <div className="font-bold">{Math.round(value)}%</div>
    </div>
  )
}

/**
 * Internal component for rendering an achievement badge.
 * @internal
 */
function AchievementCard({ achievement }: { achievement: Achievement }) {
  return (
    <div className="hover:bg-accent flex items-center gap-4 rounded-lg p-2">
      <div className="text-2xl">{achievement.icon}</div>
      <div>
        <div className="font-bold">{achievement.name}</div>
        <div className="text-muted-foreground text-sm">{achievement.description}</div>
      </div>
    </div>
  )
}

/**
 * Formats seconds into a human-readable duration string.
 * @internal
 */
function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  return `${minutes}m`
}

/**
 * Processes raw session data into a format suitable for the 7-day bar chart.
 * @internal
 */
function getLast7DaysData(sessions: PracticeSession[]) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const data = []

  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dayName = days[date.getDay()]

    const daySessions = sessions.filter((s) => {
      const sessionDate = new Date(s.endTime)
      return sessionDate.toDateString() === date.toDateString()
    })

    const totalMinutes = daySessions.reduce((sum, s) => sum + s.duration / 60, 0)

    data.push({
      day: dayName,
      minutes: Math.round(totalMinutes),
    })
  }

  return data
}
