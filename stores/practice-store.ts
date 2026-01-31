/**
 * PracticeStore
 *
 * Rebuilt to manage interactive practice sessions with real-time audio pipeline integration.
 */

'use client'

import { create } from 'zustand'
import {
  type PracticeState,
  reducePracticeEvent,
  formatPitchName,
  type PracticeEvent
} from '@/lib/practice-core'
import { PitchDetector } from '@/lib/pitch-detector'
import { audioManager } from '@/lib/infrastructure/audio-manager'
import { toAppError, ERROR_CODES } from '@/lib/errors/app-error'
import { calculateLiveObservations } from '@/lib/live-observations'
import { useTunerStore } from './tuner-store'

import type { Exercise } from '@/lib/exercises/types'
import type { Observation } from '@/lib/technique-types'

interface PracticeStore {
  /** Current state of the practice session (status, exercise, progress) */
  practiceState: PracticeState | null
  /** Web Audio AnalyserNode for frequency analysis */
  analyser: AnalyserNode | null
  /** Pitch detection algorithm instance */
  detector: PitchDetector | null
  /** User-facing error message if something fails */
  error: string | null
  /** Real-time technical feedback generated during play */
  liveObservations: Observation[]
  /** Guard flag for the async start sequence */
  isStarting: boolean

  /** Initializes a new practice session with the given exercise */
  loadExercise: (exercise: Exercise) => void
  /** Prepares audio resources and transitions status to 'listening' */
  start: () => Promise<void>
  /** Releases audio resources and stops the session */
  stop: () => void
  /** Fully resets the store to its initial state */
  reset: () => void
  /** Helper to initialize or reuse audio hardware */
  initializeAudio: () => Promise<void>
  /**
   * Main event consumer loop that processes the asynchronous pipeline.
   * Updates state via the pure practice-core reducer and computes live feedback.
   */
  consumePipelineEvents: (pipeline: AsyncIterable<PracticeEvent>) => Promise<void>
}

export const usePracticeStore = create<PracticeStore>((set, get) => ({
  practiceState: null,
  analyser: null,
  detector: null,
  error: null,
  liveObservations: [],
  isStarting: false,

  loadExercise: (exercise) => {
    get().stop()
    set({
      practiceState: {
        status: 'idle',
        exercise,
        currentIndex: 0,
        detectionHistory: [],
      },
      error: null,
      liveObservations: [],
    })
  },

  initializeAudio: async () => {
    try {
      const tunerState = useTunerStore.getState()
      const { context, analyser } = await audioManager.initialize(tunerState.deviceId ?? undefined)
      const detector = new PitchDetector(context.sampleRate)
      set({ analyser, detector })
    } catch (error) {
      throw toAppError(error, ERROR_CODES.MIC_GENERIC_ERROR)
    }
  },

  start: async () => {
    if (get().isStarting) return
    const currentState = get().practiceState
    if (currentState?.status === 'listening') return

    set({ isStarting: true, error: null })

    try {
      if (!get().analyser || !get().detector) {
        await get().initializeAudio()
      }

      if (!get().practiceState) {
        throw new Error('No exercise loaded')
      }

      const newState = reducePracticeEvent(get().practiceState!, { type: 'START' })
      set({ practiceState: newState, isStarting: false })
    } catch (error) {
      set({
        error: toAppError(error).message,
        isStarting: false
      })
      get().stop()
    }
  },

  stop: () => {
    audioManager.cleanup().catch(console.error)
    const currentState = get().practiceState
    if (currentState && currentState.status !== 'idle') {
      set({
        practiceState: reducePracticeEvent(currentState, { type: 'STOP' }),
        liveObservations: [],
      })
    }
    set({
      analyser: null,
      detector: null,
      isStarting: false
    })
  },

  reset: () => {
    get().stop()
    set({ practiceState: null, error: null, liveObservations: [] })
  },

  consumePipelineEvents: async (pipeline) => {
    try {
      for await (const event of pipeline) {
        const currentState = get().practiceState
        if (!currentState || (currentState.status !== 'listening' && currentState.status !== 'validating' && currentState.status !== 'correct')) break

        const newState = reducePracticeEvent(currentState, event)

        if (event.type === 'NOTE_DETECTED') {
          const targetNote = newState.exercise.notes[newState.currentIndex]
          if (targetNote) {
            const targetPitchName = formatPitchName(targetNote.pitch)
            // We use newState.detectionHistory to analyze the most recent window
            const liveObs = calculateLiveObservations(
              [...newState.detectionHistory],
              targetPitchName
            )
            set({ liveObservations: liveObs })
          }
        }

        if (event.type === 'NOTE_MATCHED') {
          set({ liveObservations: [] })
        }

        set({ practiceState: newState })
      }
    } catch (error) {
      const appError = toAppError(error)
      if (appError.message !== 'Aborted') {
        set({ error: appError.message })
      }
    }
  },
}))
