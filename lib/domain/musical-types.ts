import type { CanonicalAccidental } from '@/lib/domain/musical-domain'
import type { AppError } from '@/lib/errors/app-error'
import type { PitchDetector } from '@/lib/pitch-detector'

/**
 * Represents the base name of a musical pitch (the white keys on a piano).
 *
 * @remarks
 * Following the scientific pitch notation standard letter names.
 *
 * @public
 */
export type PitchName = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'

/**
 * Represents a specific pitch on the musical staff, including its octave and accidental.
 *
 * @remarks
 * Uses scientific pitch notation (SPN) for octave numbering.
 *
 * @public
 */
export interface Pitch {
  /** The letter name of the pitch (e.g., 'A', 'C'). */
  step: PitchName
  /**
   * The octave number in scientific pitch notation (e.g., 4 for Middle C).
   *
   * **Violin Standard Tuning**:
   * - G3 (G string)
   * - D4 (D string)
   * - A4 (A string)
   * - E5 (E string)
   */
  octave: number
  /**
   * The accidental for the pitch.
   *
   * @remarks
   * Expressed as a {@link CanonicalAccidental}: -1 for flat, 0 for natural, 1 for sharp.
   */
  alter: CanonicalAccidental
}

/**
 * Represents the rhythmic duration of a note relative to a whole note.
 *
 * @remarks
 * Expressed as the denominator of the division of a whole note.
 *
 * **Standard Mappings**:
 * - `1`: Whole note (4 beats in 4/4)
 * - `2`: Half note (2 beats)
 * - `4`: Quarter note (1 beat)
 * - `6`: Dotted quarter note (1.5 beats)
 * - `8`: Eighth note (0.5 beats)
 * - `16`: Sixteenth note (0.25 beats)
 * - `32`: Thirty-second note (0.125 beats)
 *
 * @public
 */
export type NoteDuration = 1 | 2 | 4 | 6 | 8 | 16 | 32

/**
 * Represents a single musical note, combining pitch, duration, and pedagogical metadata.
 *
 * @public
 */
export interface Note {
  /** The scientific pitch definition of the note. */
  pitch: Pitch
  /** The rhythmic duration value. */
  duration: NoteDuration
  /** Optional pedagogical annotations to assist the student during practice. */
  annotations?: {
    /** Suggested finger number (1-4). 0 or undefined for open strings. */
    fingerNumber?: 1 | 2 | 3 | 4
    /** Suggested bowing direction ('up' for push, 'down' for pull). */
    bowDirection?: 'up' | 'down'
    /** Whether to show a visual warning flag (e.g., for difficult shifts or accidentals). */
    warningFlag?: boolean
  }
}

// --- Metadata types ---

/**
 * High-level categories for grouping musical exercises in the library.
 *
 * @public
 */
export type ExerciseCategory = 'Open Strings' | 'Scales' | 'Songs'

/**
 * Difficulty levels used for pedagogical progression and recommendations.
 *
 * @public
 */
export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced'

/**
 * Metadata defining the musical properties required for score rendering.
 *
 * @remarks
 * This information is used by the MusicXML engine to create valid headers
 * and staff definitions compatible with OpenSheetMusicDisplay (OSMD).
 *
 * @public
 */
export interface ScoreMetadata {
  /** The clef used for the staff. Violin always uses 'G' (treble clef). */
  clef: 'G' | 'F' | 'C'
  /** The time signature of the piece. */
  timeSignature: {
    /** Number of beats per measure (numerator). */
    beats: number
    /** The note value that represents one beat (denominator). */
    beatType: number
  }
  /**
   * The key signature, represented as the number of sharps (positive) or flats (negative) in the circle of fifths.
   *
   * @example
   * - `2`: D Major / B Minor (F#, C#)
   * - `-1`: F Major / D Minor (Bb)
   * - `0`: C Major / A Minor
   */
  keySignature: number
}

/**
 * Raw definition of an exercise, containing structured musical data.
 *
 * @remarks
 * This interface represents the "blueprint" of an exercise before it's converted
 * to visual MusicXML for rendering.
 *
 * @public
 */
export interface ExerciseData {
  /** Unique identifier for the exercise (UUID). */
  id: string
  /** Human-readable display name. */
  name: string
  /** Detailed description of the exercise's objective and technical focus. */
  description: string
  /** The pedagogical category it belongs to (e.g., "Scales"). */
  category: ExerciseCategory
  /** The intended difficulty level for student progression. */
  difficulty: Difficulty
  /** Metadata required for rendering the musical score (clef, time signature, etc.). */
  scoreMetadata: ScoreMetadata
  /** Ordered array of notes that make up the exercise. */
  notes: Note[]
  /** List of technical skills the student will improve (e.g., "Third Position"). */
  technicalGoals: string[]
  /** Human-readable estimated time to complete (e.g., "5 mins"). */
  estimatedDuration: string
  /** The primary technique focus (e.g., "Legato", "Staccato", "Intonation"). */
  technicalTechnique: string
  /** Whether this exercise is highlighted as a recommendation in the UI. */
  recommended?: boolean
}

/**
 * A fully-realized exercise including its visual MusicXML representation.
 *
 * @remarks
 * This is the final object used by the `PracticeStore` and `SheetMusic` components.
 *
 * @public
 */
export interface Exercise extends ExerciseData {
  /** The complete, generated MusicXML string for the exercise. */
  musicXML: string
}

