'use client'

interface TunerDisplayProps {
  note: string | null
  cents: number | null
  confidence: number
}

export function TunerDisplay({ note, cents, confidence }: TunerDisplayProps) {
  const isInTune = cents !== null && Math.abs(cents) < 10
  const isClose = cents !== null && Math.abs(cents) < 25

  const getStatusText = () => {
    if (!note || cents === null) return 'Play a note'
    if (isInTune) return `${note}, In Tune`
    if (isClose) return `${note}, ${cents > 0 ? 'A bit sharp' : 'A bit flat'}`
    return `${note}, ${cents > 0 ? 'Too sharp' : 'Too flat'}`
  }

  return (
    <div className="space-y-6">
      {/* Screen-reader only live region */}
      <div role="status" className="sr-only" aria-live="polite">
        {getStatusText()}
      </div>
      {/* Detected Note */}
      <div className="text-center">
        {note ? (
          <>
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
          </>
        ) : (
          <>
            <div className="text-muted-foreground mb-2 text-6xl font-bold">-</div>
            <div className="text-muted-foreground">Play a note</div>
          </>
        )}
      </div>

      {/* Visual Tuner Meter */}
      <div className="relative" aria-hidden="true">
        <div className="bg-muted relative h-12 overflow-hidden rounded-lg">
          {/* Color zones */}
          <div className="absolute inset-0 flex">
            <div className="flex-1 bg-red-500/20" />
            <div className="flex-1 bg-yellow-500/20" />
            <div className="w-16 bg-green-500/30" />
            <div className="flex-1 bg-yellow-500/20" />
            <div className="flex-1 bg-red-500/20" />
          </div>

          {/* Center line */}
          <div className="bg-foreground/30 absolute top-0 bottom-0 left-1/2 w-0.5" />

          {/* Needle */}
          {cents !== null && (
            <div
              className="bg-foreground absolute top-0 bottom-0 w-1 transition-all duration-100"
              style={{
                left: `${50 + (cents / 50) * 50}%`,
                transform: 'translateX(-50%)',
              }}
            />
          )}
        </div>

        {/* Labels */}
        <div className="text-muted-foreground mt-2 flex justify-between text-xs">
          <span>-50¢</span>
          <span>-25¢</span>
          <span className="font-semibold">0¢</span>
          <span>+25¢</span>
          <span>+50¢</span>
        </div>
      </div>

      {/* Status Text */}
      {note && cents !== null && (
        <div className="text-center" aria-hidden="true">
          {isInTune && <div className="text-lg font-semibold text-green-500">✓ In Tune</div>}
          {!isInTune && isClose && (
            <div className="text-lg font-semibold text-yellow-500">
              {cents > 0 ? '↑ A bit sharp' : '↓ A bit flat'}
            </div>
          )}
          {!isInTune && !isClose && (
            <div className="text-lg font-semibold text-red-500">
              {cents > 0 ? '↑↑ Too sharp' : '↓↓ Too flat'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
