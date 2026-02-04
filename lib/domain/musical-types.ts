import type { CanonicalAccidental } from '@/lib/domain/musical-domain'
import type { AppError } from '@/lib/errors/app-error'
import type { PitchDetector } from '@/lib/pitch-detector'

/**
 * Represents the base name of a musical pitch (the white keys on a piano).
 *
 * @public
 */
export type PitchName = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'

/**
 * Represents a specific pitch on the musical staff, including its octave and accidental.
 *
 * @public
 */
export interface Pitch {
  /** The letter name of the pitch. */
  step: PitchName
  /** The octave number in scientific pitch notation (e.g., 4 for Middle C). */
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
 * Values:
 * - 1: Whole note
 * - 2: Half note
 * - 4: Quarter note
 * - 6: Dotted quarter note (specific to this engine's mapping)
 * - 8: Eighth note
 * - 16: Sixteenth note
 * - 32: Thirty-second note
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
  /** The pitch of the note. */
  pitch: Pitch
  /** The rhythmic duration of the note. */
  duration: NoteDuration
  /** Optional pedagogical annotations to assist the student. */
  annotations?: {
    /** Suggested finger number (1-4). 0 or undefined for open strings. */
    fingerNumber?: 1 | 2 | 3 | 4
    /** Suggested bowing direction. */
    bowDirection?: 'up' | 'down'
    /** Whether to show a visual warning flag for this note. */
    warningFlag?: boolean
  }
}

// --- Metadata types ---

/**
 * High-level categories for grouping musical exercises.
 *
 * @public
 */
export type ExerciseCategory = 'Open Strings' | 'Scales' | 'Songs'

/**
 * Difficulty levels for pedagogical progression.
 *
 * @public
 */
export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced'

/**
 * Metadata defining the musical properties of a score.
 *
 * @remarks
 * This information is used by the MusicXML generator to create valid headers
 * and staff definitions.
 *
 * @public
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
   * The key signature, represented as the number of sharps (positive) or flats (negative).
   *
   * @example
   * - 2: D Major (F#, C#)
   * - -1: F Major (Bb)
   * - 0: C Major
   */
  keySignature: number
}

/**
 * Raw definition of an exercise, before processing into MusicXML.
 *
 * @public
 */
export interface ExerciseData {
  /** Unique identifier for the exercise. */
  id: string
  /** Human-readable display name. */
  name: string
  /** Detailed description of the exercise's objective. */
  description: string
  /** The pedagogical category it belongs to. */
  category: ExerciseCategory
  /** The intended difficulty level. */
  difficulty: Difficulty
  /** Metadata required for rendering the musical score. */
  scoreMetadata: ScoreMetadata
  /** Ordered array of notes that make up the exercise. */
  notes: Note[]
  /** List of technical skills the student will improve. */
  technicalGoals: string[]
  /** Human-readable estimated time to complete. */
  estimatedDuration: string
  /** The primary technique focus (e.g., "Legato", "Intonation"). */
  technicalTechnique: string
  /** Whether this exercise is highlighted as a recommendation. */
  recommended?: boolean
}

/**
 * A fully-realized exercise including its visual representation.
 *
 * @public
 */
export interface Exercise extends ExerciseData {
  /** The complete MusicXML representation of the exercise. */
  musicXML: string
}

/**
 * Possible states for the Standalone Tuner.
 *
 * @remarks
 * Implements a Discriminated Union to ensure that state-specific data
 * (like detected frequency or errors) is only accessible when valid.
 *
 * @public
 */
export type TunerState =
  | {
      /** Initial state before any action is taken. */
      kind: 'IDLE'
    }
  | {
      /** State while acquiring microphone and setting up audio. */
      kind: 'INITIALIZING'
      /** Unique token for the current initialization attempt. */
      readonly sessionToken: number
    }
  | {
      /** State when audio is ready but analysis hasn't started. */
      kind: 'READY'
      /** Unique token for the current session. */
      readonly sessionToken: number
    }
  | {
      /** State when the engine is actively pulling audio but no clear pitch is found. */
      kind: 'LISTENING'
      /** Unique token for the current session. */
      readonly sessionToken: number
    }
  | {
      /** State when a clear, confident pitch has been detected. */
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
      readonly sessionToken: number
    }
  | {
      /** Terminal or recoverable error state. */
      kind: 'ERROR'
      /** Details of the error encountered. */
      error: AppError
    }

/**
 * States for microphone permission handling.
 *
 * @public
 */
export type PermissionState = 'PROMPT' | 'GRANTED' | 'DENIED'

/**
 * Interface representing the tuner store's state and available actions.
 *
 * @public
 */
export interface TunerStore {
  /**
   * The current state of the tuner machine.
   */
  state: TunerState

  /**
   * User's microphone permission status.
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
   * ID of the device currently used for input.
   */
  deviceId: string | null

  /**
   * Sensitivity of the input (0-100).
   * Maps to gain: 0 -> 0x, 50 -> 1x, 100 -> 2x.
   */
  sensitivity: number

  /**
   * AnalyserNode for visualization or external processing.
   */
  analyser: AnalyserNode | null

  /**
   * Initializes the audio pipeline.
   *
   * @remarks
   * This is a complex asynchronous operation that handles concurrency via session tokens.
   */
  initialize: () => Promise<void>

  /**
   * Resets and re-initializes the tuner.
   */
  retry: () => Promise<void>

  /**
   * Stops the tuner and releases hardware resources.
   */
  reset: () => Promise<void>

  /**
   * Feeds raw analysis data into the store to update the detected note.
   *
   * @param pitch - Detected frequency.
   * @param confidence - Detection confidence.
   */
  updatePitch: (pitch: number, confidence: number) => void

  /**
   * Starts the high-frequency analysis loop.
   */
  startListening: () => void

  /**
   * Stops the analysis loop while keeping audio resources alive.
   */
  stopListening: () => void

  /**
   * Refreshes the list of available audio devices.
   */
  loadDevices: () => Promise<void>

  /**
   * Switches to a different input device.
   *
   * @param deviceId - ID of the new device.
   */
  setDeviceId: (deviceId: string) => Promise<void>

  /**
   * Adjusts the detector's input gain.
   *
   * @param sensitivity - Value from 0 to 100.
   */
  setSensitivity: (sensitivity: number) => void
}
