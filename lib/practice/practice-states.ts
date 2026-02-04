import { PracticeState } from '../practice-core'
import { AudioLoopPort, PitchDetectionPort } from '../ports/audio.port'
import { Exercise } from '../exercises/types'
import { AppError } from '../errors/app-error'
import { PracticeSessionRunner } from './session-runner'

/**
 * Estados del Practice Store como Discriminated Union
 * Elimina estados inválidos (ej: isStarting=true pero runner=null)
 */
export type PracticeStoreState =
  | IdleState
  | InitializingState
  | ReadyState
  | ActiveState
  | ErrorState

export interface IdleState {
  status: 'idle'
  exercise: Exercise | null
  error: null
}

export interface InitializingState {
  status: 'initializing'
  exercise: Exercise | null
  progress: number // 0-100
  error: null
}

export interface ReadyState {
  status: 'ready'
  audioLoop: AudioLoopPort
  detector: PitchDetectionPort
  exercise: Exercise
  error: null
}

export interface ActiveState {
  status: 'active'
  audioLoop: AudioLoopPort
  detector: PitchDetectionPort
  exercise: Exercise
  runner: PracticeSessionRunner
  practiceState: PracticeState
  abortController: AbortController
  error: null
}

export interface ErrorState {
  status: 'error'
  exercise: Exercise | null
  error: AppError
}

/**
 * Transiciones permitidas
 */
export const transitions = {
  initialize: (exercise: Exercise | null): InitializingState => ({
    status: 'initializing',
    exercise,
    progress: 0,
    error: null,
  }),

  ready: (resources: {
    audioLoop: AudioLoopPort
    detector: PitchDetectionPort
    exercise: Exercise
  }): ReadyState => ({
    status: 'ready',
    ...resources,
    error: null,
  }),

  start: (
    state: ReadyState,
    runner: PracticeSessionRunner,
    abortController: AbortController,
  ): ActiveState => ({
    status: 'active',
    audioLoop: state.audioLoop,
    detector: state.detector,
    exercise: state.exercise,
    runner,
    abortController,
    error: null,
    practiceState: {
      status: 'listening',
      exercise: state.exercise,
      currentIndex: 0,
      detectionHistory: [],
      perfectNoteStreak: 0,
    },
  }),

  stop: (state: ActiveState): ReadyState => ({
    status: 'ready',
    audioLoop: state.audioLoop,
    detector: state.detector,
    exercise: state.exercise
  }),

  error: (error: AppError, exercise: Exercise | null = null): ErrorState => ({
    status: 'error',
    exercise,
    error,
  }),

  reset: (): IdleState => ({
    status: 'idle',
    exercise: null,
    error: null
  }),

  selectExercise: (exercise: Exercise): IdleState => ({
    status: 'idle',
    exercise,
    error: null
  })
}
