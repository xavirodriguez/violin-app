'use client'

import { CheckCircle2, AlertTriangle, Info } from 'lucide-react'
import { Observation } from '@/lib/technique-types'

/**
 * Props for the {@link PracticeFeedback} component.
 *
 * @public
 */
export interface PracticeFeedbackProps {
  /**
   * The scientific pitch name of the target note (e.g., "A4").
   */
  targetNote: string

  /**
   * The scientific pitch name detected by the audio engine.
   * `undefined` indicates no signal or signal below confidence threshold.
   */
  detectedPitchName: string | undefined

  /**
   * Pitch deviation in cents from the target note's ideal frequency.
   * Positive values are sharp, negative values are flat.
   */
  centsOff: number | undefined

  /**
   * Current status of the practice state machine.
   *
   * @remarks
   * Values like 'listening', 'validating', 'correct', 'completed' affect
   * which UI feedback layers are prioritized.
   */
  status: string

  /**
   * Maximum allowed deviation in cents to be considered "in tune".
   *
   * @defaultValue 10
   */
  centsTolerance?: number

  /**
   * List of real-time technical observations (intonation, stability, etc.).
   *
   * @remarks
   * These are derived from a rolling window of detections. Usually limited
   * to the top 2 most severe/confident observations.
   */
  liveObservations?: Observation[]

  /**
   * Duration the current note has been held correctly in tune (ms).
   */
  holdDuration?: number

  /**
   * Required hold time for a note to be considered successfully matched (ms).
   */
  requiredHoldTime?: number

  /**
   * Current count of consecutive notes played with high accuracy (`< 5` cents).
   */
  perfectNoteStreak?: number
}

/**
 * Component that provides real-time pedagogical feedback during a practice session.
 *
 * @remarks
 * This component implements a hierarchical feedback system designed to guide
 * students from raw pitch matching toward technical mastery:
 *
 * **Feedback Levels**:
 * 1. **Primary Status (Reactive)**: Large, high-contrast indicators for "Perfect", "Wrong Note", or "Adjust" (arrows). Optimized for peripheral vision while reading sheet music.
 * 2. **Technical Details (Optional)**: Provides exact numeric cents deviation for advanced students requiring precise data.
 * 3. **Live Observations (Heuristic)**: Displays actionable, human-readable tips (e.g., "Consistently sharp") derived from analysis of the audio stream patterns.
 *
 * **Performance**: This component is updated at the frequency of the audio pipeline (up to 60Hz).
 * Layout shifts are minimized to ensure a stable reading environment for the student.
 *
 * **Design Goal**:
 * The UI is optimized for "at-a-glance" recognition while playing an instrument,
 * using color coding (Green/Yellow/Red) and large iconography.
 *
 * @param props - Component props.
 *
 * @example
 * ```tsx
 * <PracticeFeedback
 *   targetNote="A4"
 *   detectedPitchName="A#4"
 *   centsOff={15}
 *   status="listening"
 * />
 * ```
 *
 * @public
 */
export function PracticeFeedback({
  targetNote,
  detectedPitchName,
  centsOff,
  status,
  centsTolerance = 10,
  liveObservations = [],
}: PracticeFeedbackProps) {
  /** Derived boolean: True if the detected pitch is within the user's current tolerance. */
  const isInTune = centsOff !== undefined && Math.abs(centsOff) < centsTolerance
  /** Derived boolean: True if a valid audio signal is being processed. */
  const isPlaying = !!(detectedPitchName && detectedPitchName !== '')
  /** Derived boolean: True if the detected note matches the target scientific pitch. */
  const isCorrectNote = detectedPitchName === targetNote

  return (
    <div className="space-y-8">

      {/* LEVEL 1: Main Status - Dominant feedback for quick recognition */}
      <div className="flex items-center justify-center min-h-[200px]">
        {status === 'listening' && !isPlaying && (
          <div className="text-center">
            <div className="text-6xl mb-4">🎻</div>
            <div className="text-2xl text-muted-foreground font-medium">
              Play {targetNote}
            </div>
          </div>
        )}

        {isPlaying && isCorrectNote && isInTune && (
          <div className="text-center">
            <CheckCircle2 className="w-32 h-32 text-green-500 mx-auto mb-4" />
            <div className="text-4xl font-bold text-green-500">Perfect!</div>
          </div>
        )}

        {isPlaying && isCorrectNote && !isInTune && (
          <div className="text-center">
            <div className="text-8xl font-bold mb-4" style={{
              color: Math.abs(centsOff!) < 15 ? '#F59E0B' : '#EF4444'
            }}>
              {centsOff! > 0 ? '↑' : '↓'}
            </div>
            <div className="text-3xl font-semibold" style={{
              color: Math.abs(centsOff!) < 15 ? '#F59E0B' : '#EF4444'
            }}>
              {Math.abs(centsOff!) < 15 ? 'Almost!' : 'Adjust'}
            </div>
            <div className="text-xl text-muted-foreground mt-2">
              {centsOff! > 0 ? 'Move finger down' : 'Move finger up'}
            </div>
          </div>
        )}

        {isPlaying && !isCorrectNote && (
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
        )}
      </div>

      {/* LEVEL 2: Precise Metrics - For students who want exact data */}
      {isPlaying && centsOff !== undefined && (
        <details className="text-center">
          <summary className="text-sm text-muted-foreground cursor-pointer">
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
                <div className="font-mono text-lg">±{centsTolerance}¢</div>
              </div>
            </div>
          </div>
        </details>
      )}

      {/* LEVEL 3: Live Observations - Actionable pedagogical tips */}
      {liveObservations.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Info className="h-4 w-4" />
            <span>Live Feedback</span>
          </div>
          {liveObservations.slice(0, 2).map((obs, idx) => (
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
      )}
    </div>
  )
}
