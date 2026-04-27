'use client'

import { CheckCircle2, AlertTriangle, Info } from 'lucide-react'
import { Observation } from '@/lib/technique-types'

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
}) {
  const { targetNote, detectedPitchName, centsOff, status, isPlaying, isCorrectNote, isInTune } =
    props

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
}) {
  const { targetNote, detectedPitchName, centsOff, isCorrectNote, isInTune } = props

  if (!isCorrectNote) {
    return <WrongNoteFeedback detectedNote={detectedPitchName!} targetNote={targetNote} />
  }

  if (isInTune) {
    return <PerfectFeedback />
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

function PerfectFeedback() {
  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <div className="text-center">
        <CheckCircle2 className="mx-auto mb-4 h-32 w-32 text-green-500" />
        <div className="text-4xl font-bold text-green-500">Perfect!</div>
      </div>
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
  const { severity, message, tip } = observation
  const styles = getObservationStyles(severity)

  return (
    <div className={`rounded-lg border p-3 ${styles.container}`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className={`h-5 w-5 flex-shrink-0 ${styles.icon}`} />
        <div className="flex-1">
          <div className="text-sm font-bold">{message}</div>
          <div className="text-muted-foreground text-xs">{tip}</div>
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
