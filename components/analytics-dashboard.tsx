'use client'

import { useAnalyticsStore, PracticeSession, Achievement } from '@/lib/stores/analytics-store'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export function AnalyticsDashboard() {
  const { progress, getTodayStats, getStreakInfo, getSessionHistory } = useAnalyticsStore()
  const todayStats = getTodayStats()
  const streakInfo = getStreakInfo()
  const recentSessions = getSessionHistory(7)

  // Prepare chart data
  const practiceTimeData = getLast7DaysData(recentSessions)

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold mb-6">📊 Your Progress</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
        <MetricCard
          icon="🔥"
          value={streakInfo.current}
          label="Day Streak"
        />
        <MetricCard
          icon="⏱️"
          value={formatTime(todayStats.duration)}
          label="Today"
        />
        <MetricCard
          icon="✓"
          value={progress.totalPracticeSessions}
          label="Sessions"
        />
      </div>

      {/* Skill Levels */}
      <div className="bg-card border border-border rounded-lg p-4 mb-6">
        <h2 className="text-xl font-bold mb-4">Skill Levels</h2>
        <SkillBar label="Intonation" value={progress.intonationSkill} />
        <SkillBar label="Rhythm" value={progress.rhythmSkill} />
        <SkillBar label="Overall" value={progress.overallSkill} />
      </div>

      {/* Practice Time Chart */}
      <div className="bg-card border border-border rounded-lg p-4 mb-6">
        <h2 className="text-xl font-bold mb-4">Practice Time (Last 7 Days)</h2>
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
      <div className="bg-card border border-border rounded-lg p-4">
        <h2 className="text-xl font-bold mb-4">Recent Achievements 🏆</h2>
        {progress.achievements.length === 0 ? (
          <p className="text-muted-foreground">No achievements yet. Keep practicing!</p>
        ) : (
          progress.achievements.slice(-3).reverse().map(achievement => (
            <AchievementCard key={achievement.id} achievement={achievement} />
          ))
        )}
      </div>
    </div>
  )
}

function MetricCard({ icon, value, label }: { icon: string, value: string | number, label: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 flex flex-col items-center justify-center text-center">
      <div className="text-4xl mb-2">{icon}</div>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-muted-foreground">{label}</div>
    </div>
  )
}

function SkillBar({ label, value }: { label: string, value: number }) {
  return (
    <div className="flex items-center gap-4 mb-2">
      <div className="w-24 text-muted-foreground">{label}:</div>
      <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
        <div className="bg-primary h-full" style={{ width: `${value}%` }} />
      </div>
      <div className="font-bold">{Math.round(value)}%</div>
    </div>
  )
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
    return (
        <div className="flex items-center gap-4 p-2 rounded-lg hover:bg-accent">
            <div className="text-2xl">{achievement.icon}</div>
            <div>
                <div className="font-bold">{achievement.name}</div>
                <div className="text-sm text-muted-foreground">{achievement.description}</div>
            </div>
        </div>
    )
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  return `${minutes}m`
}

function getLast7DaysData(sessions: PracticeSession[]) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const data = []

  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dayName = days[date.getDay()]

    const daySessions = sessions.filter(s => {
      const sessionDate = new Date(s.endTime)
      return sessionDate.toDateString() === date.toDateString()
    })

    const totalMinutes = daySessions.reduce((sum, s) => sum + s.duration / 60, 0)

    data.push({
      day: dayName,
      minutes: Math.round(totalMinutes)
    })
  }

  return data
}