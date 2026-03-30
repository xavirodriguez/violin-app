'use client'

import React from 'react'
import { formatTime } from './utils'

interface MetricsSectionProps {
  streak: number
  todayDuration: number
  totalSessions: number
  completedExercises: number
}

export function MetricsSection(props: MetricsSectionProps) {
  const { streak, todayDuration, totalSessions, completedExercises } = props
  const formattedToday = formatTime(todayDuration)

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
      <MetricCard icon="🔥" value={streak} label="Day Streak" />
      <MetricCard icon="⏱️" value={formattedToday} label="Today" />
      <MetricCard icon="✓" value={totalSessions} label="Sessions" />
      <MetricCard icon="📚" value={completedExercises} label="Exercises Completed" />
    </div>
  )
}

function MetricCard({
  icon,
  value,
  label,
}: {
  icon: string
  value: string | number
  label: string
}) {
  const iconElement = <div className="mb-2 text-4xl">{icon}</div>
  const valueElement = <div className="text-3xl font-bold">{value}</div>
  const labelElement = <div className="text-muted-foreground">{label}</div>

  return (
    <div className="bg-card border-border flex flex-col items-center justify-center rounded-lg border p-4 text-center">
      {iconElement}
      {valueElement}
      {labelElement}
    </div>
  )
}
