/**
 * PracticeStore
 *
 * Simplified version for MVP. Orchestrates the practice session using PracticeService.
 */

'use client'

import { create } from 'zustand'
import { allExercises } from '@/lib/exercises'
import { type PracticeState, type PracticeEvent, reducePracticeEvent, formatPitchName } from '@/lib/practice-core'
import { type PracticeUIEvent } from '@/lib/domain/practice'
import { toAppError, AppError } from '@/lib/errors/app-error'
import { audioManager } from '@/lib/infrastructure/audio-manager'
import { practiceService } from '@/lib/practice/practice-service'
import { validateExercise } from '@/lib/exercises/validation'
import type { Exercise } from '@/lib/exercises/types'
import { useAnalyticsStore } from './analytics-store'

export interface PracticeStore {
  // Core MVP State
  status: 'idle' | 'ready' | 'active' | 'error'
  exercise: Exercise | undefined
  practiceState: PracticeState | undefined
  error: AppError | undefined
  analyser: AnalyserNode | undefined
  sessionToken: string | undefined
  startTime: number
  correctNotesCount: number

  // UI State
  tempoConfig: { bpm: number; scale: number }
  requiredHoldTime: number

  // UI Stubs (deprecated)
  lastDrillResult: any
  isListeningPhase: boolean
  listenIteration: number
  listenIterationsConfig: number
  liveObservations: any[]
  listenImitateActive: boolean

  // Actions
  loadExercise: (exercise: Exercise) => void
  initialize: () => void
  start: () => Promise<void>
  stop: () => Promise<void>
  reset: () => void
  internalUpdate: (event: PracticeEvent) => void
  dispatch: (event: PracticeUIEvent) => void
  setTempoConfig: (config: { bpm: number; scale: number }) => void
}

export const usePracticeStore = create<PracticeStore>((set, get) => ({
  status: 'idle',
  exercise: undefined,
  practiceState: undefined,
  error: undefined,
  analyser: undefined,
  sessionToken: undefined,
  startTime: 0,
  correctNotesCount: 0,

  tempoConfig: { bpm: 60, scale: 1.0 },
  requiredHoldTime: 300,

  loadExercise: (exercise) => {
    try {
      const validated = validateExercise(exercise)
      set({
        exercise: validated,
        practiceState: {
          status: 'idle',
          exercise: validated,
          currentIndex: 0,
          detectionHistory: [],
          perfectNoteStreak: 0,
          holdDuration: 0,
        },
        status: 'ready',
        error: undefined,
        analyser: undefined,
        correctNotesCount: 0,
      })
    } catch (err) {
      set({
        status: 'error',
        error: toAppError(err),
        exercise: undefined,
        practiceState: undefined,
      })
    }
  },

  initialize: () => {
    if (!get().exercise && allExercises.length > 0) {
      const gMajor = allExercises.find(ex => ex.id === 'g-major-scale-one-octave')
      get().loadExercise(gMajor || allExercises[0])
    }
  },

  start: async () => {
    const sessionToken = Math.random().toString(36).substring(7)
    try {
      const resources = await audioManager.initialize()
      practiceService.start()
      const currentState = get().practiceState
      const newState = currentState ? reducePracticeEvent(currentState, { type: 'START' }) : undefined
      set({
        status: 'active',
        analyser: resources.analyser,
        sessionToken,
        practiceState: newState,
        startTime: Date.now(),
        correctNotesCount: 0,
      })
      if (get().exercise) {
        useAnalyticsStore.getState().startSession({
            exerciseId: get().exercise!.id,
            exerciseName: get().exercise!.name,
            mode: 'practice'
        })
      }
    } catch (err) {
      const appError = toAppError(err)
      set({ status: 'error', error: appError })
      console.error('[PracticeStore] Failed to start session:', appError)
    }
  },

  stop: async () => {
    practiceService.stop()
    await audioManager.cleanup()
    set({
      status: 'ready',
      analyser: undefined,
      sessionToken: undefined,
      practiceState: get().practiceState
        ? {
            ...get().practiceState!,
            status: 'idle',
            holdDuration: 0,
          }
        : undefined,
    })
  },

  reset: () => {
    get().stop()
    set({
      status: 'idle',
      exercise: undefined,
      practiceState: undefined,
      error: undefined,
      analyser: undefined,
      sessionToken: undefined,
    })
  },

  internalUpdate: (event) => {
    const { practiceState, correctNotesCount } = get()
    if (!practiceState) return

    const nextState = reducePracticeEvent(practiceState, event)

    let newCorrectNotesCount = correctNotesCount
    if (event.type === 'NOTE_MATCHED') {
        newCorrectNotesCount++
    }

    set({ practiceState: nextState, correctNotesCount: newCorrectNotesCount })

    if (nextState.status === 'completed' && practiceState.status !== 'completed') {
        const duration = Date.now() - get().startTime
        const totalNotes = nextState.exercise.notes.length
        const accuracy = (newCorrectNotesCount / totalNotes) * 100
        useAnalyticsStore.getState().endSession(accuracy, duration, nextState.exercise.id)
    }
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

  setTempoConfig: (config) => set({ tempoConfig: config }),
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
