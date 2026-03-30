'use client'

import React from 'react'
import { formatTime } from './utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

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
    <TooltipProvider delayDuration={300}>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
        <MetricCard
          icon="🔥"
          value={streak}
          label="Day Streak"
          tooltip="Consecutive days practiced"
        />
        <MetricCard
          icon="⏱️"
          value={formattedToday}
          label="Today"
          tooltip="Practice time in the last 24 hours"
        />
        <MetricCard
          icon="✓"
          value={totalSessions}
          label="Sessions"
          tooltip="Total number of practice sessions"
        />
        <MetricCard
          icon="📚"
          value={completedExercises}
          label="Exercises Completed"
          tooltip="Unique exercises mastered"
        />
      </div>
    </TooltipProvider>
  )
}

function MetricCard({
  icon,
  value,
  label,
  tooltip,
}: {
  icon: string
  value: string | number
  label: string
  tooltip: string
}) {
  const iconElement = (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="mb-2 cursor-help text-4xl">{icon}</div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  )
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
