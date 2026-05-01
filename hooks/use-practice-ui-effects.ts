import { useOSMDSafe } from './use-osmd-safe'
import { usePracticeShortcuts } from './use-practice-shortcuts'
import { usePracticeVisualSync } from './use-practice-visual-sync'

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
  osmd: ReturnType<typeof useOSMDSafe>
}) {
  const { status, currentNoteIndex, start, stop, setZenMode, osmd } = params

  usePracticeShortcuts({
    status,
    start,
    stop,
    onToggleZenMode: () => setZenMode((prev) => !prev),
  })

  usePracticeVisualSync({
    status,
    currentNoteIndex,
    scoreView: osmd.scoreView,
  })
}
