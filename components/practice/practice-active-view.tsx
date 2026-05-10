'use client'

import { usePracticeStore, useDerivedPracticeState } from '@/stores/practice-store'
import { PracticeFeedback } from '../practice-feedback'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { allExercises } from '@/lib/exercises'

export function PracticeActiveView({ centsTolerance, osmd }: any) {
  const practiceState = usePracticeStore((s) => s.practiceState)
  const derived = useDerivedPracticeState()
  const loadExercise = usePracticeStore((s) => s.loadExercise)

  if (!practiceState) return null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1 space-y-6">
        <Card className="p-6">
          <PracticeFeedback
            targetNote={derived.targetPitchName || '--'}
            detectedPitchName={derived.lastDetectedNote?.pitch}
            centsOff={derived.lastDetectedNote?.cents}
            status={derived.status}
            centsTolerance={centsTolerance}
            holdDuration={practiceState.holdDuration}
            requiredHoldTime={usePracticeStore.getState().requiredHoldTime}
          />
        </Card>
        <Card className="p-4">
            <h3 className="font-bold mb-4">Ejercicios</h3>
            <div className="space-y-2">
                {allExercises.slice(0, 5).map(ex => (
                    <Button key={ex.id} variant={ex.id === practiceState.exercise.id ? 'default' : 'outline'} className="w-full justify-start overflow-hidden" onClick={() => loadExercise(ex)}>
                        {ex.name}
                    </Button>
                ))}
            </div>
        </Card>
      </div>
      <Card className="lg:col-span-2 p-6 flex flex-col min-h-[500px]">
        <div className="flex-1 relative border rounded-md bg-white">
           <div ref={osmd.containerRef} className="w-full h-full min-h-[400px]" />
        </div>
      </Card>
    </div>
  )
}
