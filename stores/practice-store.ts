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
import { metronomeService } from '@/lib/audio/metronome-service'
import { audioPlayerService } from '@/lib/audio/audio-player'
import { useProgressStore } from './progress.store'

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

  // Epic E-01 Actions
  playNote: (sampleUrl: string) => void
  playReference: () => Promise<void>
  toggleMetronome: () => void
}

export const calculateCentsTolerance = () => {
  const { intonationSkill } = useProgressStore.getState()
  return Math.max(15, Math.round(35 - (intonationSkill / 100) * 25))
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
          metronome: {
            bpm: validated.indicatedBpm || 60,
            active: false,
            soundType: 'wood',
            tempoMultiplier: 1.0
          },
          loopRegion: {
            startNoteIndex: 0,
            endNoteIndex: validated.notes.length - 1,
            isEnabled: false,
            tempoMultiplier: 1.0,
            history: []
          }
        },
        status: 'ready',
        error: undefined,
        analyser: undefined
      })
    } catch (err) {
      set({ status: 'error', error: toAppError(err) })
    }
  },

  initialize: () => {
    if (!get().exercise && allExercises.length > 0) {
      get().loadExercise(allExercises[0])
    }
  },

  start: async () => {
    try {
      const resources = await audioManager.initialize()
      const { practiceState } = get()

      // Metronome sync
      if (practiceState?.metronome?.active) {
        await metronomeService.start(practiceState.metronome)
      }

      practiceService.start()
      set({ status: 'active', analyser: resources.analyser })
    } catch (err) {
      set({ status: 'error', error: toAppError(err) })
    }
  },

  stop: async () => {
    practiceService.stop()
    metronomeService.stop()
    audioPlayerService.stopAll()
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
    set({ practiceState: nextState, loopRegion: nextState.loopRegion })
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
      case 'UPDATE_METRONOME':
        get().internalUpdate({ type: 'UPDATE_METRONOME', payload: event.payload })
        // Sync with service if active
        if (get().status === 'active') {
          if (event.payload.active === false) {
             metronomeService.stop()
          } else if (event.payload.active === true || get().practiceState?.metronome?.active) {
             const config = { ...get().practiceState!.metronome!, ...event.payload }
             metronomeService.start(config)
          }
        }
        break
      case 'UPDATE_LOOP_REGION':
        get().internalUpdate({ type: 'UPDATE_LOOP_REGION', payload: event.payload })
        break
    }
  },

  setLoopRegion: (region) => {
    if (region) {
      get().dispatch({ type: 'UPDATE_LOOP_REGION', payload: region })
    } else {
      get().dispatch({ type: 'UPDATE_LOOP_REGION', payload: { isEnabled: false } })
    }
  },
  setTempoConfig: (config) => {
    get().dispatch({ type: 'UPDATE_METRONOME', payload: { bpm: config.bpm, tempoMultiplier: config.scale } })
    set({ tempoConfig: config })
  },
  setListenImitateActive: (active) => set({ listenImitateActive: active }),

  playNote: (url) => audioPlayerService.playNote(url),
  playReference: async () => {
    const { exercise } = get()
    const url = exercise?.referenceAudioUrl || 'https://example.com/audio.mp3'
    await audioPlayerService.playReference(url)
  },
  toggleMetronome: () => {
    const { practiceState } = get()
    if (!practiceState?.metronome) return
    const active = !practiceState.metronome.active
    get().dispatch({ type: 'UPDATE_METRONOME', payload: { active } })
  }
}))

export const useDerivedPracticeState = () => {
  const statusStore = usePracticeStore((s) => s.status)
  const practiceState = usePracticeStore((s) => s.practiceState)
  if (!practiceState) {
    return {
      status: statusStore,
      progress: 0,
      currentNoteIndex: 0,
      totalNotes: 0,
      targetNote: undefined,
      targetPitchName: undefined,
      lastDetectedNote: undefined,
      metronome: undefined,
      loopRegion: undefined
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
    metronome: practiceState.metronome,
    loopRegion: practiceState.loopRegion
  }
}
