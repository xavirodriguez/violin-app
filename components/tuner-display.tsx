/**
 * TunerDisplay
 * A visual representation of the tuner state, including a needle meter and note info.
 */

'use client'

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
  const isInTune = cents !== undefined && Math.abs(cents) < 10
  const isClose = cents !== undefined && Math.abs(cents) < 25

  return (
    <div className="space-y-6">
      <ScreenReaderStatus note={note} cents={cents} isInTune={isInTune} isClose={isClose} />

      <TunerNoteInfo
        note={note}
        cents={cents}
        confidence={confidence}
        isInTune={isInTune}
        isClose={isClose}
      />

      <TunerMeter cents={cents} />

      <TunerStatusIndicators note={note} cents={cents} isInTune={isInTune} isClose={isClose} />
    </div>
  )
}

function ScreenReaderStatus(props: {
  note: string | undefined
  cents: number | undefined
  isInTune: boolean
  isClose: boolean
}) {
  const { note, cents, isInTune, isClose } = props
  const statusText = getStatusNarrative({ note, cents, isInTune, isClose })

  return (
    <div role="status" className="sr-only" aria-live="polite">
      {statusText}
    </div>
  )
}

function getStatusNarrative(params: {
  note: string | undefined
  cents: number | undefined
  isInTune: boolean
  isClose: boolean
}) {
  const { note, cents, isInTune, isClose } = params
  if (!note || cents === undefined) return 'Play a note'
  if (isInTune) return `${note}, In Tune`
  if (isClose) return `${note}, ${cents > 0 ? 'A bit sharp' : 'A bit flat'}`
  return `${note}, ${cents > 0 ? 'Too sharp' : 'Too flat'}`
}

function TunerNoteInfo(props: {
  note: string | undefined
  cents: number | undefined
  confidence: number
  isInTune: boolean
  isClose: boolean
}) {
  const { note, cents, confidence, isInTune, isClose } = props

  return (
    <div className="text-center">
      {note ? (
        <ActiveNoteView
          note={note}
          cents={cents}
          confidence={confidence}
          isInTune={isInTune}
          isClose={isClose}
        />
      ) : (
        <IdleNoteView />
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
}) {
  const { note, cents, confidence, isInTune, isClose } = props
  return (
    <>
      <div className="text-foreground mb-2 text-6xl font-bold">{note}</div>
      {cents !== undefined && <CentsDisplay cents={cents} isInTune={isInTune} isClose={isClose} />}
      <div className="text-muted-foreground mt-1 text-sm">
        Confidence: {(confidence * 100).toFixed(0)}%
      </div>
    </>
  )
}

function IdleNoteView() {
  return (
    <>
      <div className="text-muted-foreground mb-2 text-6xl font-bold">-</div>
      <div className="text-muted-foreground">Play a note</div>
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
}) {
  const { note, cents, isInTune, isClose } = props
  const shouldShow = !!note && cents !== undefined

  if (!shouldShow) return <></>

  return (
    <div className="text-center" aria-hidden="true">
      {isInTune && <div className="text-lg font-semibold text-green-500">✓ In Tune</div>}
      {!isInTune && <AdjustmentIndicator cents={cents!} isClose={isClose} />}
    </div>
  )
}

function AdjustmentIndicator({ cents, isClose }: { cents: number; isClose: boolean }) {
  const colorClass = isClose ? 'text-yellow-500' : 'text-red-500'
  const arrow = cents > 0 ? (isClose ? '↑' : '↑↑') : isClose ? '↓' : '↓↓'
  const text =
    cents > 0 ? (isClose ? 'A bit sharp' : 'Too sharp') : isClose ? 'A bit flat' : 'Too flat'

  return (
    <div className={`text-lg font-semibold ${colorClass}`}>
      {arrow} {text}
    </div>
  )
}
