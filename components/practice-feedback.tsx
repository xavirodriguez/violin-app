'use client'

import { MusicalNote } from '@/lib/practice-core'
import { CheckCircle2, Circle, Music } from 'lucide-react'

interface PracticeFeedbackProps {
  targetNote: string
  detectedPitchName?: string
  centsOff?: number | null
  status: string
}

export function PracticeFeedback({
  targetNote,
  detectedPitchName,
  centsOff,
  status,
}: PracticeFeedbackProps) {
  const isInTune = centsOff !== null && centsOff !== undefined && Math.abs(centsOff) < 25

  return (
    <div className="space-y-6">
      {/* Target Note */}
      <div className="text-center">
        <div className="text-muted-foreground mb-2 text-sm">Target Note</div>
        <div className="text-foreground text-5xl font-bold">{targetNote}</div>
      </div>

      {/* Detected Note */}
      <div className="text-center">
        <div className="text-muted-foreground mb-2 text-sm">Detected</div>
        {detectedPitchName ? (
          <>
            <div
              className={`text-3xl font-semibold ${isInTune ? 'text-green-500' : 'text-yellow-500'}`}
            >
              {detectedPitchName}
            </div>
            {centsOff !== null && centsOff !== undefined && (
              <div className="text-muted-foreground text-lg">
                {centsOff > 0 ? '+' : ''}
                {centsOff.toFixed(1)}¢
              </div>
            )}
          </>
        ) : (
          <div className="text-muted-foreground flex items-center justify-center gap-2">
            <Music className="h-6 w-6" />
            <span>Play the note</span>
          </div>
        )}
      </div>

      {/* Status Indicator */}
      <div className="flex items-center justify-center gap-2">
        {status === 'listening' && (
          <div className="text-muted-foreground flex items-center gap-2">
            <Circle className="h-5 w-5" />
            <span>Listening...</span>
          </div>
        )}
        {status === 'validating' && (
          <div className="text-primary flex items-center gap-2">
            <div className="border-primary h-5 w-5 animate-spin rounded-full border-2 border-t-transparent" />
            <span>Hold steady...</span>
          </div>
        )}
        {status === 'correct' && (
          <div className="flex items-center gap-2 font-semibold text-green-500">
            <CheckCircle2 className="h-5 w-5" />
            <span>Perfect!</span>
          </div>
        )}
      </div>
    </div>
  )
}
