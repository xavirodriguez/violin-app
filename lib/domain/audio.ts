/**
 * Audio Domain
 *
 * Defines the types for the audio reference system and metronome.
 */

/**
 * Represents a reference to a specific note audio sample.
 */
export interface NoteReference {
  noteId: string; // e.g. "C4"
  frequency: number;
}

/**
 * Represents an audio sample with its buffer and metadata.
 */
export interface AudioSample {
  id: string;
  buffer: AudioBuffer;
  noteId?: string;
  dynamic: 'p' | 'mf' | 'f';
}

/**
 * Maps note IDs to their corresponding audio samples.
 */
export type AudioReferenceMap = Record<string, AudioSample[]>;

/**
 * Configuration for the practice tempo.
 */
export interface TempoConfig {
  bpm: number;
  scale: number; // 0.1 to 2.0 (1.0 is original)
}
