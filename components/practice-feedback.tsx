'use client'

import { CheckCircle2, AlertTriangle, Info, HelpCircle } from 'lucide-react'
import { Observation } from '@/lib/technique-types'
import { translateObservation } from '@/lib/curriculum/observation-translator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { Zap } from 'lucide-react'

/**
 * Props for the {@link PracticeFeedback} component.
 *
 * @public
 */
export interface PracticeFeedbackProps {
  /** The scientific pitch name of the target note (e.g., "A4"). */
  targetNote: string
  /** The scientific pitch name detected by the audio engine. */
  detectedPitchName: string | undefined
  /** Pitch deviation in cents from the target note's ideal frequency. */
  centsOff: number | undefined
  /** Current status of the practice state machine. */
  status: string
  /** Maximum allowed deviation in cents to be considered "in tune". */
  centsTolerance?: number
  /** List of real-time technical observations. */
  liveObservations?: Observation[]
  /** Duration the current note has been held correctly in tune (ms). */
  holdDuration?: number
  /** Required hold time for a note to be considered successfully matched (ms). */
  requiredHoldTime?: number
  /** Current count of consecutive notes played with high accuracy. */
  perfectNoteStreak?: number
}

/**
 * Component that provides real-time pedagogical feedback during a practice session.
 */
export function PracticeFeedback(props: PracticeFeedbackProps) {
  const {
    targetNote,
    detectedPitchName,
    centsOff,
    status,
    centsTolerance = 10,
    liveObservations = [],
    perfectNoteStreak,
    holdDuration,
    requiredHoldTime,
  } = props

  const isInTune = centsOff !== undefined && Math.abs(centsOff) < centsTolerance
  const isPlaying = !!(detectedPitchName && detectedPitchName !== '')
  const isCorrectNote = detectedPitchName === targetNote

  return (
    <div className="space-y-8">
      <FeedbackStatus
        targetNote={targetNote}
        detectedPitchName={detectedPitchName}
        centsOff={centsOff}
        status={status}
        isPlaying={isPlaying}
        isCorrectNote={isCorrectNote}
        isInTune={isInTune}
        perfectNoteStreak={perfectNoteStreak}
        holdDuration={holdDuration}
        requiredHoldTime={requiredHoldTime}
      />

      <TechnicalDetails isPlaying={isPlaying} centsOff={centsOff} centsTolerance={centsTolerance} />

      <LiveObservationsList observations={liveObservations} />
    </div>
  )
}

function FeedbackStatus(props: {
  targetNote: string
  detectedPitchName: string | undefined
  centsOff: number | undefined
  status: string
  isPlaying: boolean
  isCorrectNote: boolean
  isInTune: boolean
  perfectNoteStreak?: number
  holdDuration?: number
  requiredHoldTime?: number
}) {
  const {
    targetNote,
    detectedPitchName,
    centsOff,
    status,
    isPlaying,
    isCorrectNote,
    isInTune,
    perfectNoteStreak,
    holdDuration,
    requiredHoldTime,
  } = props

  if (!isPlaying) {
    return <WaitingState status={status} targetNote={targetNote} />
  }

  return (
    <ActiveFeedback
      targetNote={targetNote}
      detectedPitchName={detectedPitchName}
      centsOff={centsOff}
      isCorrectNote={isCorrectNote}
      isInTune={isInTune}
      perfectNoteStreak={perfectNoteStreak}
      holdDuration={holdDuration}
      requiredHoldTime={requiredHoldTime}
    />
  )
}

function WaitingState({ status, targetNote }: { status: string; targetNote: string }) {
  if (status === 'listening') {
    return <WaitingPrompt targetNote={targetNote} />
  }
  return <div className="flex min-h-[200px] items-center justify-center" />
}

function ActiveFeedback(props: {
  targetNote: string
  detectedPitchName: string | undefined
  centsOff: number | undefined
  isCorrectNote: boolean
  isInTune: boolean
  perfectNoteStreak?: number
  holdDuration?: number
  requiredHoldTime?: number
}) {
  const {
    targetNote,
    detectedPitchName,
    centsOff,
    isCorrectNote,
    isInTune,
    perfectNoteStreak,
    holdDuration = 0,
    requiredHoldTime = 300,
  } = props

  // If we are within 100 cents (one semitone) of the target,
  // don't show "Wrong Note", show adjustment feedback.
  const isCloseEnoughToTarget = isCorrectNote || (centsOff !== undefined && Math.abs(centsOff) < 100)

  if (!isCloseEnoughToTarget) {
    return <WrongNoteFeedback detectedNote={detectedPitchName!} targetNote={targetNote} />
  }

  if (isInTune && isCorrectNote) {
    const holdProgress = Math.min(100, (holdDuration / requiredHoldTime) * 100)
    return <PerfectFeedback streak={perfectNoteStreak} holdProgress={holdProgress} />
  }

  return <AdjustmentFeedback centsOff={centsOff!} />
}

function WaitingPrompt({ targetNote }: { targetNote: string }) {
  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <div className="text-center">
        <div className="mb-4 text-6xl">🎻</div>
        <div className="text-muted-foreground text-2xl font-medium">Play {targetNote}</div>
      </div>
    </div>
  )
}

