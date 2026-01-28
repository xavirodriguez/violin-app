/**
 * PracticeStore
 *
 * This module provides a Zustand store for managing the state of a violin practice session.
 * It handles exercise loading, audio resource management, and the real-time pitch detection loop.
 */

import { create } from 'zustand'
import { type PracticeState, reducePracticeEvent } from '@/lib/practice-core'
import { createRawPitchStream, createPracticeEventPipeline } from '@/lib/note-stream'
import { PitchDetector } from '@/lib/pitch-detector'
import { useAnalyticsStore } from './analytics-store'
import { handlePracticeEvent } from '../practice/practice-event-sink'

import type { Exercise } from '@/lib/exercises/types'

// The AbortController is stored in the closure of the store, not in the Zustand
// state itself, as it's not a piece of data we want to serialize or subscribe to.
let practiceLoopController: AbortController | null = null

/**
 * Interface representing the state and actions of the practice store.
 */
interface PracticeStore {
  practiceState: PracticeState | null
  error: string | null
  currentNoteIndex: number
  targetNote: Exercise['notes'][0] | null
  status: PracticeState['status']
  audioContext: AudioContext | null
  analyser: AnalyserNode | null
  mediaStream: MediaStream | null
  detector: PitchDetector | null
  loadExercise: (exercise: Exercise) => void
  start: () => Promise<void>
  stop: () => Promise<void>
  reset: () => void
}

const getInitialState = (exercise: Exercise): PracticeState => ({
  status: 'idle',
  exercise: exercise,
  currentIndex: 0,
  detectionHistory: [],
})

export const usePracticeStore = create<PracticeStore>((set, get) => ({
  practiceState: null,
  error: null,
  audioContext: null,
  analyser: null,
  mediaStream: null,
  detector: null,

  get currentNoteIndex() {
    return get().practiceState?.currentIndex ?? 0
  },
  get targetNote() {
    const state = get().practiceState
    if (!state) return null
    return state.exercise.notes[state.currentIndex] ?? null
  },
  get status() {
    return get().practiceState?.status ?? 'idle'
  },

  loadExercise: (exercise) => {
    void get().stop()
    set({
      practiceState: getInitialState(exercise),
      error: null,
    })
  },

  start: async () => {
    if (get().practiceState?.status === 'listening') return
    if (!get().practiceState) {
      set({ error: 'No exercise loaded.' })
      return
    }

    await get().stop()

    practiceLoopController = new AbortController()
    const signal = practiceLoopController.signal

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const context = new AudioContext()
      const source = context.createMediaStreamSource(stream)
      const analyser = context.createAnalyser()
      source.connect(analyser)
      const detector = new PitchDetector(context.sampleRate)
      set({ audioContext: context, analyser, mediaStream: stream, detector, error: null })

      const initialState = get().practiceState!
      const listeningState = reducePracticeEvent(initialState, { type: 'START' })
      set({ practiceState: listeningState })

      const sessionStartTime = Date.now()
      useAnalyticsStore
        .getState()
        .startSession(listeningState.exercise.id, listeningState.exercise.name, 'practice')

      const rawPitchStream = createRawPitchStream(analyser, detector, () => !signal.aborted)
      const practiceEventPipeline = createPracticeEventPipeline(
        rawPitchStream,
        () => get().targetNote,
        () => get().currentNoteIndex,
        {
          exercise: listeningState.exercise,
          sessionStartTime,
          bpm: 60,
        },
      )

      ;(async () => {
        const localController = practiceLoopController
        let lastDispatchedNoteIndex = -1
        let currentNoteStartedAt = Date.now()

        for await (const event of practiceEventPipeline) {
          if (signal.aborted || practiceLoopController !== localController) break

          const currentState = get().practiceState
          if (!currentState) continue

          if (event.type === 'NOTE_MATCHED') {
            const noteIndex = currentState.currentIndex
            const target = currentState.exercise.notes[noteIndex]

            if (noteIndex !== lastDispatchedNoteIndex) {
              const timeToComplete = Date.now() - currentNoteStartedAt
              const analytics = useAnalyticsStore.getState()
              const targetPitch = `${target.pitch.step}${target.pitch.alter || ''}${target.pitch.octave}`

              analytics.recordNoteAttempt(noteIndex, targetPitch, 0, true)
              analytics.recordNoteCompletion(noteIndex, timeToComplete, event.payload?.technique)

              lastDispatchedNoteIndex = noteIndex
              currentNoteStartedAt = Date.now()
            }
          }

          handlePracticeEvent(event, { getState: get, setState: set }, () => void get().stop())
        }
      })().catch((err) => {
        const isAbortError = err instanceof Error && err.name === 'AbortError'
        if (!isAbortError) {
          set({
            error: err instanceof Error ? err.message : 'An unexpected error occurred in the practice loop.',
          })
        }
        void get().stop()
      })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Audio hardware error.' })
      void get().stop()
    }
  },

  stop: async () => {
    if (practiceLoopController) {
      practiceLoopController.abort()
      practiceLoopController = null
    }

    const { mediaStream, audioContext } = get()

    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop())
    }

    if (audioContext && audioContext.state !== 'closed') {
      await audioContext.close()
    }

    const currentState = get().practiceState
    if (currentState && currentState.status !== 'idle') {
      set({ practiceState: reducePracticeEvent(currentState, { type: 'STOP' }) })
    }

    set({
      audioContext: null,
      analyser: null,
      mediaStream: null,
      detector: null,
    })
  },

  reset: () => {
    void get().stop()
    set({ practiceState: null, error: null })
  },
}))
