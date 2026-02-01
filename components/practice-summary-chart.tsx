'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface NoteAttempt { noteIndex: number; targetPitch: string; accuracy: number; cents: number; }
interface PracticeSummaryChartProps { noteAttempts: NoteAttempt[]; }

export function PracticeSummaryChart({ noteAttempts }: PracticeSummaryChartProps) {
  if (noteAttempts.length === 0) return null
  const bestNote = [...noteAttempts].sort((a, b) => b.accuracy - a.accuracy)[0]
  const worstNote = [...noteAttempts].sort((a, b) => a.accuracy - b.accuracy)[0]
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Accuracy Heatmap</h4>
        <TooltipProvider>
          <div className="flex flex-wrap gap-1.5 p-4 bg-muted/20 rounded-xl border">
            {noteAttempts.map((note, i) => (
              <Tooltip key={i}>
                <TooltipTrigger asChild><div className="h-10 w-6 rounded-sm shadow-sm transition-all hover:scale-110 cursor-help" style={{ backgroundColor: `hsl(${note.accuracy * 1.2}, 70%, 50%)` }} /></TooltipTrigger>
                <TooltipContent><div className="text-xs space-y-1"><p className="font-bold">Note {i + 1}: {note.targetPitch}</p><p>Accuracy: {note.accuracy.toFixed(0)}%</p></div></TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 flex items-center gap-4 border-green-500/20 bg-green-500/5">
          <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-500"><TrendingUp className="h-6 w-6" /></div>
          <div><p className="text-xs text-muted-foreground font-medium">Best Intonation</p><p className="text-xl font-bold text-green-500">{bestNote.targetPitch} <span className="text-sm font-normal text-muted-foreground">({bestNote.accuracy.toFixed(0)}%)</span></p></div>
        </Card>
        <Card className="p-4 flex items-center gap-4 border-yellow-500/20 bg-yellow-500/5">
          <div className="h-10 w-10 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500"><TrendingDown className="h-6 w-6" /></div>
          <div><p className="text-xs text-muted-foreground font-medium">Needs Work</p><p className="text-xl font-bold text-yellow-500">{worstNote.targetPitch} <span className="text-sm font-normal text-muted-foreground">({worstNote.accuracy.toFixed(0)}%)</span></p></div>
        </Card>
      </div>
    </div>
  )
}