function PerfectFeedback({
  streak = 0,
  holdProgress = 0,
}: {
  streak?: number
  holdProgress?: number
}) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center">
      <div className="relative text-center">
        <CheckCircle2 className="mx-auto mb-4 h-32 w-32 text-green-500" />
        {holdProgress > 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <svg className="h-40 w-40 -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-green-500/20"
              />
              <circle
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={440}
                strokeDashoffset={440 - (440 * holdProgress) / 100}
                className="text-green-500 transition-all duration-200"
              />
            </svg>
          </div>
        )}
        <div className="text-4xl font-bold text-green-500">Perfect!</div>
      </div>

      {streak >= 3 && (
        <div className="mt-4 animate-bounce text-center">
          <Badge className="hover:bg-amber-600 bg-amber-500 gap-1.5 px-3 py-1">
            <Zap className="h-3 w-3 fill-white" />
            Adaptive Difficulty Active
          </Badge>
          <p className="text-[10px] text-muted-foreground mt-1 font-bold uppercase tracking-tighter">
            Leveling Up!
          </p>
        </div>
      )}
    </div>
  )
}

function AdjustmentFeedback({ centsOff }: { centsOff: number }) {
  const isAlmost = Math.abs(centsOff) < 15
  const color = isAlmost ? '#F59E0B' : '#EF4444'
  const directionIcon = centsOff > 0 ? '↑' : '↓'
  const statusText = isAlmost ? 'Almost!' : 'Adjust'
  const tipText = centsOff > 0 ? 'Move finger down' : 'Move finger up'

  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <div className="text-center">
        <div className="mb-4 text-8xl font-bold" style={{ color }}>
          {directionIcon}
        </div>
        <div className="text-3xl font-semibold" style={{ color }}>
          {statusText}
        </div>
        <div className="text-muted-foreground mt-2 text-xl">{tipText}</div>
      </div>
    </div>
  )
}

function WrongNoteFeedback({
  detectedNote,
  targetNote,
}: {
  detectedNote: string
  targetNote: string
}) {
  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <div className="text-center">
        <AlertTriangle className="mx-auto mb-4 h-24 w-24 text-yellow-500" />
        <div className="mb-2 text-3xl font-bold text-yellow-500">Wrong Note</div>
        <div className="text-muted-foreground text-xl">
          Playing: <span className="font-mono">{detectedNote}</span>
        </div>
        <div className="text-muted-foreground text-xl">
          Need: <span className="font-mono">{targetNote}</span>
        </div>
      </div>
    </div>
  )
}

function TechnicalDetails(props: {
  isPlaying: boolean
  centsOff: number | undefined
  centsTolerance: number
}) {
  const { isPlaying, centsOff, centsTolerance } = props
  const shouldShow = isPlaying && centsOff !== undefined

  if (!shouldShow) return <></>

  return (
    <details className="text-center">
      <summary className="text-muted-foreground cursor-pointer text-sm">
        Show Technical Details
      </summary>
      <div className="mt-4 space-y-2 text-sm">
        <div className="flex justify-center gap-8">
          <MetricDisplay
            label="Deviation"
            value={`${centsOff > 0 ? '+' : ''}${centsOff.toFixed(1)}¢`}
          />
          <MetricDisplay label="Tolerance" value={`±${centsTolerance}¢`} />
        </div>
      </div>
    </details>
  )
}

function MetricDisplay({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-muted-foreground">{label}</div>
      <div className="font-mono text-lg">{value}</div>
    </div>
  )
}

function LiveObservationsList({ observations }: { observations: Observation[] }) {
  const hasObservations = observations.length > 0
  if (!hasObservations) return <></>

  return (
    <div className="space-y-3">
      <div className="text-muted-foreground flex items-center gap-2 text-sm font-semibold">
        <Info className="h-4 w-4" />
        <span>Live Feedback</span>
      </div>
      {observations.slice(0, 2).map((obs, idx) => (
        <ObservationItem key={idx} observation={obs} />
      ))}
    </div>
  )
}

function ObservationItem({ observation }: { observation: Observation }) {
  const translated = translateObservation(observation)
  const { severity, friendlyTitle, friendlyDescription, remedyTip, visualAidUrl } = translated
  const styles = getObservationStyles(severity)

  return (
    <div className={`rounded-lg border p-3 transition-all duration-300 ${styles.container}`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className={`h-5 w-5 flex-shrink-0 ${styles.icon}`} />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="text-sm font-bold">{friendlyTitle}</div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-muted-foreground hover:text-foreground">
                    <HelpCircle className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[200px]">
                  <p>{friendlyDescription}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="text-muted-foreground text-xs mt-1 italic">{remedyTip}</div>

          {visualAidUrl && (
            <div className="mt-2 overflow-hidden rounded-md border border-black/5 bg-black/5 p-1">
              <div className="flex items-center justify-center py-4 text-[10px] text-muted-foreground uppercase tracking-widest">
                Visual Aid Placeholder
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function getObservationStyles(severity: number) {
  if (severity === 3) {
    return { container: 'border-red-500/20 bg-red-500/10', icon: 'text-red-500' }
  }
  if (severity === 2) {
    return { container: 'border-yellow-500/20 bg-yellow-500/10', icon: 'text-yellow-500' }
  }
  return { container: 'border-blue-500/20 bg-blue-500/10', icon: 'text-blue-500' }
}
