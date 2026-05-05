/**
 * usePracticeLifecycle
 *
 * Orchestrates the lifecycle of a practice session.
 */

'use client'

import { ScoreViewPort } from '@/lib/ports/score-view.port'
import { useEffect, useRef } from 'react'
import { usePracticeShortcuts } from './use-practice-shortcuts'
import { PracticeUIEvent, PracticeStatus } from '@/lib/domain/practice'
import { usePreferencesStore } from '@/stores/preferences-store'

interface LifecycleParams {
  dispatch: (event: PracticeUIEvent) => void
  onToggleZenMode: () => void
  scoreView: ScoreViewPort
  status: PracticeStatus
  currentNoteIndex: number
}

export function usePracticeLifecycle(params: LifecycleParams) {
  const { dispatch, onToggleZenMode, scoreView, status, currentNoteIndex } = params
  const { enableHaptics, soundFeedbackEnabled } = usePreferencesStore()
  const lastIndexRef = useRef(currentNoteIndex)

  // Manage keyboard shortcuts
  usePracticeShortcuts({
    status,
    dispatch,
    onToggleZenMode,
  })

  // Synchronize visual score
  useEffect(() => {
    if (scoreView.isReady) {
      scoreView.sync(currentNoteIndex)
    }

    // Feedback for note completion
    const indexChanged = currentNoteIndex !== lastIndexRef.current
    const isAdvancement = currentNoteIndex > 0 && indexChanged

    if (isAdvancement) {
      // 1. Haptics
      if (enableHaptics && typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50)
      }

      // 2. Sound Feedback (placeholder for future chime service)
      if (soundFeedbackEnabled) {
        // We can use a simple high-frequency beep if no chime is loaded
        try {
           const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
           const osc = ctx.createOscillator()
           const gain = ctx.createGain()
           osc.frequency.setValueAtTime(880, ctx.currentTime) // A5
           gain.gain.setValueAtTime(0.1, ctx.currentTime)
           gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)
           osc.connect(gain)
           gain.connect(ctx.destination)
           osc.start()
           osc.stop(ctx.currentTime + 0.1)
        } catch (e) {}
      }
    }

    lastIndexRef.current = currentNoteIndex
  }, [currentNoteIndex, scoreView, enableHaptics, soundFeedbackEnabled])
}
