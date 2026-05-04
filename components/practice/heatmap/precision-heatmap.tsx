'use client'

import React, { useEffect, useState } from 'react'
import { useAnalyticsStore } from '@/stores/analytics-store'
import { ScoreViewPort } from '@/lib/ports/score-view.port'

interface PrecisionHeatmapProps {
  exerciseId: string
  scoreView: ScoreViewPort
  containerRef: React.RefObject<HTMLDivElement | null>
  applyHeatmap: (precisionMap: Record<number, number>) => void
}

export function PrecisionHeatmap({
  exerciseId,
  scoreView,
  containerRef,
  applyHeatmap
}: PrecisionHeatmapProps) {
  const { getSessionHistory } = useAnalyticsStore()
  const [measurePrecision, setMeasurePrecision] = useState<Record<number, number>>({})

  useEffect(() => {
    const history = getSessionHistory(30).filter(s => s.exerciseId === exerciseId)
    if (history.length === 0) return

    // Heuristic: aggregate note results by their index and then map to measures
    // Since we don't have direct note-to-measure mapping in domain,
    // we'll assume OSMD can help us highlight.
    // For MVP E-03: we calculate per-note precision and let OSMD handle visual grouping if possible.
    const noteStats: Record<number, { sum: number, count: number }> = {}

    history.forEach(session => {
      session.noteResults.forEach(result => {
        if (!noteStats[result.noteIndex]) noteStats[result.noteIndex] = { sum: 0, count: 0 }
        noteStats[result.noteIndex].sum += result.wasInTune ? 1 : 0
        noteStats[result.noteIndex].count += 1
      })
    })

    const precisionMap: Record<number, number> = {}
    Object.entries(noteStats).forEach(([idx, stats]) => {
      precisionMap[parseInt(idx)] = stats.sum / stats.count
    })
    setMeasurePrecision(precisionMap)
  }, [exerciseId, getSessionHistory])

  useEffect(() => {
    if (!scoreView.isReady || !containerRef.current || Object.keys(measurePrecision).length === 0) return

    applyHeatmap(measurePrecision)
  }, [measurePrecision, scoreView, containerRef, applyHeatmap])

  return null // This component primarily side-effects the SVG
}
