'use client'

import { MusicalNote } from '@/lib/musical-note'
import { CheckCircle2, Circle, Music } from 'lucide-react'

interface PracticeFeedbackProps {
  targetNote: string
  detectedPitch: number | null
  confidence: number
  isInTune: boolean
  centsOff: number | null
  holdDuration: number
  requiredHoldTime: number
  state: string
}

export function PracticeFeedback({
  targetNote,
  detectedPitch,
  isInTune,
  centsOff,
  holdDuration,
  requiredHoldTime,
  state,
}: PracticeFeedbackProps) {
  let detectedNote: MusicalNote | null = null

  if (detectedPitch && detectedPitch > 0) {
    try {
      detectedNote = MusicalNote.fromFrequency(detectedPitch)
    } catch (_err) {
      // Invalid frequency
    }
  }

  const holdProgress = Math.min(100, (holdDuration / requiredHoldTime) * 100)

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
        {detectedNote ? (
          <>
            <div
              className={`text-3xl font-semibold ${isInTune ? 'text-green-500' : 'text-yellow-500'}`}
            >
              {detectedNote.getFullName()}
            </div>
            {centsOff !== null && (
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

      {/* Hold Progress */}
      {(state === 'VALIDATING' || state === 'NOTE_COMPLETED') && isInTune && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Hold note...</span>
            <span
              className={
                state === 'NOTE_COMPLETED' ? 'font-semibold text-green-500' : 'text-foreground'
              }
            >
              {state === 'NOTE_COMPLETED' ? '✓ Complete' : `${Math.round(holdProgress)}%`}
            </span>
          </div>
          <div className="bg-muted h-3 overflow-hidden rounded-full">
            <div
              className={`h-full transition-all duration-100 ${
                state === 'NOTE_COMPLETED' ? 'bg-green-500' : 'bg-primary'
              }`}
              style={{ width: `${holdProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Status Indicator */}
      <div className="flex items-center justify-center gap-2">
        {state === 'PRACTICING' && (
          <div className="text-muted-foreground flex items-center gap-2">
            <Circle className="h-5 w-5" />
            <span>Listening...</span>
          </div>
        )}
        {state === 'NOTE_DETECTED' && !isInTune && (
          <div className="flex items-center gap-2 text-yellow-500">
            <Circle className="h-5 w-5" />
            <span>Adjust tuning</span>
          </div>
        )}
        {state === 'VALIDATING' && (
          <div className="text-primary flex items-center gap-2">
            <div className="border-primary h-5 w-5 animate-spin rounded-full border-2 border-t-transparent" />
            <span>Hold steady...</span>
          </div>
        )}
        {state === 'NOTE_COMPLETED' && (
          <div className="flex items-center gap-2 font-semibold text-green-500">
            <CheckCircle2 className="h-5 w-5" />
            <span>Perfect!</span>
          </div>
        )}
      </div>
    </div>
  )
}
