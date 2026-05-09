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
import { PrecisionHeatmap } from './heatmap/precision-heatmap'
import { useState, useEffect } from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface SheetMusicContainerProps {
  status: string
  sheetMusicView: 'focused' | 'full'
  setSheetMusicView: (v: 'focused' | 'full') => void
  practiceState: PracticeState | undefined
  osmd: {
    isReady: boolean
    error: string | undefined
    containerRef: import('react').RefObject<HTMLDivElement | null>
    scoreView: ScoreViewPort
    applyHeatmap?: (precisionMap: Record<number, number>) => void
    onNoteClick?: (handler: (data: { noteIndex: number; event: MouseEvent }) => void) => any
  }
  currentNoteIndex: number
}

import { usePracticeStore } from '@/stores/practice-store'

export function SheetMusicContainer(props: SheetMusicContainerProps) {
  const { status, sheetMusicView, setSheetMusicView, osmd, practiceState } = props
  const [showHeatmap, setShowHeatmap] = useState(true)
  const onToggle = () => setSheetMusicView(sheetMusicView === 'focused' ? 'full' : 'focused')
  const playNote = usePracticeStore((s) => s.playNote)

  useEffect(() => {
    if (osmd.onNoteClick && practiceState) {
      const cleanup = osmd.onNoteClick(({ noteIndex }) => {
        const audioMap = practiceState.exercise.audioReferenceMap
        if (audioMap && audioMap.noteTimestamps[noteIndex]) {
          const sampleUrl = audioMap.noteTimestamps[noteIndex].sampleUrl
          if (sampleUrl) {
            playNote(sampleUrl)
          }
        }
      })
      return cleanup
    }
  }, [osmd.onNoteClick, practiceState, playNote])

  return (
    <div className="relative space-y-2">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-4">
          {status === 'idle' && (
            <div className="flex items-center space-x-2">
              <Switch
                id="heatmap-mode"
                checked={showHeatmap}
                onCheckedChange={setShowHeatmap}
              />
              <Label htmlFor="heatmap-mode" className="text-xs font-medium cursor-pointer">
                Accuracy Heatmap
              </Label>
              {showHeatmap && <HeatmapLegend />}
            </div>
          )}
        </div>
        {status !== 'idle' && <ViewToggleButton view={sheetMusicView} onToggle={onToggle} />}
      </div>

      <SheetMusicScrollArea {...props} showHeatmap={showHeatmap} />
    </div>
  )
}

function HeatmapLegend() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
        </TooltipTrigger>
        <TooltipContent className="flex flex-col gap-2 p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Historical Precision</p>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm bg-green-500" />
            <span className="text-xs">Mastered (&gt; 85%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm bg-yellow-500" />
            <span className="text-xs">Developing (70-85%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm bg-red-500" />
            <span className="text-xs">Needs Focus (&lt; 70%)</span>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function SheetMusicScrollArea(props: SheetMusicContainerProps & { showHeatmap: boolean }) {
  const { sheetMusicView, practiceState, osmd, currentNoteIndex, status, showHeatmap } = props
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
          scoreView={osmd.scoreView}
          containerRef={osmd.containerRef}
        />
      )}
      {practiceState && osmd.applyHeatmap && status === 'idle' && showHeatmap && (
        <PrecisionHeatmap
          exerciseId={practiceState.exercise.id}
          scoreView={osmd.scoreView}
          containerRef={osmd.containerRef}
          applyHeatmap={osmd.applyHeatmap}
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
