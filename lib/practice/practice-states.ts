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
}

export interface ReadyState {
  status: 'ready'
  audioLoop: AudioLoopPort
  detector: PitchDetectionPort
  exercise: Exercise
}

export interface ActiveState {
  status: 'active'
  audioLoop: AudioLoopPort
  detector: PitchDetectionPort
  exercise: Exercise
  runner: PracticeSessionRunner
  practiceState: PracticeState
}

export interface ErrorState {
  status: 'error'
  error: AppError
}

/**
 * Transiciones permitidas
 */
export const transitions = {
  initialize: (exercise: Exercise | null): InitializingState => ({
    status: 'initializing',
    exercise,
    progress: 0
  }),

  ready: (resources: {
    audioLoop: AudioLoopPort
    detector: PitchDetectionPort
    exercise: Exercise
  }): ReadyState => ({
    status: 'ready',
    ...resources
  }),

  start: (state: ReadyState, runner: PracticeSessionRunner): ActiveState => ({
    status: 'active',
    audioLoop: state.audioLoop,
    detector: state.detector,
    exercise: state.exercise,
    runner,
    practiceState: {
      status: 'listening',
      exercise: state.exercise,
      currentIndex: 0,
      detectionHistory: [],
      perfectNoteStreak: 0
    }
  }),

  stop: (state: ActiveState): ReadyState => ({
    status: 'ready',
    audioLoop: state.audioLoop,
    detector: state.detector,
    exercise: state.exercise
  }),

  error: (error: AppError): ErrorState => ({
    status: 'error',
    error
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
