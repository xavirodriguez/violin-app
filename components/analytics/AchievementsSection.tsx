'use client'

import React from 'react'
import { Achievement } from '@/stores/analytics-store'

interface AchievementsSectionProps {
  achievements: Achievement[]
}

export function AchievementsSection(props: AchievementsSectionProps) {
  const { achievements } = props
  const hasAchievements = achievements.length > 0
  const recentAchievements = achievements.slice(-3).reverse()

  return (
    <div className="bg-card border-border rounded-lg border p-4">
      <h2 className="mb-4 text-xl font-bold">Recent Achievements 🏆</h2>
      {!hasAchievements && (
        <p className="text-muted-foreground">No achievements yet. Keep practicing!</p>
      )}
      {hasAchievements &&
        recentAchievements.map((achievement) => (
          <AchievementCard key={achievement.id} achievement={achievement} />
        ))}
    </div>
  )
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const iconElement = <div className="text-2xl">{achievement.icon}</div>
  const nameElement = <div className="font-bold">{achievement.name}</div>
  const descElement = (
    <div className="text-muted-foreground text-sm">{achievement.description}</div>
  )

  return (
    <div className="hover:bg-accent flex items-center gap-4 rounded-lg p-2">
      {iconElement}
      <div>
        {nameElement}
        {descElement}
      </div>
    </div>
  )
}
