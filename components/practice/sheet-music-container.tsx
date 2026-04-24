/**
 * SheetMusicContainer
 *
 * Manages the display and annotations for the exercise sheet music.
 */

'use client'

import { cn } from '@/lib/utils'
import { PracticeState } from '@/lib/practice-core'
import { Note } from '@/lib/domain/musical-types'
import { SheetMusicAnnotations } from '@/components/sheet-music-annotations'
import { useOSMDSafe } from '@/hooks/use-osmd-safe'
import { SheetMusicView } from './sheet-music-view'
import { ViewToggleButton } from './view-toggle-button'

interface SheetMusicContainerProps {
  status: string
  sheetMusicView: 'focused' | 'full'
  setSheetMusicView: (v: 'focused' | 'full') => void
  practiceState: PracticeState | undefined
  osmdHook: ReturnType<typeof useOSMDSafe>
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
  const { sheetMusicView, practiceState, osmdHook, currentNoteIndex } = props
  const heightClass = sheetMusicView === 'focused' ? 'max-h-[300px]' : 'max-h-[800px]'
  const annotations = practiceState ? mapAnnotations(practiceState.exercise.notes) : {}

  return (
    <div className={cn('overflow-hidden transition-all duration-500', heightClass)}>
      <SheetMusicView
        musicXML={practiceState?.exercise.musicXML}
        isReady={osmdHook.isReady}
        error={osmdHook.error || undefined}
        containerRef={osmdHook.containerRef}
      />
      {practiceState && (
        <SheetMusicAnnotations
          annotations={annotations}
          currentNoteIndex={currentNoteIndex}
          osmd={osmdHook.osmd || undefined}
          containerRef={osmdHook.containerRef}
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
