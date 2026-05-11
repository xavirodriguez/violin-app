'use client'

import { Play, Square, RotateCcw } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function PracticeControls({ status, hasExercise, onStart, onStop, onRestart, progress, currentNoteIndex, totalNotes }: any) {
  return (
    <Card className="p-4 shadow-sm border-2">
      <div className="flex items-center gap-8">
        <div className="flex gap-2">
            {['listening', 'validating', 'correct'].includes(status) ? (
                <Button onClick={onStop} size="lg" variant="destructive" className="gap-2">
                    <Square className="h-4 w-4" /> Detener
                </Button>
            ) : status === 'completed' ? (
                <Button onClick={onRestart} size="lg" className="gap-2">
                    <RotateCcw className="h-4 w-4" /> Repetir
                </Button>
            ) : (
                <Button onClick={onStart} size="lg" className="gap-2" disabled={!hasExercise}>
                    <Play className="h-4 w-4" /> Empezar
                </Button>
            )}
        </div>
        {hasExercise && (
          <div className="flex flex-col items-end gap-1">
            <div className="text-muted-foreground text-xs font-bold uppercase">Nota {currentNoteIndex + 1} de {totalNotes}</div>
            <div className="bg-muted h-3 w-48 overflow-hidden rounded-full border">
                <div className="bg-primary h-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
