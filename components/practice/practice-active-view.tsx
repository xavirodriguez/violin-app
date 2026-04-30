'use client'

import { Card } from '@/components/ui/card'
import { PracticeFeedback } from '@/components/practice-feedback'
import { ViolinFingerboard } from '@/components/ui/violin-fingerboard'
import type { TargetNote, DetectedNote } from '@/lib/domain/practice'
import type { Observation } from '@/lib/technique-types'

const DEFAULT_CENTS_TOLERANCE = 25

/**
 * View displaying real-time feedback and fingerboard visualization during practice.
 */
export function PracticeActiveView({
  status,
  targetNote,
  targetPitchName,
  lastDetectedNote,
  liveObservations,
  holdDuration,
  perfectNoteStreak,
  zenMode,
  centsTolerance = DEFAULT_CENTS_TOLERANCE,
}: {
  status: string
  targetNote: TargetNote | undefined
  targetPitchName: string | undefined
  lastDetectedNote: DetectedNote | undefined
  liveObservations?: Observation[]
  holdDuration?: number
  perfectNoteStreak?: number
  zenMode: boolean
  centsTolerance?: number
}) {
  const isActive = status === 'listening' || status === 'validating' || status === 'correct'
  if (!isActive || !targetNote || !targetPitchName) return <></>

  return (
    <>
      <Card className="p-12">
        <PracticeFeedback
          targetNote={targetPitchName}
          detectedPitchName={lastDetectedNote?.pitch}
          centsOff={lastDetectedNote?.cents}
          status={status}
          liveObservations={liveObservations}
          holdDuration={holdDuration}
          requiredHoldTime={500}
          perfectNoteStreak={perfectNoteStreak}
        />
      </Card>
      {!zenMode && (
        <Card className="p-12">
          <ViolinFingerboard
            targetNote={targetPitchName}
            detectedPitchName={lastDetectedNote?.pitch}
            centsDeviation={lastDetectedNote?.cents}
            centsTolerance={centsTolerance}
          />
        </Card>
      )}
    </>
  )
}
