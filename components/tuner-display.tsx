/**
 * TunerDisplay
 * A visual representation of the tuner state, including a needle meter and note info.
 */

'use client'

import { usePreferencesStore } from '@/stores/preferences-store'
import { useTunerStore } from '@/stores/tuner-store'
import { useTranslation } from '@/lib/i18n'
import { getTunerFeedbackMessage } from '@/lib/tuner-utils'

/**
 * Props for the TunerDisplay component.
 */
interface TunerDisplayProps {
  /** The musical name of the detected note (e.g., "A4"). */
  note: string | undefined
  /** The deviation from the ideal frequency in cents. */
  cents: number | undefined
  /** The confidence level of the pitch detection (0-1). */
  confidence: number
}

/**
 * Renders the tuner's main visual feedback.
 */
export function TunerDisplay(props: TunerDisplayProps) {
  const { note, cents, confidence } = props
  const language = usePreferencesStore((s) => s.language)
  const thresholds = useTunerStore((s) => s.thresholds)
  const feedbackMessage = getTunerFeedbackMessage(cents, confidence, language, thresholds)

  return (
    <div className="space-y-6">
      <ScreenReaderStatus feedbackMessage={feedbackMessage} />

      <TunerNoteInfo
        note={note}
        cents={cents}
        confidence={confidence}
        isInTune={Math.abs(cents ?? 100) < 10}
        isClose={Math.abs(cents ?? 100) < 25}
        feedbackMessage={feedbackMessage}
        language={language}
      />

      <TunerMeter cents={cents} />

      <TunerStatusIndicators
        note={note}
        cents={cents}
        isInTune={Math.abs(cents ?? 100) < 10}
        isClose={Math.abs(cents ?? 100) < 25}
        feedbackMessage={feedbackMessage}
      />
    </div>
  )
}

function ScreenReaderStatus(props: { feedbackMessage: string }) {
  return (
    <div role="status" className="sr-only" aria-live="polite">
      {props.feedbackMessage}
    </div>
  )
}

function TunerNoteInfo(props: {
  note: string | undefined
  cents: number | undefined
  confidence: number
  isInTune: boolean
  isClose: boolean
  feedbackMessage: string
  language: 'en' | 'es'
}) {
  const { note, cents, confidence, isInTune, isClose, language, feedbackMessage } = props

  return (
    <div className="text-center">
      {note ? (
        <ActiveNoteView
          note={note}
          cents={cents}
          confidence={confidence}
          isInTune={isInTune}
          isClose={isClose}
          language={language}
        />
      ) : (
        <IdleNoteView feedbackMessage={feedbackMessage} />
      )}
    </div>
  )
}

function ActiveNoteView(props: {
  note: string
  cents: number | undefined
  confidence: number
  isInTune: boolean
  isClose: boolean
  language: 'en' | 'es'
}) {
  const { note, cents, confidence, isInTune, isClose, language } = props
  const t = useTranslation(language).tuner
  return (
    <>
      <div className="text-foreground mb-2 text-6xl font-bold">{note}</div>
      {cents !== undefined && <CentsDisplay cents={cents} isInTune={isInTune} isClose={isClose} />}
      <div className="text-muted-foreground mt-1 text-sm">
        {t.confidence}: {(confidence * 100).toFixed(0)}%
      </div>
    </>
  )
}

function IdleNoteView({ feedbackMessage }: { feedbackMessage: string }) {
  return (
    <>
      <div className="text-muted-foreground mb-2 text-6xl font-bold">-</div>
      <div className="text-muted-foreground">{feedbackMessage}</div>
    </>
  )
}

function CentsDisplay({
  cents,
  isInTune,
  isClose,
}: {
  cents: number
  isInTune: boolean
  isClose: boolean
}) {
  const colorClass = isInTune ? 'text-green-500' : isClose ? 'text-yellow-500' : 'text-red-500'
  const prefix = cents > 0 ? '+' : ''

  return (
    <div className={`text-2xl font-semibold ${colorClass}`} aria-hidden="true">
      {prefix}
      {cents.toFixed(1)}¢
    </div>
  )
}

function TunerMeter({ cents }: { cents: number | undefined }) {
  return (
    <div className="relative" aria-hidden="true">
      <div className="bg-muted relative h-12 overflow-hidden rounded-lg">
        <MeterColorZones />
        <div className="bg-foreground/30 absolute top-0 bottom-0 left-1/2 w-0.5" />
        <MeterNeedle cents={cents} />
      </div>
      <MeterLabels />
    </div>
  )
}

function MeterColorZones() {
  return (
    <div className="absolute inset-0 flex">
      <div className="flex-1 bg-red-500/20" />
      <div className="flex-1 bg-yellow-500/20" />
      <div className="w-16 bg-green-500/30" />
      <div className="flex-1 bg-yellow-500/20" />
      <div className="flex-1 bg-red-500/20" />
    </div>
  )
}

function MeterNeedle({ cents }: { cents: number | undefined }) {
  if (cents === undefined) return <></>

  const positionPercent = 50 + (cents / 50) * 50
  const style = {
    left: `${positionPercent}%`,
    transform: 'translateX(-50%)',
  }

  return (
    <div
      className="bg-foreground absolute top-0 bottom-0 w-1 transition-all duration-100"
      style={style}
    />
  )
}

function MeterLabels() {
  return (
    <div className="text-muted-foreground mt-2 flex justify-between text-xs">
      <span>-50¢</span>
      <span>-25¢</span>
      <span className="font-semibold">0¢</span>
      <span>+25¢</span>
      <span>+50¢</span>
    </div>
  )
}

function TunerStatusIndicators(props: {
  note: string | undefined
  cents: number | undefined
  isInTune: boolean
  isClose: boolean
  feedbackMessage: string
}) {
  const { note, cents, isInTune, isClose, feedbackMessage } = props
  const shouldShow = !!note && cents !== undefined

  if (!shouldShow) return <></>

  return (
    <div className="text-center" aria-hidden="true">
      <div
        className={`text-lg font-semibold ${isInTune ? 'text-green-500' : isClose ? 'text-yellow-500' : 'text-red-500'}`}
      >
        {isInTune && '✓ '}
        {!isInTune && (cents! > 0 ? (isClose ? '↑ ' : '↑↑ ') : isClose ? '↓ ' : '↓↓ ')}
        {feedbackMessage}
      </div>
    </div>
  )
}
