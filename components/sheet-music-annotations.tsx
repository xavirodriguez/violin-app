'use client'

import React, { useEffect, useState } from 'react'
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay'
import { ArrowUp, ArrowDown, AlertCircle } from 'lucide-react'

export interface Annotation { fingerNumber?: 1|2|3|4; bowDirection?: 'up'|'down'; warningFlag?: boolean; }
interface SheetMusicAnnotationsProps { annotations: Record<number, Annotation>; currentNoteIndex: number; osmd: OpenSheetMusicDisplay | null; containerRef: React.RefObject<HTMLDivElement | null>; }

export function SheetMusicAnnotations({ annotations, currentNoteIndex, osmd, containerRef }: SheetMusicAnnotationsProps) {
  const [coords, setCoords] = useState<Record<number, { x: number; y: number }>>({})
  useEffect(() => {
    if (!osmd || !osmd.GraphicSheet || !containerRef.current) return
    const updateCoords = () => {
      const newCoords: Record<number, { x: number; y: number }> = {}
      const containerRect = containerRef.current?.getBoundingClientRect()
      if (!containerRect) return
      const cursorElement = containerRef.current?.querySelector('.osmd-cursor')
      if (cursorElement) {
        const rect = cursorElement.getBoundingClientRect()
        newCoords[currentNoteIndex] = { x: rect.left - containerRect.left, y: rect.top - containerRect.top }
      }
      setCoords(newCoords)
    }
    const timeout = setTimeout(updateCoords, 100)
    window.addEventListener('resize', updateCoords)
    return () => { clearTimeout(timeout); window.removeEventListener('resize', updateCoords); }
  }, [osmd, currentNoteIndex, containerRef])

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Object.entries(annotations).map(([indexStr, annotation]) => {
        const index = parseInt(indexStr); const pos = coords[index]; if (!pos) return null
        return (
          <div key={index} className="absolute transition-all duration-300" style={{ left: pos.x, top: pos.y - 40 }}>
            <div className="flex flex-col items-center gap-1 bg-background/80 backdrop-blur-sm p-1 rounded border border-primary/20 shadow-sm scale-90">
              {annotation.fingerNumber && <span className="font-bold text-primary text-xs bg-primary/10 w-5 h-5 flex items-center justify-center rounded-full">{annotation.fingerNumber}</span>}
              {annotation.bowDirection === 'up' && <ArrowUp className="h-4 w-4 text-blue-500" />}
              {annotation.bowDirection === 'down' && <ArrowDown className="h-4 w-4 text-blue-500" />}
              {annotation.warningFlag && <AlertCircle className="h-4 w-4 text-destructive animate-pulse" />}
            </div>
          </div>
        )
      })}
    </div>
  )
}
