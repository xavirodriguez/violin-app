'use client'

import { CheckCircle2, AlertTriangle, Info } from 'lucide-react'
import { Observation } from '@/lib/technique-types'

interface PracticeFeedbackProps {
  /** The full name of the note the student should play (e.g., "G3"). */
  targetNote: string
  /** The name of the note currently being detected by the system. */
  detectedPitchName?: string
  /** The deviation from the ideal frequency in cents. */
  centsOff?: number | null
  /** Current status of the practice session. */
  status: string
  /** Technical observations for real-time feedback. */
  liveObservations?: Observation[]
}

function ListeningStatus({ targetNote }: { targetNote: string }) {
  return (
    <div className="text-center">
      <div className="text-6xl mb-4" role="img" aria-label="violin">🎻</div>
      <div className="text-2xl text-muted-foreground font-medium">
        Play {targetNote}
      </div>
    </div>
  )
}

function PerfectStatus() {
  return (
    <div className="text-center">
      <CheckCircle2 className="w-32 h-32 text-green-500 mx-auto mb-4" />
      <div className="text-4xl font-bold text-green-500">Perfect!</div>
    </div>
  )
}

function AdjustStatus({ centsOff }: { centsOff: number }) {
  const color = Math.abs(centsOff) < 15 ? '#F59E0B' : '#EF4444'
  return (
    <div className="text-center">
      <div className="text-8xl font-bold mb-4" style={{ color }}>
        {centsOff > 0 ? '↑' : '↓'}
      </div>
      <div className="text-3xl font-semibold" style={{ color }}>
        {Math.abs(centsOff) < 15 ? 'Almost!' : 'Adjust'}
      </div>
      <div className="text-xl text-muted-foreground mt-2">
        {centsOff > 0 ? 'Move finger down' : 'Move finger up'}
      </div>
    </div>
  )
}

function WrongNoteStatus({ detectedPitchName, targetNote }: { detectedPitchName?: string, targetNote: string }) {
  return (
    <div className="text-center">
      <AlertTriangle className="w-24 h-24 text-yellow-500 mx-auto mb-4" />
      <div className="text-3xl font-bold text-yellow-500 mb-2">
        Wrong Note
      </div>
      <div className="text-xl text-muted-foreground">
        Playing: <span className="font-mono">{detectedPitchName}</span>
      </div>
      <div className="text-xl text-muted-foreground">
        Need: <span className="font-mono">{targetNote}</span>
      </div>
    </div>
  )
}

interface Level1Props {
  status: string
  targetNote: string
  isPlaying: boolean
  isCorrectNote: boolean
  isInTune: boolean
  centsOff?: number | null
  detectedPitchName?: string
}

function Level1Status({
  status,
  targetNote,
  isPlaying,
  isCorrectNote,
  isInTune,
  centsOff,
  detectedPitchName
}: Level1Props) {
  if (status === 'listening' && !isPlaying) {
    return <ListeningStatus targetNote={targetNote} />
  }

  if (isPlaying && isCorrectNote) {
    if (isInTune) {
      return <PerfectStatus />
    }
    return <AdjustStatus centsOff={centsOff ?? 0} />
  }

  if (isPlaying && !isCorrectNote) {
    return <WrongNoteStatus detectedPitchName={detectedPitchName} targetNote={targetNote} />
  }

  return null
}

function Level2TechnicalDetails({ isPlaying, centsOff }: { isPlaying: boolean, centsOff?: number | null }) {
  if (!isPlaying || centsOff === null || centsOff === undefined) return null

  return (
    <details className="text-center">
      <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
        Show Technical Details
      </summary>
      <div className="mt-4 space-y-2 text-sm">
        <div className="flex justify-center gap-8">
          <div>
            <div className="text-muted-foreground">Deviation</div>
            <div className="font-mono text-lg">
              {centsOff > 0 ? '+' : ''}{centsOff.toFixed(1)}¢
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Tolerance</div>
            <div className="font-mono text-lg">±10¢</div>
          </div>
        </div>
      </div>
    </details>
  )
}

function Level3LiveFeedback({ liveObservations }: { liveObservations: Observation[] }) {
  if (liveObservations.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        <Info className="h-4 w-4" />
        <span>Live Feedback</span>
      </div>
      {liveObservations.slice(0, 2).map((obs, idx) => (
        <div
          key={idx}
          className={`rounded-lg border p-3 transition-all ${
            obs.severity === 3
              ? 'bg-red-500/10 border-red-500/20'
              : obs.severity === 2
                ? 'bg-yellow-500/10 border-yellow-500/20'
                : 'bg-blue-500/10 border-blue-500/20'
          }`}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle
              className={`h-5 w-5 flex-shrink-0 ${
                obs.severity === 3 ? 'text-red-500' : 'text-yellow-500'
              }`}
            />
            <div className="flex-1">
              <div className="text-sm font-bold">{obs.message}</div>
              <div className="text-xs text-muted-foreground">{obs.tip}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Renders hierarchical feedback during the practice loop.
 */
export function PracticeFeedback({
  targetNote,
  detectedPitchName,
  centsOff,
  status,
  liveObservations = [],
}: PracticeFeedbackProps) {
  const isInTune = centsOff !== null && centsOff !== undefined && Math.abs(centsOff) < 10
  const isPlaying = !!(detectedPitchName && detectedPitchName !== '')
  const isCorrectNote = detectedPitchName === targetNote

  return (
    <div className="space-y-8">
      {/* LEVEL 1: Primary State */}
      <div className="flex items-center justify-center min-h-[200px]">
        <Level1Status
          status={status}
          targetNote={targetNote}
          isPlaying={isPlaying}
          isCorrectNote={isCorrectNote}
          isInTune={isInTune}
          centsOff={centsOff}
          detectedPitchName={detectedPitchName}
        />
      </div>

      {/* LEVEL 2: Precise Metrics */}
      <Level2TechnicalDetails isPlaying={isPlaying} centsOff={centsOff} />

      {/* LEVEL 3: Live Observations */}
      <Level3LiveFeedback liveObservations={liveObservations} />
    </div>
  )
}
