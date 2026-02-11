import type { CanonicalAccidental } from '@/lib/domain/musical-domain';
import type { AppError } from '@/lib/errors/app-error';
import type { PitchDetector } from '@/lib/pitch-detector';
/**
 * Represents the base name of a musical pitch (the white keys on a piano).
 *
 * @public
 */
export type PitchName = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
/**
 * Represents a specific pitch on the musical staff, including its octave and accidental.
 *
 * @public
 */
export interface Pitch {
    /** The letter name of the pitch (e.g., 'A', 'C'). */
    step: PitchName;
    /**
     * The octave number in scientific pitch notation (e.g., 4 for Middle C).
     * Violin strings start at G3 (G string), D4 (D string), A4 (A string), E5 (E string).
     */
    octave: number;
    /**
     * The accidental for the pitch.
     *
     * @remarks
     * Expressed as a {@link CanonicalAccidental}: -1 for flat, 0 for natural, 1 for sharp.
     */
    alter: CanonicalAccidental;
}
/**
 * Represents the rhythmic duration of a note relative to a whole note.
 *
 * @remarks
 * Values:
 * - `1`: Whole note (4 beats)
 * - `2`: Half note (2 beats)
 * - `4`: Quarter note (1 beat)
 * - `6`: Dotted quarter note (1.5 beats)
 * - `8`: Eighth note (0.5 beats)
 * - `16`: Sixteenth note (0.25 beats)
 * - `32`: Thirty-second note (0.125 beats)
 *
 * @public
 */
export type NoteDuration = 1 | 2 | 4 | 6 | 8 | 16 | 32;
/**
 * Represents a single musical note, combining pitch, duration, and pedagogical metadata.
 *
 * @public
 */
export interface Note {
    /** The scientific pitch definition of the note. */
    pitch: Pitch;
    /** The rhythmic duration value. */
    duration: NoteDuration;
    /** Optional pedagogical annotations to assist the student during practice. */
    annotations?: {
        /** Suggested finger number (1-4). 0 or undefined for open strings. */
        fingerNumber?: 1 | 2 | 3 | 4;
        /** Suggested bowing direction ('up' for push, 'down' for pull). */
        bowDirection?: 'up' | 'down';
        /** Whether to show a visual warning flag (e.g., for difficult shifts or accidentals). */
        warningFlag?: boolean;
    };
}
/**
 * High-level categories for grouping musical exercises in the library.
 *
 * @public
 */
export type ExerciseCategory = 'Open Strings' | 'Scales' | 'Songs';
/**
 * Difficulty levels used for pedagogical progression and recommendations.
 *
 * @public
 */
export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';
/**
 * Metadata defining the musical properties required for score rendering.
 *
 * @remarks
 * This information is used by the MusicXML engine to create valid headers
 * and staff definitions compatible with OSMD.
 *
 * @public
 */
export interface ScoreMetadata {
    /** The clef used for the staff. Violin always uses 'G' (treble clef). */
    clef: 'G' | 'F' | 'C';
    /** The time signature of the piece. */
    timeSignature: {
        /** Number of beats per measure (numerator). */
        beats: number;
        /** The note value that represents one beat (denominator). */
        beatType: number;
    };
    /**
     * The key signature, represented as the number of sharps (positive) or flats (negative).
     *
     * @example
     * - `2`: D Major / B Minor (F#, C#)
     * - `-1`: F Major / D Minor (Bb)
     * - `0`: C Major / A Minor
     */
    keySignature: number;
}
/**
 * Raw definition of an exercise, containing structured musical data.
 *
 * @public
 */
export interface ExerciseData {
    /** Unique identifier for the exercise (UUID). */
    id: string;
    /** Human-readable display name. */
    name: string;
    /** Detailed description of the exercise's objective and technical focus. */
    description: string;
    /** The pedagogical category it belongs to. */
    category: ExerciseCategory;
    /** The intended difficulty level. */
    difficulty: Difficulty;
    /** Metadata required for rendering the musical score. */
    scoreMetadata: ScoreMetadata;
    /** Ordered array of notes that make up the exercise. */
    notes: Note[];
    /** List of technical skills the student will improve (e.g., "Third Position"). */
    technicalGoals: string[];
    /** Human-readable estimated time to complete (e.g., "5 mins"). */
    estimatedDuration: string;
    /** The primary technique focus (e.g., "Legato", "Staccato", "Intonation"). */
    technicalTechnique: string;
    /** Whether this exercise is highlighted as a recommendation in the UI. */
    recommended?: boolean;
}
/**
 * A fully-realized exercise including its visual MusicXML representation.
 *
 * @public
 */
