/**
 * PracticeStore
 *
 * Managing the state of a violin practice session, including audio resources
 * and the real-time event pipeline consumption.
 */

'use client'

import { create } from 'zustand'
import { type PracticeState, reducePracticeEvent, formatPitchName } from '@/lib/practice-core'
import { PitchDetector } from '@/lib/pitch-detector'
import { toAppError, AppError } from '@/lib/errors/app-error'
import { audioManager } from '@/lib/infrastructure/audio-manager'
import { useTunerStore } from './tuner-store'
import { calculateLiveObservations } from '@/lib/live-observations'

import type { Exercise } from '@/lib/exercises/types'
import type { PracticeEvent } from '@/lib/practice-core'
import type { Observation } from '@/lib/technique-types'

interface PracticeStore {
  practiceState: PracticeState | null
  analyser: AnalyserNode | null
  detector: PitchDetector | null
  error: AppError | null
  liveObservations: Observation[]
  isStarting: boolean
  sessionId: number

  loadExercise: (exercise: Exercise) => void
  start: () => Promise<void>
  stop: () => void
  reset: () => void
  consumePipelineEvents: (pipeline: AsyncIterable<PracticeEvent>) => Promise<void>
  initializeAudio: () => Promise<void>
}

const getInitialState = (exercise: Exercise): PracticeState => ({
  status: 'idle',
  exercise: exercise,
  currentIndex: 0,
  detectionHistory: [],
})

export const usePracticeStore = create<PracticeStore>((set, get) => ({
  practiceState: null,
  analyser: null,
  detector: null,
  error: null,
  liveObservations: [],
  isStarting: false,
  sessionId: 0,

  loadExercise: (exercise: Exercise) => {
    get().stop()
    set({
      practiceState: getInitialState(exercise),
      error: null,
      liveObservations: [],
    })
  },

  initializeAudio: async () => {
    const tunerState = useTunerStore.getState()
    const { context, analyser } = await audioManager.initialize(tunerState.deviceId ?? undefined)
    const detector = new PitchDetector(context.sampleRate)
    detector.setMaxFrequency(2700)

    set({ analyser, detector })

    // Sync with TunerStore
    useTunerStore.setState({
      detector,
      analyser,
      state: { kind: 'LISTENING', sessionToken: get().sessionId },
    })
  },

  start: async () => {
    if (get().isStarting || get().practiceState?.status === 'listening') return

    set({ isStarting: true, error: null })

    try {
      if (!get().analyser || !get().detector) {
        await get().initializeAudio()
      }

      const currentState = get().practiceState
      if (!currentState) {
        set({
          error: toAppError('No exercise loaded'),
          isStarting: false
        })
        return
      }

      const newState = reducePracticeEvent(currentState, { type: 'START' })
      set({
        practiceState: newState,
        isStarting: false,
        sessionId: get().sessionId + 1
      })
    } catch (error) {
      set({
        error: toAppError(error),
        isStarting: false
      })
    }
  },

  stop: () => {
    audioManager.cleanup().catch(console.error)

    set((state) => ({
      practiceState: state.practiceState
        ? reducePracticeEvent(state.practiceState, { type: 'STOP' })
        : null,
      analyser: null,
      detector: null,
      liveObservations: [],
      sessionId: state.sessionId + 1,
      isStarting: false
    }))
  },

  reset: () => {
    get().stop()
    set({
      practiceState: null,
      error: null,
      liveObservations: [],
    })
  },

  consumePipelineEvents: async (pipeline: AsyncIterable<PracticeEvent>) => {
    const localSessionId = get().sessionId
    try {
      for await (const event of pipeline) {
        // Guard against stale sessions
        if (get().sessionId !== localSessionId) break

        const currentState = get().practiceState
        if (!currentState) break

        // Actualizar estado con reducer puro
        const newState = reducePracticeEvent(currentState, event)

        // NUEVO: Si es NOTE_DETECTED, calcular observaciones en vivo
        if (event.type === 'NOTE_DETECTED') {
          const targetNote = currentState.exercise.notes[currentState.currentIndex]
          if (targetNote) {
            const targetPitchName = formatPitchName(targetNote.pitch)
            const liveObs = calculateLiveObservations(
              newState.detectionHistory, // Use newState history which includes the current detection
              targetPitchName
            )
            set({ liveObservations: liveObs })
          }
        }

        // NUEVO: Si es NOTE_MATCHED, limpiar observaciones en vivo
        if (event.type === 'NOTE_MATCHED') {
          set({ liveObservations: [] })
        }

        set({ practiceState: newState })

        // Side effect: completado
        if (newState.status === 'completed' && currentState.status !== 'completed') {
          console.log('[PracticeStore] Exercise completed!')
        }
      }
    } catch (error) {
      // Only set error if it's not an abort error and session is still active
      if (get().sessionId === localSessionId) {
        const appErr = toAppError(error)
        if (appErr.name !== 'AbortError') {
          set({ error: appErr })
        }
      }
    }
  }
}))
