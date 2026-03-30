'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface NoteAttempt {
  noteIndex: number
  targetPitch: string
  accuracy: number
  cents: number
}
interface PracticeSummaryChartProps {
  noteAttempts: NoteAttempt[]
}

/**
 * Visual summary of exercise performance with accuracy heatmap.
 */
export function PracticeSummaryChart({ noteAttempts }: PracticeSummaryChartProps) {
  const hasNoAttempts = noteAttempts.length === 0
  if (hasNoAttempts) {
    const emptyFragment = <></>
    return emptyFragment
  }

  const bestNote = [...noteAttempts].sort((a, b) => b.accuracy - a.accuracy)[0]
  const worstNote = [...noteAttempts].sort((a, b) => a.accuracy - b.accuracy)[0]
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h4 className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
          Accuracy Heatmap
        </h4>
        <TooltipProvider>
          <div className="bg-muted/20 flex flex-wrap gap-1.5 rounded-xl border p-4">
            {noteAttempts.map((note, i) => (
              <Tooltip key={i}>
                <TooltipTrigger asChild>
                  <div
                    className="h-10 w-6 cursor-help rounded-sm shadow-sm transition-all hover:scale-110"
                    style={{ backgroundColor: `hsl(${note.accuracy * 1.2}, 70%, 50%)` }}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1 text-xs">
                    <p className="font-bold">
                      Note {i + 1}: {note.targetPitch}
                    </p>
                    <p>Accuracy: {note.accuracy.toFixed(0)}%</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Card className="flex items-center gap-4 border-green-500/20 bg-green-500/5 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20 text-green-500">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-muted-foreground text-xs font-medium">Best Intonation</p>
            <p className="text-xl font-bold text-green-500">
              {bestNote.targetPitch}{' '}
              <span className="text-muted-foreground text-sm font-normal">
                ({bestNote.accuracy.toFixed(0)}%)
              </span>
            </p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 border-yellow-500/20 bg-yellow-500/5 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/20 text-yellow-500">
            <TrendingDown className="h-6 w-6" />
          </div>
          <div>
            <p className="text-muted-foreground text-xs font-medium">Needs Work</p>
            <p className="text-xl font-bold text-yellow-500">
              {worstNote.targetPitch}{' '}
              <span className="text-muted-foreground text-sm font-normal">
                ({worstNote.accuracy.toFixed(0)}%)
              </span>
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
