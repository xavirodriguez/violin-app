"use client"

import { useEffect, useRef, useState } from "react"
import { OpenSheetMusicDisplay, Cursor } from "opensheetmusicdisplay"

interface UseOSMDProps {
  musicXML: string
  container: HTMLDivElement | null
  currentNoteIndex: number
  completedNotes: boolean[]
}

export function useOSMD({ musicXML, container, currentNoteIndex, completedNotes }: UseOSMDProps) {
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null)
  const cursorRef = useRef<Cursor | null>(null)
  const [isReady, setIsReady] = useState(false)

  // Initialize OSMD
  useEffect(() => {
    if (!container || osmdRef.current) return

    const osmd = new OpenSheetMusicDisplay(container, {
      autoResize: true,
      backend: "svg",
      drawTitle: false,
      followCursor: true,
      disableCursor: false,
    })

    osmdRef.current = osmd
    cursorRef.current = osmd.cursor

    osmd
      .load(musicXML)
      .then(() => {
        return osmd.render()
      })
      .then(() => {
        setIsReady(true)
        osmd.cursor.show()
      })
      .catch((err) => {
        console.error("OSMD Error:", err)
      })

    return () => {
      // In React 18's StrictMode, this cleanup runs on unmount.
      // OSMD instance is tied to the container, so we should be careful here.
      // A simple clear might be enough if the container is also destroyed.
      if (osmdRef.current) {
        osmdRef.current.clear()
        osmdRef.current = null
      }
    }
  }, [musicXML, container])

  // Update cursor position
  useEffect(() => {
    if (!isReady || !cursorRef.current) return

    const cursor = cursorRef.current
    cursor.reset()
    for (let i = 0; i < currentNoteIndex; i++) {
      cursor.next()
    }
  }, [currentNoteIndex, isReady])

  // Apply styles to notes
  useEffect(() => {
    if (!isReady || !osmdRef.current) return

    const osmd = osmdRef.current

    // This is a way to get all the graphical notes from OSMD.
    // It's a bit of a workaround, but it's the most reliable method.
    const notes = osmd.graphic.measureList.flatMap((measure) =>
      measure.staffEntries.flatMap((entry) =>
        entry.graphicalVoiceEntries.flatMap((voice) =>
          voice.notes.map((note) => note.getSVGElement())
        )
      )
    )

    notes.forEach((noteEl, index) => {
      if (!noteEl) return

      // Clear existing classes
      noteEl.classList.remove("note-current", "note-completed")

      if (completedNotes[index]) {
        noteEl.classList.add("note-completed")
      } else if (index === currentNoteIndex) {
        noteEl.classList.add("note-current")
      }
    })
  }, [currentNoteIndex, completedNotes, isReady])

  return { isReady }
}
