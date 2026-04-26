'use client'

import React from 'react'
import { Achievement, useAnalyticsStore } from '@/stores/analytics-store'
import { Progress } from '@/components/ui/progress'
import { ACHIEVEMENT_DEFINITIONS } from '@/lib/achievements/achievement-definitions'
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
  const { currentSession, currentPerfectStreak, sessions, progress } = useAnalyticsStore()

  const stats = {
    currentSession: {
      correctNotes: currentSession?.notesCompleted || 0,
      perfectNoteStreak: currentPerfectStreak,
      accuracy: currentSession?.accuracy || 0,
      durationMs: currentSession ? Date.now() - currentSession.startTimeMs : 0,
      exerciseId: currentSession?.exerciseId || '',
    },
    totalSessions: sessions.length,
    totalPracticeDays: 1, // Simplified
    currentStreak: progress.currentStreak,
    longestStreak: progress.longestStreak,
    exercisesCompleted: progress.exercisesCompleted || [],
    totalPracticeTimeMs: progress.totalPracticeTime * 1000,
    averageAccuracy: progress.overallSkill,
    totalNotesCompleted: sessions.reduce((sum, s) => sum + s.notesCompleted, 0),
  }

  const unlockedIds = achievements.map((a) => a.id)

  return (
    <div className="bg-card border-border space-y-6 rounded-lg border p-6">
      <div>
        <h2 className="mb-4 text-xl font-bold">Recent Achievements 🏆</h2>
        {achievements.length === 0 ? (
          <p className="text-muted-foreground">No achievements yet. Keep practicing!</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {achievements
              .slice(-3)
              .reverse()
              .map((achievement) => (
                <UnlockedAchievementCard key={achievement.id} achievement={achievement} />
              ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Next Milestones</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ACHIEVEMENT_DEFINITIONS.filter((def) => !unlockedIds.includes(def.id))
            .slice(0, 6)
            .map((def) => {
              const progressVal = getAchievementProgress(def, stats)
              return (
                <div key={def.id} className="bg-accent/50 space-y-3 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{def.icon}</span>
                    <div>
                      <div className="text-sm leading-tight font-bold">{def.name}</div>
                      <div className="text-muted-foreground text-xs">{def.description}</div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span>Progress</span>
                      <span>{Math.round(progressVal)}%</span>
                    </div>
                    <Progress value={progressVal} className="h-1.5" />
                  </div>
                </div>
              )
            })}
        </div>
      </div>
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
