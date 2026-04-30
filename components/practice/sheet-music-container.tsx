/**
 * SheetMusicContainer
 *
 * Manages the display and annotations for the exercise sheet music.
 */

'use client'

import { cn } from '@/lib/utils'
import { PracticeState } from '@/lib/domain/practice'
import { Note } from '@/lib/domain/exercise'
import { SheetMusicAnnotations } from '@/components/sheet-music-annotations'
import { SheetMusicView } from './sheet-music-view'
import { ScoreViewPort } from '@/lib/ports/score-view.port'
import { ViewToggleButton } from './view-toggle-button'
<<<<<<< HEAD
=======
import { ScoreViewPort } from '@/lib/ports/score-view.port'
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay'
>>>>>>> main

interface SheetMusicContainerProps {
  status: string
  sheetMusicView: 'focused' | 'full'
  setSheetMusicView: (v: 'focused' | 'full') => void
  practiceState: PracticeState | undefined
  osmd: {
    isReady: boolean
    error: string | undefined
    containerRef: import('react').RefObject<HTMLDivElement | null>
<<<<<<< HEAD
    scoreView: ScoreViewPort
=======
>>>>>>> main
  }
  scoreView: ScoreViewPort
  currentNoteIndex: number
}

export function SheetMusicContainer(props: SheetMusicContainerProps) {
  const { status, sheetMusicView, setSheetMusicView } = props
  const onToggle = () => setSheetMusicView(sheetMusicView === 'focused' ? 'full' : 'focused')

  return (
    <div className="relative">
      {status !== 'idle' && <ViewToggleButton view={sheetMusicView} onToggle={onToggle} />}
      <SheetMusicScrollArea {...props} />
    </div>
  )
}

function SheetMusicScrollArea(props: SheetMusicContainerProps) {
  const { sheetMusicView, practiceState, osmd, currentNoteIndex } = props
  const heightClass = sheetMusicView === 'focused' ? 'max-h-[300px]' : 'max-h-[800px]'
  const annotations = practiceState ? mapAnnotations(practiceState.exercise.notes) : {}

  return (
    <div className={cn('overflow-hidden transition-all duration-500', heightClass)}>
      <SheetMusicView
        musicXML={practiceState?.exercise.musicXML}
        isReady={osmd.isReady}
        error={osmd.error || undefined}
        containerRef={osmd.containerRef}
      />
      {practiceState && (
        <SheetMusicAnnotations
          annotations={annotations}
          currentNoteIndex={currentNoteIndex}
<<<<<<< HEAD
          scoreView={osmd.scoreView}
          containerRef={osmd.containerRef}
=======
          scoreView={props.scoreView}
>>>>>>> main
        />
      )}
    </div>
  )
}

function mapAnnotations(notes: Note[]): Record<number, NonNullable<Note['annotations']>> {
  return notes.reduce(
    (acc, note, idx) => {
      if (note.annotations) {
        acc[idx] = note.annotations
      }
      return acc
    },
    {} as Record<number, NonNullable<Note['annotations']>>,
  )
}
