'use client'

import { create } from 'zustand'
import {
  type PracticeState,
  reducePracticeEvent,
  formatPitchName,
  type PracticeEvent
} from '@/lib/practice-core'
import { PitchDetector } from '@/lib/pitch-detector'
import { toAppError } from '@/lib/errors/app-error'
import { audioManager } from '@/lib/infrastructure/audio-manager'
import { calculateLiveObservations } from '@/lib/live-observations'
import type { Exercise } from '@/lib/exercises/types'
import type { Observation } from '@/lib/technique-types'

interface PracticeStore {
  practiceState: PracticeState | null
  analyser: AnalyserNode | null
  detector: PitchDetector | null
  error: string | null
  liveObservations: Observation[]

  loadExercise: (exercise: Exercise) => void
  start: () => Promise<void>
  stop: () => void
  reset: () => void
  consumePipelineEvents: (pipeline: AsyncIterable<PracticeEvent>) => Promise<void>
  initializeAudio: () => Promise<void>
}

export const usePracticeStore = create<PracticeStore>((set, get) => ({
  practiceState: null,
  analyser: null,
  detector: null,
  error: null,
  liveObservations: [],

  loadExercise: (exercise) => {
    set({
      practiceState: {
        status: 'idle',
        exercise,
        currentIndex: 0,
        detectionHistory: [],
        perfectNoteStreak: 0,
      },
      error: null,
      liveObservations: [],
    })
  },

  initializeAudio: async () => {
    try {
      const resources = await audioManager.initialize()
      set({
        analyser: resources.analyser,
        detector: new PitchDetector(resources.context.sampleRate),
      })
    } catch (error) {
      set({ error: toAppError(error).message })
    }
  },

  start: async () => {
    // 1. Inicializar audio (si no existe)
    if (!get().analyser || !get().detector) {
      await get().initializeAudio()
    }

    const currentState = get().practiceState
    if (!currentState) {
      set({ error: 'No exercise loaded' })
      return
    }

    // 2. Despachar evento START al reducer
    const newState = reducePracticeEvent(currentState, { type: 'START' })
    set({ practiceState: newState })

    // 3. CRÍTICO: Iniciar consumo de eventos
    // (esto se hace en el useEffect de practice-mode.tsx)
  },

  stop: () => {
    const currentState = get().practiceState
    if (currentState) {
      const newState = reducePracticeEvent(currentState, { type: 'STOP' })
      set({ practiceState: newState })
    }
  },

  reset: () => {
    set({
      practiceState: null,
      error: null,
      liveObservations: [],
    })
  },

  consumePipelineEvents: async (pipeline) => {
    try {
      for await (const event of pipeline) {
        const currentState = get().practiceState
        if (!currentState) break

        // Actualizar estado con reducer puro
        const newState = reducePracticeEvent(currentState, event)

        // NUEVO: Si es NOTE_DETECTED, calcular observaciones en vivo
        if (event.type === 'NOTE_DETECTED') {
          const targetNote = currentState.exercise.notes[currentState.currentIndex]
          const targetPitchName = formatPitchName(targetNote.pitch)

          const liveObs = calculateLiveObservations(
            newState.detectionHistory,
            targetPitchName
          )
          set({ liveObservations: liveObs })
        }

        // NUEVO: Si es NOTE_MATCHED, limpiar observaciones en vivo
        if (event.type === 'NOTE_MATCHED') {
          set({ liveObservations: [] })
        }

        set({ practiceState: newState })

        // Side effect: completado
        if (newState.status === 'completed' && currentState.status !== 'completed') {
          // Opcional: analytics, confetti, etc.
          console.log('Exercise completed!')
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return
      set({ error: toAppError(error).message })
    }
  },
}))
