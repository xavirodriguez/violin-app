'use client'

import { usePracticeShortcuts } from './use-practice-shortcuts'
import { usePracticeVisualSync } from './use-practice-visual-sync'
import { useOSMDSafe } from './use-osmd-safe'

/**
 * Custom hook to manage keyboard shortcuts and cursor synchronization for the practice session.
 *
 * @param params - Hook dependencies including state and actions.
 */
export function usePracticeUIEffects(params: {
  status: string
  currentNoteIndex: number
  start: () => void
  stop: () => void
  setZenMode: (v: (prev: boolean) => boolean) => void
  osmdHook: ReturnType<typeof useOSMDSafe>
}) {
  const { status, currentNoteIndex, start, stop, setZenMode, osmdHook } = params

  usePracticeShortcuts({
    status,
    start,
    stop,
    onToggleZenMode: () => setZenMode((prev) => !prev),
  })

  usePracticeVisualSync({
    status,
    currentNoteIndex,
    scoreView: osmdHook.scoreView,
  })
}
