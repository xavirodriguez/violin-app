/**
 * PracticeStore
 *
 * Simplified version for MVP. Orchestrates the practice session using PracticeService.
 */

'use client'

import { create } from 'zustand'
import { allExercises } from '@/lib/exercises'
import { type PracticeState, type PracticeEvent, reducePracticeEvent, formatPitchName } from '@/lib/practice-core'
import { type PracticeUIEvent, type LoopRegion } from '@/lib/domain/practice'
import { toAppError, AppError } from '@/lib/errors/app-error'
import { audioManager } from '@/lib/infrastructure/audio-manager'
import { practiceService } from '@/lib/practice/practice-service'
import { validateExercise } from '@/lib/exercises/validation'
import type { Exercise } from '@/lib/exercises/types'
import { Observation } from '@/lib/technique-types'

export interface PracticeStore {
  // Core MVP State
  status: 'idle' | 'ready' | 'active' | 'error'
  exercise: Exercise | undefined
  practiceState: PracticeState | undefined
  error: AppError | undefined
  analyser: AnalyserNode | undefined

  // UI Stubs for compatibility (to be removed once UI is updated)
  lastDrillResult: { success: boolean; precision: number } | null
  autoStartEnabled: boolean
  isListeningPhase: boolean
  listenIteration: number
  countdown: number | null
  tempoConfig: { bpm: number; scale: number }
  loopRegion: LoopRegion | undefined
  liveObservations: Observation[]
  listenImitateActive: boolean

  // Actions
  loadExercise: (exercise: Exercise) => void
  initialize: () => void
  start: () => Promise<void>
  stop: () => Promise<void>
  reset: () => void
  internalUpdate: (event: PracticeEvent) => void
  dispatch: (event: PracticeUIEvent) => void
  setLoopRegion: (region: LoopRegion | undefined) => void
  setTempoConfig: (config: { bpm: number; scale: number }) => void
  setListenImitateActive: (active: boolean) => void
}

export const usePracticeStore = create<PracticeStore>((set, get) => ({
  status: 'idle',
  exercise: undefined,
  practiceState: undefined,
  error: undefined,
  analyser: undefined,

  // Stubs
  lastDrillResult: null,
  autoStartEnabled: false,
  isListeningPhase: false,
  listenIteration: 0,
  countdown: null,
  tempoConfig: { bpm: 60, scale: 1.0 },
  loopRegion: undefined,
  liveObservations: [],
  listenImitateActive: false,

  loadExercise: (exercise) => {
    const validated = validateExercise(exercise)
    set({
      exercise: validated,
      practiceState: {
        status: 'idle',
        exercise: validated,
        currentIndex: 0,
        detectionHistory: [],
        perfectNoteStreak: 0,
        holdDuration: 0
      },
      status: 'ready',
      error: undefined,
      analyser: undefined
    })
  },

  initialize: () => {
    if (!get().exercise && allExercises.length > 0) {
      get().loadExercise(allExercises[0])
    }
  },

  start: async () => {
    try {
      const resources = await audioManager.initialize()
      practiceService.start()
      set({ status: 'active', analyser: resources.analyser })
    } catch (err) {
      set({ status: 'error', error: toAppError(err) })
    }
  },

  stop: async () => {
    practiceService.stop()
    await audioManager.cleanup()
    set({ status: 'ready', analyser: undefined })
  },

  reset: () => {
    get().stop()
    set({
      status: 'idle',
      exercise: undefined,
      practiceState: undefined,
      error: undefined,
      analyser: undefined
    })
  },

  internalUpdate: (event) => {
    const { practiceState } = get()
    if (!practiceState) return

    const nextState = reducePracticeEvent(practiceState, event)
    set({ practiceState: nextState })
  },

  dispatch: (event) => {
    switch (event.type) {
      case 'START_SESSION':
        get().start()
        break
      case 'STOP_SESSION':
        get().stop()
        break
      case 'LOAD_EXERCISE':
        get().loadExercise(event.payload.exercise)
        break
      case 'JUMP_TO_NOTE':
        get().internalUpdate({ type: 'JUMP_TO_NOTE', payload: { index: event.payload.index } })
        break
    }
  },

  setLoopRegion: (region) => set({ loopRegion: region }),
  setTempoConfig: (config) => set({ tempoConfig: config }),
  setListenImitateActive: (active) => set({ listenImitateActive: active })
}))

export const useDerivedPracticeState = () => {
  const practiceState = usePracticeStore((s) => s.practiceState)
  if (!practiceState) {
    return {
      status: 'idle',
      progress: 0,
      currentNoteIndex: 0,
      totalNotes: 0,
      targetNote: undefined,
      targetPitchName: undefined,
      lastDetectedNote: undefined
    }
  }

  const totalNotes = practiceState.exercise.notes.length
  const currentNote = practiceState.exercise.notes[practiceState.currentIndex]

  return {
    status: practiceState.status,
    progress: (practiceState.currentIndex / totalNotes) * 100,
    currentNoteIndex: practiceState.currentIndex,
    totalNotes,
    targetNote: currentNote,
    targetPitchName: currentNote ? formatPitchName(currentNote.pitch) : undefined,
    lastDetectedNote: practiceState.detectionHistory[0]
  }
}
