"use client"

interface SheetMusicProps {
  currentNoteIndex: number
  state: string
}

const G_MAJOR_NOTES = [
  { pitch: "G4", name: "G", octave: 4, color: "bg-blue-500" },
  { pitch: "A4", name: "A", octave: 4, color: "bg-purple-500" },
  { pitch: "B4", name: "B", octave: 4, color: "bg-pink-500" },
  { pitch: "C5", name: "C", octave: 5, color: "bg-red-500" },
  { pitch: "D5", name: "D", octave: 5, color: "bg-orange-500" },
  { pitch: "E5", name: "E", octave: 5, color: "bg-yellow-500" },
  { pitch: "F#5", name: "F#", octave: 5, color: "bg-green-500" },
  { pitch: "G5", name: "G", octave: 5, color: "bg-teal-500" },
]

export function SheetMusic({ currentNoteIndex, state }: SheetMusicProps) {
  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-foreground mb-2">G Major Scale</h3>
        <p className="text-sm text-muted-foreground">One octave ascending</p>
      </div>

      {/* Visual Note Display */}
      <div className="flex items-center justify-center gap-3 flex-wrap">
        {G_MAJOR_NOTES.map((note, index) => {
          const isPast = index < currentNoteIndex
          const isCurrent = index === currentNoteIndex
          const isFuture = index > currentNoteIndex
          const isCompleted = state === "NOTE_COMPLETED" && isCurrent

          return (
            <div
              key={note.pitch}
              className={`relative flex flex-col items-center gap-2 transition-all duration-300 ${
                isCurrent ? "scale-125" : "scale-100"
              }`}
            >
              {/* Note Circle */}
              <div
                className={`
                  w-16 h-16 rounded-full flex items-center justify-center
                  font-bold text-lg transition-all duration-300
                  ${isPast ? "bg-green-500/30 text-green-700 dark:text-green-300" : ""}
                  ${isCurrent && !isCompleted ? `${note.color} text-white shadow-lg ring-4 ring-primary/50` : ""}
                  ${isCompleted ? "bg-green-500 text-white shadow-lg ring-4 ring-green-500/50" : ""}
                  ${isFuture ? "bg-muted text-muted-foreground" : ""}
                `}
              >
                {note.name}
              </div>

              {/* Octave Label */}
              <div className="text-xs text-muted-foreground font-mono">{note.octave}</div>

              {/* Completion Checkmark */}
              {isPast && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4 text-white"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              )}

              {/* Current Note Indicator */}
              {isCurrent && !isCompleted && (
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2">
                  <div className="flex flex-col items-center">
                    <div className="w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-primary animate-bounce" />
                  </div>
                </div>
              )}

              {/* Note Number */}
              <div className="text-xs font-semibold text-muted-foreground mt-1">{index + 1}</div>
            </div>
          )
        })}
      </div>

      {/* Staff Lines Visual */}
      <div className="relative h-32 bg-white dark:bg-card rounded-lg p-4 overflow-hidden">
        {/* Five staff lines */}
        {[0, 1, 2, 3, 4].map((line) => (
          <div
            key={line}
            className="absolute left-0 right-0 h-0.5 bg-foreground/20"
            style={{ top: `${20 + line * 20}%` }}
          />
        ))}

        {/* Treble Clef Indicator */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-4xl opacity-20">𝄞</div>

        {/* Current Note Indicator on Staff */}
        {currentNoteIndex < G_MAJOR_NOTES.length && (
          <div
            className="absolute w-8 h-8 rounded-full bg-primary/80 shadow-lg transition-all duration-500"
            style={{
              left: `${10 + (currentNoteIndex * 80) / 8}%`,
              top: `${90 - currentNoteIndex * 8}%`,
            }}
          />
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green-500/30" />
          <span className="text-muted-foreground">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-primary" />
          <span className="text-muted-foreground">Current</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-muted" />
          <span className="text-muted-foreground">Upcoming</span>
        </div>
      </div>
    </div>
  )
}
