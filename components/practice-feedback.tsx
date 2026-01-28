/**
 * PracticeFeedback
 * Provides visual feedback to the student during an interactive practice session.
 */

'use client'

import { CheckCircle2, Circle, Music, Lightbulb, AlertTriangle, Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Progress } from '@/components/ui/progress'
import { Observation } from '@/lib/technique-types'

/**
 * Props for the PracticeFeedback component.
 */
interface PracticeFeedbackProps {
  /** The full name of the note the student should play (e.g., "G3"). */
  targetNote: string
  /** The name of the note currently being detected by the system. */
  detectedPitchName?: string
  /** The deviation from the ideal frequency in cents. */
  centsOff?: number | null
  /** Current status of the practice session (e.g., 'listening', 'validating', 'correct'). */
  status: string
  /** Current duration the note has been held steadily (in ms). */
  holdDuration?: number
  /** Total duration the note must be held to be considered correct (in ms). */
  requiredHoldTime?: number
  /** Technical observations for feedback. */
  observations?: Observation[]
}

/**
 * Threshold in cents for categorizing intonation as "Close" vs "Far".
 */
const WIDE_DEVIATION_THRESHOLD_CENTS = 25

/**
 * Internal component to render specific pedagogical feedback about intonation.
 */
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

/**
 * Renders feedback during the practice loop.
 */
export function PracticeFeedback({
  targetNote,
  detectedPitchName,
  centsOff,
  status,
  holdDuration = 0,
  requiredHoldTime = 500,
  observations = [],
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
              className={`text-3xl font-semibold ${
                targetNote === detectedPitchName && isInTune ? 'text-green-500' : 'text-yellow-500'
              }`}
            >
              {detectedPitchName}
            </div>
            {centsOff !== null && centsOff !== undefined && (
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
            {detectedPitchName && targetNote !== detectedPitchName && (
              <div className="text-center">
                <div className="text-lg font-semibold text-yellow-500">Wrong Note</div>
              </div>
            )}
            {detectedPitchName &&
              targetNote === detectedPitchName &&
              centsOff !== null &&
              !isInTune && <IntonationFeedback centsOff={centsOff} />}
            {!detectedPitchName && <Circle className="h-5 w-5" />}
            {!detectedPitchName && <span>Listening...</span>}
          </div>
        )}
        {status === 'listening' &&
          detectedPitchName &&
          !isInTune &&
          centsOff !== null &&
          centsOff !== undefined && <IntonationFeedback centsOff={centsOff} />}
        {status === 'validating' && (
          <div className="w-full max-w-xs text-center">
            <div className="text-primary mb-2 flex items-center justify-center gap-2">
              <div className="border-primary h-5 w-5 animate-spin rounded-full border-2 border-t-transparent" />
              <span>Hold steady...</span>
            </div>
            <Progress value={(holdDuration / requiredHoldTime) * 100} className="h-2" />
          </div>
        )}
        {status === 'correct' && (
          <div className="flex items-center gap-2 font-semibold text-green-500">
            <CheckCircle2 className="h-5 w-5" />
            <span>Perfect!</span>
          </div>
        )}
      </div>

      {/* Advanced Observations */}
      {observations.length > 0 && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            <span>Technique Insights</span>
          </div>
          <div className="grid gap-3">
            {observations.slice(0, 3).map((obs, idx) => (
              <div
                key={idx}
                className={`rounded-lg border p-3 ${
                  obs.severity === 3
                    ? 'bg-red-500/10 border-red-500/20'
                    : obs.severity === 2
                      ? 'bg-yellow-500/10 border-yellow-500/20'
                      : 'bg-blue-500/10 border-blue-500/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  {obs.severity === 3 ? <AlertTriangle className="h-5 w-5 text-red-500" /> :
                   obs.severity === 2 ? <AlertTriangle className="h-5 w-5 text-yellow-500" /> :
                   <Info className="h-5 w-5 text-blue-500" />}
                  <div className="flex-1">
                    <div className="text-sm font-bold">{obs.message}</div>
                    <div className="text-xs text-muted-foreground">{obs.tip}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
