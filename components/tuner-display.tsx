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
  note: string | null
  /** The deviation from the ideal frequency in cents. */
  cents: number | null
  /** The confidence level of the pitch detection (0-1). */
  confidence: number
}

/**
 * Renders the tuner's main visual feedback.
 *
 * @param props - Component properties.
 * @returns A JSX element containing the note name, cents deviation, and a meter.
 *
 * @remarks
 * Features:
 * - Real-time needle movement based on `cents`.
 * - Color-coded zones (green for in-tune, yellow for close, red for far).
 * - Accessibility: Includes a screen-reader-only live region for pitch updates.
 */
function TunerStatusRegion({ note, cents, isInTune, isClose }: { note: string | null; cents: number | null; isInTune: boolean; isClose: boolean }) {
  const getStatusText = () => {
    if (!note || cents === null) return 'Play a note'
    if (isInTune) return `${note}, In Tune`
    if (isClose) return `${note}, ${cents > 0 ? 'A bit sharp' : 'A bit flat'}`
    return `${note}, ${cents > 0 ? 'Too sharp' : 'Too flat'}`
  }

  return (
    <div role="status" className="sr-only" aria-live="polite">
      {getStatusText()}
    </div>
  )
}

function TunerNoteInfo({ note, cents, confidence, isInTune, isClose }: { note: string | null; cents: number | null; confidence: number; isInTune: boolean; isClose: boolean }) {
  if (!note) {
    return (
      <div className="text-center">
        <div className="text-muted-foreground mb-2 text-6xl font-bold">-</div>
        <div className="text-muted-foreground">Play a note</div>
      </div>
    )
  }

  return (
    <div className="text-center">
      <div className="text-foreground mb-2 text-6xl font-bold">{note}</div>
      {cents !== null && (
        <div
          className={`text-2xl font-semibold ${
            isInTune ? 'text-green-500' : isClose ? 'text-yellow-500' : 'text-red-500'
          }`}
          aria-hidden="true"
        >
          {cents > 0 ? '+' : ''}
          {cents.toFixed(1)}¢
        </div>
      )}
      <div className="text-muted-foreground mt-1 text-sm">
        Confidence: {(confidence * 100).toFixed(0)}%
      </div>
    </div>
  )
}

function TunerMeter({ cents }: { cents: number | null }) {
  return (
    <div className="relative" aria-hidden="true">
      <div className="bg-muted relative h-12 overflow-hidden rounded-lg">
        <div className="absolute inset-0 flex">
          <div className="flex-1 bg-red-500/20" />
          <div className="flex-1 bg-yellow-500/20" />
          <div className="w-16 bg-green-500/30" />
          <div className="flex-1 bg-yellow-500/20" />
          <div className="flex-1 bg-red-500/20" />
        </div>
        <div className="bg-foreground/30 absolute top-0 bottom-0 left-1/2 w-0.5" />
        {cents !== null && (
          <div
            className="bg-foreground absolute top-0 bottom-0 w-1 transition-all duration-100"
            style={{ left: `${50 + (cents / 50) * 50}%`, transform: 'translateX(-50%)' }}
          />
        )}
      </div>
      <div className="text-muted-foreground mt-2 flex justify-between text-xs">
        <span>-50¢</span>
        <span>-25¢</span>
        <span className="font-semibold">0¢</span>
        <span>+25¢</span>
        <span>+50¢</span>
      </div>
    </div>
  )
}

function TunerDirectionalFeedback({ cents, isInTune, isClose }: { cents: number; isInTune: boolean; isClose: boolean }) {
  if (isInTune) return <div className="text-lg font-semibold text-green-500">✓ In Tune</div>
  if (isClose) {
    return (
      <div className="text-lg font-semibold text-yellow-500">
        {cents > 0 ? '↑ A bit sharp' : '↓ A bit flat'}
      </div>
    )
  }
  return (
    <div className="text-lg font-semibold text-red-500">
      {cents > 0 ? '↑↑ Too sharp' : '↓↓ Too flat'}
    </div>
  )
}

export function TunerDisplay({ note, cents, confidence }: TunerDisplayProps) {
  const isInTune = cents !== null && Math.abs(cents) < 10
  const isClose = cents !== null && Math.abs(cents) < 25

  return (
    <div className="space-y-6">
      <TunerStatusRegion note={note} cents={cents} isInTune={isInTune} isClose={isClose} />
      <TunerNoteInfo note={note} cents={cents} confidence={confidence} isInTune={isInTune} isClose={isClose} />
      <TunerMeter cents={cents} />
      {note && cents !== null && (
        <div className="text-center" aria-hidden="true">
          <TunerDirectionalFeedback cents={cents} isInTune={isInTune} isClose={isClose} />
        </div>
      )}
    </div>
  )
}
