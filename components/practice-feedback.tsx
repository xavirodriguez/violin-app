'use client'

import { CheckCircle2, Circle, Music } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface PracticeFeedbackProps {
  targetNote: string
  detectedPitchName?: string
  centsOff?: number | null
  status: string
}

const WIDE_DEVIATION_THRESHOLD_CENTS = 25

function IntonationFeedback({ centsOff }: { centsOff: number }) {
  const isClose = Math.abs(centsOff) < WIDE_DEVIATION_THRESHOLD_CENTS

  if (centsOff > 10) {
    return (
      <div className="text-center">
        <div className={`text-lg font-semibold ${isClose ? 'text-yellow-500' : 'text-red-500'}`}>
          {isClose ? 'A Bit Sharp' : 'Too Sharp'}
        </div>
        <div className="text-muted-foreground text-sm">
          Move your finger down (toward the scroll)
        </div>
      </div>
    )
  }
  if (centsOff < -10) {
    return (
      <div className="text-center">
        <div className={`text-lg font-semibold ${isClose ? 'text-yellow-500' : 'text-red-500'}`}>
          {isClose ? 'A Bit Flat' : 'Too Flat'}
        </div>
        <div className="text-muted-foreground text-sm">Move your finger up (toward the bridge)</div>
      </div>
    )
  }
  return null
}

export function PracticeFeedback({
  targetNote,
  detectedPitchName,
  centsOff,
  status,
}: PracticeFeedbackProps) {
  const isInTune = centsOff !== null && centsOff !== undefined && Math.abs(centsOff) < 10

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
            {centsOff !== null && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <div className="text-muted-foreground text-lg">
                      {centsOff > 0 ? '+' : ''}
                      {centsOff.toFixed(1)}¢
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    A cent is 1/100th of a semitone. A deviation of less than ±10 cents is
                    considered in tune.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
        {status === 'listening' && !detectedPitchName && (
          <div className="text-muted-foreground flex items-center gap-2">
            <Circle className="h-5 w-5" />
            <span>Listening...</span>
          </div>
        )}
        {status === 'listening' && detectedPitchName && !isInTune && centsOff !== null && (
          <IntonationFeedback centsOff={centsOff} />
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
