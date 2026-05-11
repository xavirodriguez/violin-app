'use client'

import React from 'react'
import { PracticeSummaryChart } from '../practice-summary-chart'

interface HeatmapSectionProps {
  data: Array<{
    noteIndex: number
    targetPitch: string
    accuracy: number
    cents: number
  }>
}

export function HeatmapSection(props: HeatmapSectionProps) {
  const { data } = props
  const hasData = data && data.length > 0

  if (!hasData) {
    const emptyState = <></>
    return emptyState
  }

  return (
    <div className="bg-card border-border mb-6 rounded-lg border p-6">
      <h2 className="mb-4 text-xl font-bold">Last Session Intonation Heatmap</h2>
      <PracticeSummaryChart noteAttempts={data} />
    </div>
  )
}
