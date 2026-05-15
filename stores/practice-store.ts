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
import { audioPlayerService } from '@/lib/audio/audio-player'
import { useProgressStore } from './progress.store'

export interface PracticeStore {
  // Core MVP State
  status: 'idle' | 'ready' | 'active' | 'error'
  exercise: Exercise | undefined
  practiceState: PracticeState | undefined
  error: AppError | undefined
  analyser: AnalyserNode | undefined
  sessionToken: string | undefined

  // UI State
  countdown: number | null
  autoStartEnabled: boolean
  tempoConfig: { bpm: number; scale: number }
  loopRegion: LoopRegion | undefined
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
  setCountdown: (val: number | null) => void

  // Playback
  playNote: (url: string) => void
  playReference: () => Promise<void>
  toggleMetronome: () => void
}

/**
 * Creates a "safe" version of the Zustand `set` function that only applies
 * updates if the session token at the time of the update matches the current token.
 * This prevents race conditions where an old, async process updates the store
 * after a new session has already started.
 */
export function createSafeSet(params: {
  set: (partial: Partial<PracticeStore>) => void
  get: () => PracticeStore
  currentToken: string | undefined
}) {
  const { set, get, currentToken } = params

  return (partial: Partial<PracticeStore>) => {
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

  // UI
  countdown: null,
  autoStartEnabled: false,
  tempoConfig: { bpm: 60, scale: 1.0 },
  loopRegion: undefined,
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
        error: undefined,
      })
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
  setCountdown: (val: number | null) => set({ countdown: val }),

  playNote: (_url) => {
    // In MVP, we might just play a fixed frequency if URL is not ready
    audioPlayerService.playNote(440)
  },
  playReference: async () => {
    const { exercise } = get()
    if (!exercise?.referenceAudioUrl) return

    try {
      await audioPlayerService.playReference(exercise.referenceAudioUrl)
    } catch (err) {
      console.error('[PracticeStore] Failed to play reference:', err)
    }
  },
  toggleMetronome: () => {},
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
      lastDetectedNote: undefined,
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
    lastDetectedNote: practiceState.detectionHistory[0],
  }
}

/**
 * Calculates the allowed cents deviation based on the user's intonation skill.
 *
 * @remarks
 * Uses a linear mapping from skill (0-100) to tolerance (35-10 cents),
 * but enforces a floor of 15 cents for the MVP.
 */
export function calculateCentsTolerance(): number {
  const progress = useProgressStore.getState()
  const skill = progress.intonationSkill ?? 0

  const baseTolerance = 35
  const maxBonus = 25 // can reach 10 cents at 100 skill
  const floor = 15

  const calculated = Math.round(baseTolerance - (skill / 100) * maxBonus)
  return Math.max(floor, calculated)
}
