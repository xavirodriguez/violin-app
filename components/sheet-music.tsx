"use client"

import { useRef } from "react"
import { useOSMD } from "@/hooks/useOSMD"

interface SheetMusicProps {
  musicXML: string
  currentNoteIndex: number
  completedNotes: boolean[]
  state: string
}

export function SheetMusic({ musicXML, currentNoteIndex, completedNotes, state }: SheetMusicProps) {
  const sheetMusicContainerRef = useRef<HTMLDivElement>(null)
  const { isReady } = useOSMD({
    musicXML,
    container: sheetMusicContainerRef.current,
    currentNoteIndex,
    completedNotes,
  })

  return (
    <div className="relative w-full min-h-[200px] bg-white rounded-lg shadow-md">
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-muted-foreground">Loading Sheet Music...</span>
          </div>
        </div>
      )}
      <div
        ref={sheetMusicContainerRef}
        className={`transition-opacity duration-500 ${isReady ? "opacity-100" : "opacity-0"}`}
        data-state={state}
      />
    </div>
  )
}
