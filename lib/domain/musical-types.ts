import type { CanonicalAccidental } from '@/lib/domain/musical-domain'
import type { AppError } from '@/lib/errors/app-error'
import type { PitchDetector } from '@/lib/pitch-detector'

/** Represents the base name of a musical pitch. */
export type PitchName = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'

/**
 * Represents a specific note on the musical staff.
 */
export interface Pitch {
  /** The letter name of the pitch. */
  step: PitchName
  /** The octave number (e.g., 4 for Middle C). */
  octave: number
  /**
   * The accidental for the pitch in canonical format.
   * @remarks -1 for flat, 0 for natural, 1 for sharp.
   */
  alter: CanonicalAccidental
}

/**
 * Represents the rhythmic duration of a note in standard musical notation.
 * 1 = Whole, 2 = Half, 4 = Quarter, 8 = Eighth, 16 = 16th, 32 = 32nd.
 */
export type NoteDuration = 1 | 2 | 4 | 8 | 16 | 32

/**
 * Represents a single musical note with its pitch and rhythmic duration.
 */
export interface Note {
  /** The pitch of the note. */
  pitch: Pitch
  /** The duration of the note. */
  duration: NoteDuration
}

// --- Metadata types ---

/** Categories for grouping exercises. */
export type ExerciseCategory = 'Open Strings' | 'Scales' | 'Songs'

/** Difficulty levels for pedagogical progression. */
export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced'

/**
 * Defines the attributes of a musical score.
 * Used for generating MusicXML headers.
 */
export interface ScoreMetadata {
  /** The clef used for the staff. Violin usually uses 'G'. */
  clef: 'G' | 'F' | 'C'
  /** The time signature of the piece. */
  timeSignature: {
    /** Number of beats per measure. */
    beats: number
    /** The note value that represents one beat. */
    beatType: number
  }
  /**
   * The key signature represented as the number of sharps (positive) or flats (negative).
   * Example: 2 for D Major, -1 for F Major, 0 for C Major.
   */
  keySignature: number
}

/**
 * Interface for raw exercise data definitions.
 * This structure is used to define exercises in the category files.
 */
export interface ExerciseData {
  /** Unique identifier for the exercise. */
  id: string
  /** Human-readable name of the exercise. */
  name: string
  /** Brief description of the exercise's goal. */
  description: string
  /** The pedagogical category. */
  category: ExerciseCategory
  /** The intended difficulty level. */
  difficulty: Difficulty
  /** Metadata required for score rendering. */
  scoreMetadata: ScoreMetadata
  /** Ordered array of notes in the exercise. */
  notes: Note[]
}

/**
 * The processed exercise object consumed by the application.
 * Extends `ExerciseData` with the generated MusicXML string.
 */
export interface Exercise extends ExerciseData {
  /** The complete MusicXML representation of the exercise. */
  musicXML: string
}

/**
 * Possible states for the tuner state machine.
 * @remarks Uses a Discriminated Union to ensure that properties like `pitch` or `error`
 * are only accessible when the state machine is in the appropriate phase.
 * Transitions: IDLE -\> INITIALIZING -\> READY -\> LISTENING \<-\> DETECTED
 */
export type TunerState =
  | { kind: 'IDLE' }
  | { kind: 'INITIALIZING'; readonly sessionToken: number }
  | { kind: 'READY'; readonly sessionToken: number }
  | { kind: 'LISTENING'; readonly sessionToken: number }
  | {
      kind: 'DETECTED'
      pitch: number
      note: string
      cents: number
      confidence: number
      readonly sessionToken: number
    }
  | { kind: 'ERROR'; error: AppError }

/** States for microphone permission handling. */
export type PermissionState = 'PROMPT' | 'GRANTED' | 'DENIED'

/**
 * Interface representing the tuner store's state and actions.
 */
export interface TunerStore {
  /**
   * Current state with session tracking.
   *
   * @remarks
   * States with `sessionToken` prevent stale updates from previous sessions.
   * If you call `initialize()` twice, only the latest session updates state.
   */
  state: TunerState

  /** Current microphone permission status. */
  permissionState: PermissionState

  // Domain Logic resources
  /** The pitch detection algorithm instance. */
  detector: PitchDetector | null

  /** List of available audio input devices. */
  devices: MediaDeviceInfo[]

  /** ID of the currently selected audio input device. */
  deviceId: string | null

  /**
   * Input sensitivity (0 to 100).
   * Maps to gain: 0 -\> 0x, 50 -\> 1x, 100 -\> 2x.
   */
  sensitivity: number

  /** Derived getter for the current analyser. */
  analyser: AnalyserNode | null

  /**
   * Initializes audio pipeline with automatic session management.
   *
   * @remarks
   * **Concurrency Safety**:
   * - Multiple calls are safe: previous sessions are automatically invalidated
   * - Uses internal token (exposed in state.sessionToken) to prevent race conditions
   * - If a previous initialization is pending, it will be cancelled
   *
   * **State Transitions**:
   * - IDLE → INITIALIZING → READY (success)
   * - IDLE → INITIALIZING → ERROR (failure)
   *
   * @throws Never throws - errors are captured in state.error
   */
  initialize: () => Promise<void>

  /** Resets the store and attempts to initialize again. */
  retry: () => Promise<void>

  /** Stops all audio processing and releases resources. */
  reset: () => Promise<void>

  /**
   * Updates the detected pitch and note based on new analysis results.
   * @param pitch - The detected frequency in Hz.
   * @param confidence - The confidence of the detection.
   */
  updatePitch: (pitch: number, confidence: number) => void

  /** Transitions state to `LISTENING`. Only valid if state is `READY`. */
  startListening: () => void

  /** Transitions state to `READY` and clears detection data. */
  stopListening: () => void

  /**
   * Enumerates available audio input devices.
   */
  loadDevices: () => Promise<void>

  /** Sets the active microphone device and re-initializes. */
  setDeviceId: (deviceId: string) => Promise<void>

  /**
   * Sets the input sensitivity and updates the gain node immediately.
   * @param sensitivity - New sensitivity value (0-100).
   */
  setSensitivity: (sensitivity: number) => void
}
