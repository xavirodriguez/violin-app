'use client'

import React from 'react'
import { Achievement, useAnalyticsStore } from '@/stores/analytics-store'
import { Progress } from '@/components/ui/progress'
import {
  ACHIEVEMENT_DEFINITIONS,
  type AchievementCheckStats,
} from '@/lib/achievements/achievement-definitions'
import { getAchievementProgress } from '@/lib/achievements/achievement-checker'

interface AchievementsSectionProps {
  achievements: Achievement[]
}

/**
 * Displays recent achievements and locked achievements with progress bars.
 *
 * @param props - Contains the list of unlocked achievements.
 */
export function AchievementsSection(props: AchievementsSectionProps) {
  const { achievements } = props
  const { sessions, progress, currentPerfectStreak, currentSession } = useAnalyticsStore()

  const unlockedIds = new Set(achievements.map((a) => a.id))
  const recentAchievements = achievements.slice(-3).reverse()
  const lockedDefinitions = ACHIEVEMENT_DEFINITIONS.filter((d) => !unlockedIds.has(d.id))

  const stats = buildCurrentStats(sessions, progress, currentPerfectStreak, currentSession)

  return (
    <div className="bg-card border-border rounded-lg border p-4">
      <h2 className="mb-4 text-xl font-bold">Recent Achievements 🏆</h2>

      {achievements.length === 0 && lockedDefinitions.length === 0 && (
        <p className="text-muted-foreground">No achievements yet. Keep practicing!</p>
      )}

      {recentAchievements.map((achievement) => (
        <UnlockedAchievementCard key={achievement.id} achievement={achievement} />
      ))}

      {lockedDefinitions.length > 0 && (
        <div className="mt-4 space-y-2">
          <h3 className="text-muted-foreground text-sm font-semibold">In Progress</h3>
          {lockedDefinitions.slice(0, 5).map((definition) => {
            const pct = getAchievementProgress(definition, stats)
            return (
              <LockedAchievementCard
                key={definition.id}
                name={definition.name}
                description={definition.description}
                icon={definition.icon}
                progressPercent={pct}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

function UnlockedAchievementCard({ achievement }: { achievement: Achievement }) {
  return (
    <div className="hover:bg-accent flex items-center gap-4 rounded-lg p-2">
      <div className="text-2xl">{achievement.icon}</div>
      <div className="min-w-0 flex-1">
        <div className="font-bold">{achievement.name}</div>
        <div className="text-muted-foreground text-sm">{achievement.description}</div>
        <Progress value={100} className="mt-1 h-1.5 bg-green-100" />
      </div>
    </div>
  )
}

/**
 * Renders a locked achievement with a progress bar showing completion percentage.
 */
function LockedAchievementCard({
  name,
  description,
  icon,
  progressPercent,
}: {
  name: string
  description: string
  icon: string
  progressPercent: number
}) {
  return (
    <div className="flex items-center gap-4 rounded-lg p-2 opacity-60">
      <div className="text-2xl grayscale">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold">{name}</div>
        <div className="text-muted-foreground text-xs">{description}</div>
        <div className="mt-1 flex items-center gap-2">
          <Progress value={progressPercent} className="h-1.5 flex-1" />
          <span className="text-muted-foreground text-xs">{progressPercent}%</span>
        </div>
      </div>
    </div>
  )
}

/**
 * Builds AchievementCheckStats from the current store state for progress calculation.
 *
 * @param sessions - All stored sessions.
 * @param progress - Current user progress.
 * @param currentPerfectStreak - Current perfect note streak.
 * @param currentSession - The active session, if any.
 * @returns Stats suitable for achievement progress calculation.
 */
function buildCurrentStats(
  sessions: { notesCompleted: number; endTimeMs: number }[],
  progress: {
    currentStreak: number
    longestStreak: number
    exercisesCompleted: string[]
    totalPracticeTime: number
    overallSkill: number
    totalPracticeSessions: number
  },
  currentPerfectStreak: number,
  currentSession:
    | {
        notesCompleted: number
        accuracy: number
        startTimeMs: number
        exerciseId: string
      }
    | undefined,
): AchievementCheckStats {
  const totalNotesCompleted =
    sessions.reduce((sum, s) => sum + s.notesCompleted, 0) +
    (currentSession?.notesCompleted ?? 0)

  return {
    currentSession: {
      correctNotes: currentSession?.notesCompleted ?? 0,
      perfectNoteStreak: currentPerfectStreak,
      accuracy: currentSession?.accuracy ?? 0,
      durationMs: currentSession ? Date.now() - currentSession.startTimeMs : 0,
      exerciseId: currentSession?.exerciseId ?? '',
    },
    totalSessions: progress.totalPracticeSessions,
    totalPracticeDays: new Set(sessions.map((s) => new Date(s.endTimeMs).toDateString())).size,
    currentStreak: progress.currentStreak,
    longestStreak: progress.longestStreak,
    exercisesCompleted: progress.exercisesCompleted ?? [],
    totalPracticeTimeMs: progress.totalPracticeTime * 1000,
    averageAccuracy: progress.overallSkill,
    totalNotesCompleted,
  }
}
