'use client'

import React from 'react'
import { ExerciseStats } from '@/lib/domain/practice'

interface IntonationHeatmapProps {
  exerciseStats: Record<string, ExerciseStats>
}

/**
 * Visualizes pitch accuracy patterns for all exercises in a heatmap grid.
 * Refactored to satisfy Senior Software Craftsmanship 5-15 line limits.
 */
export function IntonationHeatmap({ exerciseStats }: IntonationHeatmapProps) {
  const statsEntries = Object.entries(exerciseStats)
  const hasStats = statsEntries.length > 0

  if (!hasStats) {
    return <EmptyHeatmapState />
  }

  return (
    <div className="bg-card border-border mb-6 rounded-lg border p-6">
      <HeatmapHeader />
      <HeatmapGrid statsEntries={statsEntries} />
    </div>
  )
}

function EmptyHeatmapState() {
  const message = 'Practice more exercises to see your heatmap'
  const containerClass = 'bg-card border-border mb-6 rounded-lg border p-12 text-center'
  const textClass = 'text-muted-foreground'

  return (
    <div className={containerClass}>
      <p className={textClass}>{message}</p>
    </div>
  )
}

function HeatmapHeader() {
  const title = 'Exercise Accuracy Heatmap'
  const titleClass = 'mb-4 text-xl font-bold'

  const result = <h2 className={titleClass}>{title}</h2>
  return result
}

function HeatmapGrid({ statsEntries }: { statsEntries: [string, ExerciseStats][] }) {
  const gridClass = 'grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'

  return (
    <div className={gridClass}>
      {statsEntries.map(([id, stats]) => (
        <HeatmapItem key={id} id={id} stats={stats} />
      ))}
    </div>
  )
}

function HeatmapItem({ id, stats }: { id: string; stats: ExerciseStats }) {
  const accuracy = stats.averageAccuracy
  const bgColor = getHeatmapColor(accuracy)
  const tooltip = formatHeatmapTooltip(id, stats)
  const containerClass = `${bgColor} group relative flex flex-col items-center justify-center rounded-md p-4 transition-transform hover:scale-105`

  return (
    <div className={containerClass} title={tooltip}>
      <span className="text-xs font-bold tracking-tight uppercase opacity-80">{id}</span>
      <span className="text-lg font-black">{Math.round(accuracy)}%</span>
    </div>
  )
}

function getHeatmapColor(accuracy: number): string {
  if (accuracy >= 80) {
    const green = 'bg-green-600 text-white'
    return green
  }
  if (accuracy >= 50) {
    const yellow = 'bg-yellow-600 text-black'
    return yellow
  }
  const destructive = 'bg-destructive text-destructive-foreground'
  return destructive
}

function formatHeatmapTooltip(id: string, stats: ExerciseStats): string {
  const best = stats.bestAccuracy.toFixed(1)
  const avg = stats.averageAccuracy.toFixed(1)
  const completions = stats.timesCompleted
  const fast = (stats.fastestCompletionMs / 1000).toFixed(1)

  const tooltip = `${id}: Best ${best}%, Avg ${avg}%, ${completions} completions, Fast ${fast}s`
  return tooltip
}
