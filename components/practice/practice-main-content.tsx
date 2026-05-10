'use client'

import { usePracticeStore } from '@/stores/practice-store'
import { PracticeActiveView } from './practice-active-view'
import { SelectionPrompt } from './selection-prompt'
import { PracticeCompletion } from '../practice-completion'
import { useAnalyticsStore } from '@/stores/analytics-store'

export function PracticeMainContent({ centsTolerance, osmd }: any) {
  const status = usePracticeStore((s) => s.status)
  const practiceState = usePracticeStore((s) => s.practiceState)
  const sessions = useAnalyticsStore((s) => s.sessions)

  if (status === 'idle') return <SelectionPrompt />
  if (practiceState?.status === 'completed') {
    return (
      <PracticeCompletion
        onRestart={() => usePracticeStore.getState().dispatch({ type: 'LOAD_EXERCISE', payload: { exercise: practiceState.exercise } })}
        onDone={() => usePracticeStore.getState().reset()}
        sessionData={sessions[0] as any}
      />
    )
  }

  return <PracticeActiveView centsTolerance={centsTolerance} osmd={osmd} />
}