/**
 * Possible states for the Standalone Tuner.
 *
 * @remarks
 * Implements a Discriminated Union pattern to handle the complex lifecycle
 * of microphone acquisition and real-time pitch detection.
 *
 * **Lifecycle**:
 * 1. `IDLE`: Waiting for initialization.
 * 2. `INITIALIZING`: Requesting microphone access.
 * 3. `READY`: Audio pipeline is warm; listening.
 * 4. `DETECTED`: A stable pitch has been found.
 * 5. `ERROR`: Hardware or permission failure.
 *
 * @public
 */
export type TunerState =
  | {
      /** Initial state before any action is taken. */
      kind: 'IDLE'
    }
  | {
      /** State while acquiring microphone and setting up audio graph. */
      kind: 'INITIALIZING'
      /** Unique token for the current initialization attempt to prevent race conditions. */
      readonly sessionToken: number | string
    }
  | {
      /** State when audio is ready but no analysis results have been received. */
      kind: 'READY'
      /** Unique token for the current session. */
      readonly sessionToken: number | string
    }
  | {
      /** State when the engine is actively listening but signal strength/confidence is low. */
      kind: 'LISTENING'
      /** Unique token for the current session. */
      readonly sessionToken: number | string
    }
  | {
      /** State when a clear, confident pitch has been detected and mapped to a note. */
      kind: 'DETECTED'
      /** Detected frequency in Hz. */
      pitch: number
      /** Scientific pitch name (e.g., "A4"). */
      note: string
      /** Deviation in cents from the ideal frequency of the note. */
      cents: number
      /** Detection confidence (0.0 to 1.0). */
      confidence: number
      /** Unique token for the current session. */
      readonly sessionToken: number | string
    }
  | {
      /** Terminal or recoverable error state (e.g., permission denied). */
      kind: 'ERROR'
      /** Details of the application-level error encountered. */
      error: AppError
    }

/**
 * States for microphone permission handling.
 *
 * @remarks
 * - `PROMPT`: Browser hasn't asked for permissions yet.
 * - `GRANTED`: Access allowed.
 * - `DENIED`: Access blocked by user or system.
 *
 * @public
 */
export type PermissionState = 'PROMPT' | 'GRANTED' | 'DENIED'

/**
 * Interface representing the tuner store's state and available actions.
 *
 * @remarks
 * This store manages the entire lifecycle of the standalone violin tuner.
 *
 * @public
 */
export interface TunerStore {
  /**
   * Current reactive state with session tracking.
   *
   * @remarks
   * States with `sessionToken` prevent stale updates from previous sessions
   * during asynchronous initialization.
   */
  state: TunerState

  /**
   * User's current microphone permission status.
   */
  permissionState: PermissionState

  /**
   * The active pitch detection algorithm instance.
   */
  detector: PitchDetector | null

  /**
   * List of audio input devices detected on the system.
   */
  devices: MediaDeviceInfo[]

  /**
   * ID of the device currently used for input. `null` uses the default system device.
   */
  deviceId: string | null

  /**
   * Sensitivity of the input (0-100).
   *
   * @remarks
   * Maps to internal gain: `0 -\> 0x`, `50 -\> 1x`, `100 -\> 2x`.
   */
  sensitivity: number

  /**
   * Web Audio AnalyserNode for real-time visualization (e.g., waveforms).
   */
  analyser: AnalyserNode | null

  /**
   * Initializes the audio pipeline and requests hardware permissions.
   *
   * @remarks
   * **Concurrency Safety**:
   * - Multiple calls are idempotent: previous sessions are automatically invalidated.
   * - Uses an internal `initToken` to ensure only the latest attempt updates the state.
   *
   * **Transitions**:
   * - `IDLE` → `INITIALIZING` → `READY` (on success)
   * - `IDLE` → `INITIALIZING` → `ERROR` (on failure)
   *
   * @returns A promise that resolves when initialization is complete.
   */
  initialize: () => Promise<void>

  /**
   * Resets the current state and attempts to re-initialize the audio hardware.
   *
   * @returns A promise that resolves when re-initialization is complete.
   */
  retry: () => Promise<void>

  /**
   * Stops the tuner, invalidates pending sessions, and releases hardware resources.
   *
   * @returns A promise that resolves when cleanup is complete.
   */
  reset: () => Promise<void>

  /**
   * Processes a raw frequency/confidence pair from the detector and updates the store state.
   *
   * @remarks
   * Implementation should include signal thresholding to filter out ambient noise.
   *
   * @param pitch - Detected frequency in Hz.
   * @param confidence - Detection confidence (0.0 to 1.0).
   */
  updatePitch: (pitch: number, confidence: number) => void

  /**
   * Transitions the tuner into the 'LISTENING' state.
   */
  startListening: () => void

  /**
   * Transitions the tuner back to 'READY', pausing input analysis.
   */
  stopListening: () => void

  /**
   * Refreshes the list of available audio input hardware from the browser.
   *
   * @returns A promise that resolves when the device list is updated.
   */
  loadDevices: () => Promise<void>

  /**
   * Switches the active input source to a different device.
   *
   * @param deviceId - Unique ID of the new device.
   * @returns A promise that resolves when the switch is complete.
   */
  setDeviceId: (deviceId: string) => Promise<void>

  /**
   * Adjusts the detector's input gain to improve sensitivity in quiet or noisy environments.
   *
   * @param sensitivity - Value from 0 to 100.
   */
  setSensitivity: (sensitivity: number) => void
}
