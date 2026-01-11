"use client"

import { useEffect } from "react"
import { useOSMDSafe } from "@/hooks/use-osmd-safe"
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay"

interface SheetMusicProps {
  musicXML: string
  currentNoteIndex: number
  completedNotes: boolean[]
}

function highlightNote(
  osmd: OpenSheetMusicDisplay,
  currentNoteIndex: number,
  completedNotes: boolean[]
) {
  const notes = osmd.graphic.measureList
    .filter((m) => m?.staffEntries)
    .flatMap((m) => m.staffEntries)
    .filter((e) => e?.graphicalVoiceEntries)
    .flatMap((e) => e.graphicalVoiceEntries)
    .filter((v) => v?.notes)
    .flatMap((v) => v.notes)
    .map((n) => n.getSVGElement())
    .filter(Boolean)

  notes.forEach((noteEl, index) => {
    if (!noteEl) return
    noteEl.classList.remove("note-current", "note-completed")
    if (completedNotes[index]) {
      noteEl.classList.add("note-completed")
    } else if (index === currentNoteIndex) {
      noteEl.classList.add("note-current")
    }
  })
}

export function SheetMusic({ musicXML, currentNoteIndex, completedNotes }: SheetMusicProps) {
  const { osmd, isReady, error, containerRef } = useOSMDSafe(musicXML, currentNoteIndex)

  useEffect(() => {
    if (isReady && osmd) {
      // The cursor is now managed by the hook. This effect is for highlighting
      // completed notes, which is a separate concern.
      try {
        highlightNote(osmd, -1, completedNotes) // Pass -1 to avoid highlighting a "current" note
      } catch (err) {
        console.error("[SheetMusic] Highlighting error:", err)
      }
    }
  }, [isReady, osmd, completedNotes])

  if (error) {
    return (
      <div className="relative w-full min-h-[200px] bg-white rounded-lg shadow-md flex items-center justify-center">
        <div className="text-red-500">
          <p>Failed to load sheet music</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

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
        ref={containerRef}
        className={`sheet-music transition-opacity duration-500 ${isReady ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  )
}
