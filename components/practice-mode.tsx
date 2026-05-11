'use client'

import { usePracticeStore, useDerivedPracticeState } from '@/stores/practice-store'
import { useOSMDSafe } from '@/hooks/use-osmd-safe'
import { PracticeControls } from './practice/practice-controls'
import { PracticeMainContent } from './practice/practice-main-content'
import { usePracticeLifecycle } from '@/hooks/use-practice-lifecycle'
import { useEffect } from 'react'

export function PracticeMode() {
  const practiceState = usePracticeStore((s) => s.practiceState)
  const initialize = usePracticeStore((s) => s.initialize)
  const dispatch = usePracticeStore((s) => s.dispatch)
  const start = usePracticeStore((s) => s.start)
  const stop = usePracticeStore((s) => s.stop)

  useEffect(() => {
    initialize()
  }, [initialize])

  const xml = practiceState?.exercise.musicXML ?? ''
  const osmd = useOSMDSafe(xml)
  const derived = useDerivedPracticeState()

  usePracticeLifecycle({
    dispatch,
    status: derived.status as any,
    currentNoteIndex: derived.currentNoteIndex,
    onToggleZenMode: () => {},
    scoreView: osmd.scoreView,
  })

  return (
    <div className="relative mx-auto max-w-6xl px-4 py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{practiceState?.exercise.name || 'Cargando...'}</h2>
            <PracticeControls
                status={derived.status as any}
                hasExercise={!!practiceState}
                onStart={start}
                onStop={stop}
                onRestart={() => practiceState && dispatch({ type: 'LOAD_EXERCISE', payload: { exercise: practiceState.exercise } })}
                progress={derived.progress}
                currentNoteIndex={derived.currentNoteIndex}
                totalNotes={derived.totalNotes}
            />
        </div>

        <PracticeMainContent
          centsTolerance={25}
          sheetMusicView="full"
          setSheetMusicView={() => {}}
          osmd={{
            isReady: osmd.isReady,
            error: osmd.error,
            containerRef: osmd.containerRef,
            scoreView: osmd.scoreView,
          } as any}
        />
      </div>
    </div>
  )
}
