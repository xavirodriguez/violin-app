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
import { useProgressStore } from './progress.store'

export function calculateCentsTolerance(): number {
  const intonationSkill = useProgressStore.getState().intonationSkill
  const base = 35
  const skillBonus = (intonationSkill / 100) * 25
  return Math.max(15, Math.round(base - skillBonus))
}

export interface PracticeStore {
  // Core MVP State
  status: 'idle' | 'ready' | 'active' | 'error'
  exercise: Exercise | undefined
  practiceState: PracticeState | undefined
  error: AppError | undefined
  analyser: AnalyserNode | undefined
  sessionToken: string | undefined

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
  requiredHoldTime: number

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
  consumePipelineEvents: (pipeline: AsyncIterable<PracticeEvent>) => Promise<void>
}

/**
 * Creates a "safe" version of the Zustand `set` function that only applies
 * updates if the session token at the time of the update matches the current token.
 * This prevents race conditions where an old, async process updates the store
 * after a new session has already started.
 */
export function createSafeSet(params: {
  set: (partial: any) => void
  get: () => any
  currentToken: string | undefined
}) {
  const { set, get, currentToken } = params

  return (partial: any) => {
    const storeToken = get().sessionToken
    if (currentToken !== storeToken) {
      return
    }
    set(partial)
  }
}

export const usePracticeStore = create<PracticeStore>((set, get) => ({
  status: 'idle',
  exercise: undefined,
  practiceState: undefined,
  error: undefined,
  analyser: undefined,
  sessionToken: undefined,

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
  requiredHoldTime: 300, // Reduced from 500ms in service for better responsiveness

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
      get().loadExercise(allExercises[0])
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
      })
    } catch (err) {
      set({ status: 'error', error: toAppError(err) })
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
  setListenImitateActive: (active) => set({ listenImitateActive: active }),

  consumePipelineEvents: async (pipeline) => {
    const currentToken = get().sessionToken
    for await (const event of pipeline) {
      if (get().sessionToken !== currentToken) break
      get().internalUpdate(event)

      // Handle live observations for MVP compatibility
      if (event.type === 'NOTE_DETECTED') {
        const { practiceState } = get()
        if (practiceState && practiceState.detectionHistory.length >= 5) {
          const recent = practiceState.detectionHistory.slice(0, 5)
          const allSharp = recent.every((d) => d.cents > 15)
          const allFlat = recent.every((d) => d.cents < -15)

          if (allSharp) {
            set({
              liveObservations: [
                {
                  type: 'intonation',
                  message: 'Consistent sharp pitch. Try loosening your finger pressure.',
                  severity: 2,
                  tip: 'Loosen finger pressure',
                  confidence: 1.0 as any,
                },
              ],
            })
          } else if (allFlat) {
            set({
              liveObservations: [
                {
                  type: 'intonation',
                  message: 'Consistent flat pitch. Try pressing a bit firmer or checking your string.',
                  severity: 2,
                  tip: 'Check string or press firmer',
                  confidence: 1.0 as any,
                },
              ],
            })
          } else {
            set({ liveObservations: [] })
          }
        }
      } else if (event.type === 'NOTE_MATCHED') {
        set({ liveObservations: [] })
      }
    }
  },
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
