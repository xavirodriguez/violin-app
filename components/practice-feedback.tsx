'use client'

import { Info, AlertTriangle } from 'lucide-react'
import { Observation } from '@/lib/technique-types'
import { EmotionalFeedback } from './emotional-feedback'
import { usePreferencesStore } from '@/stores/preferences-store'
import { FEEDBACK_CONFIGS } from '@/lib/user-preferences'
import { Card } from '@/components/ui/card'

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
  const { feedbackLevel, showTechnicalDetails } = usePreferencesStore()
  const config = FEEDBACK_CONFIGS[feedbackLevel]

  const isInTune = centsOff !== null && centsOff !== undefined && Math.abs(centsOff) < config.centsTolerance
  const noteMatches = detectedPitchName === targetNote

  return (
    <div className="space-y-6">
      {/* Target Note */}
      <div className="text-center">
        <div className="text-muted-foreground mb-2 text-sm">Target Note</div>
        <div className="text-foreground text-5xl font-bold">{targetNote}</div>
      </div>

      {/* Emotional Feedback Section */}
      <Card className="p-8">
        <EmotionalFeedback
          centsOff={centsOff ?? null}
          isInTune={isInTune}
          noteMatches={noteMatches}
          status={status}
        />
      </Card>

      {/* Technical Details - only if enabled */}
      {showTechnicalDetails && (
        <Card className="p-4">
          <div className="grid grid-cols-2 gap-4 text-sm text-center">
            <div>
              <span className="text-muted-foreground">Detected:</span>
              <span className="ml-2 font-mono font-semibold">{detectedPitchName || '-'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Deviation:</span>
              <span className="ml-2 font-mono font-semibold">
                {centsOff !== null && centsOff !== undefined ? `${centsOff.toFixed(1)}¢` : '-'}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Live Observations */}
      <Level3LiveFeedback liveObservations={liveObservations} />
    </div>
  )
}