export interface Exercise extends ExerciseData {
    /** The complete, generated MusicXML string for the exercise. */
    musicXML: string;
}
/**
 * Possible states for the Standalone Tuner.
 *
 * @remarks
 * Implements a Discriminated Union pattern to handle the complex lifecycle
 * of microphone acquisition and pitch detection.
 *
 * @public
 */
export type TunerState = {
    /** Initial state before any action is taken. */
    kind: 'IDLE';
} | {
    /** State while acquiring microphone and setting up audio. */
    kind: 'INITIALIZING';
    /** Unique token for the current initialization attempt. */
    readonly sessionToken: number | string;
} | {
    /** State when audio is ready but analysis hasn't started. */
    kind: 'READY';
    /** Unique token for the current session. */
    readonly sessionToken: number | string;
} | {
    /** State when the engine is actively pulling audio but no clear pitch is found. */
    kind: 'LISTENING';
    /** Unique token for the current session. */
    readonly sessionToken: number | string;
} | {
    /** State when a clear, confident pitch has been detected. */
    kind: 'DETECTED';
    /** Detected frequency in Hz. */
    pitch: number;
    /** Scientific pitch name (e.g., "A4"). */
    note: string;
    /** Deviation in cents from the ideal frequency of the note. */
    cents: number;
    /** Detection confidence (0.0 to 1.0). */
    confidence: number;
    /** Unique token for the current session. */
    readonly sessionToken: number | string;
} | {
    /** Terminal or recoverable error state (e.g., permission denied). */
    kind: 'ERROR';
    /** Details of the error encountered. */
    error: AppError;
};
/**
 * States for microphone permission handling.
 * @public
 */
export type PermissionState = 'PROMPT' | 'GRANTED' | 'DENIED';
/**
 * Interface representing the tuner store's state and available actions.
 *
 * @public
 */
export interface TunerStore {
    /**
     * Current state with session tracking.
     *
     * @remarks
     * States with `sessionToken` prevent stale updates from previous sessions.
     * If you call `initialize()` twice, only the latest session updates state.
     */
    state: TunerState;
    /**
     * User's microphone permission status.
     */
    permissionState: PermissionState;
    /**
     * The active pitch detection algorithm instance.
     */
    detector: PitchDetector | null;
    /**
     * List of audio input devices detected on the system.
     */
    devices: MediaDeviceInfo[];
    /**
     * ID of the device currently used for input.
     */
    deviceId: string | null;
    /**
     * Sensitivity of the input (0-100).
     *
     * @remarks
     * Maps to internal gain: `0 -> 0x`, `50 -> 1x`, `100 -> 2x`.
     */
    sensitivity: number;
    /**
     * AnalyserNode for real-time visualization.
     */
    analyser: AnalyserNode | null;
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
    initialize: () => Promise<void>;
    /**
     * Resets and re-initializes the tuner.
     */
    retry: () => Promise<void>;
    /**
     * Stops the tuner and releases hardware resources.
     */
    reset: () => Promise<void>;
    /**
     * Feeds raw analysis data into the store to update the detected note.
     *
     * @param pitch - Detected frequency in Hz.
     * @param confidence - Detection confidence (0.0 to 1.0).
     */
    updatePitch: (pitch: number, confidence: number) => void;
    /**
     * Starts the high-frequency analysis loop.
     */
    startListening: () => void;
    /**
     * Stops the analysis loop while keeping audio resources alive.
     */
    stopListening: () => void;
    /**
     * Refreshes the list of available audio input hardware.
     */
    loadDevices: () => Promise<void>;
    /**
     * Switches to a different input device.
     *
     * @param deviceId - ID of the new device to use.
     */
    setDeviceId: (deviceId: string) => Promise<void>;
    /**
     * Adjusts the detector's input gain/sensitivity.
     *
     * @param sensitivity - Value from 0 to 100.
     */
    setSensitivity: (sensitivity: number) => void;
}
