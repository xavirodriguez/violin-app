import { TechniqueFrame } from './technique-types'

/**
 * Configuration options for the `NoteSegmenter`.
 */
export interface SegmenterOptions {
  /** The minimum RMS value to be considered a potential signal. */
  minRms: number
  /** The maximum RMS value to be considered silence. */
  maxRmsSilence: number
  /** The minimum confidence score from the pitch detector to trust the note name. */
  minConfidence: number
  /** The duration in milliseconds a signal must be present to trigger an `ONSET` event. */
  onsetDebounceMs: number
  /** The duration in milliseconds a signal must be absent to trigger an `OFFSET` event. */
  offsetDebounceMs: number
}

const defaultOptions: SegmenterOptions = {
  minRms: 0.015,
  maxRmsSilence: 0.008,
  minConfidence: 0.8,
  onsetDebounceMs: 50,
  offsetDebounceMs: 150,
}

/**
 * Represents the union of all possible events that can be emitted by the `NoteSegmenter`.
 * - `ONSET`: A new note has started.
 * - `OFFSET`: The current note has ended.
 * - `NOTE_CHANGE`: The pitch has changed mid-note without an intervening silence.
 */
export type SegmenterEvent =
  | { type: 'ONSET'; timestamp: number; noteName: string; gapFrames: TechniqueFrame[] }
  | { type: 'OFFSET'; timestamp: number; frames: TechniqueFrame[] }
  | { type: 'NOTE_CHANGE'; timestamp: number; noteName: string; frames: TechniqueFrame[] }

/**
 * A stateful class that processes a stream of `TechniqueFrame`s and emits events for note onsets, offsets, and changes.
 *
 * @remarks
 * This class implements a state machine (`SILENCE` or `NOTE`) with hysteresis and temporal debouncing
 * to robustly identify the start and end of musical notes from a real-time audio stream.
 * It aggregates frames for a completed note and provides them in the `OFFSET` event payload.
 *
 * The core logic is based on:
 * - RMS thresholds to distinguish signal from silence.
 * - Confidence scores from the pitch detector to filter noise.
 * - Debouncing timers to prevent spurious events from short fluctuations.
 */
export class NoteSegmenter {
  private options: SegmenterOptions
  private state: 'SILENCE' | 'NOTE' = 'SILENCE'
  private currentNoteName: string | null = null
  private frames: TechniqueFrame[] = []
  private gapFrames: TechniqueFrame[] = []

  private lastAboveThresholdTime: number | null = null
  private lastBelowThresholdTime: number | null = null

  /**
   * Constructs a new `NoteSegmenter`.
   * @param options - Optional configuration to override the default segmentation parameters.
   */
  constructor(options: Partial<SegmenterOptions> = {}) {
    this.options = { ...defaultOptions, ...options }
  }

  /**
   * Processes a single `TechniqueFrame` and returns a `SegmenterEvent` if a note boundary is detected.
   *
   * @remarks
   * This method should be called for each new frame of audio analysis. It updates the internal state
   * and returns an event object (`ONSET`, `OFFSET`, `NOTE_CHANGE`) or `null` if no significant event occurred.
   *
   * @param frame - The `TechniqueFrame` to process.
   * @returns A `SegmenterEvent` or `null`.
   */
  processFrame(frame: TechniqueFrame): SegmenterEvent | null {
    const isSignalPresent =
      frame.rms > this.options.minRms && frame.confidence > this.options.minConfidence
    const isSilence = frame.rms < this.options.maxRmsSilence

    const now = frame.timestamp

    if (this.state === 'SILENCE') {
      this.gapFrames.push(frame)
      if (isSignalPresent) {
        if (this.lastAboveThresholdTime === null) {
          this.lastAboveThresholdTime = now
        } else if (now - this.lastAboveThresholdTime >= this.options.onsetDebounceMs) {
          // ONSET detected
          this.state = 'NOTE'
          this.currentNoteName = frame.noteName
          this.frames = [frame]
          const gap = [...this.gapFrames]
          this.gapFrames = []
          this.lastAboveThresholdTime = null
          return { type: 'ONSET', timestamp: now, noteName: frame.noteName, gapFrames: gap }
        }
      } else {
        this.lastAboveThresholdTime = null
      }
    } else {
      // state === 'NOTE'
      this.frames.push(frame)

      // Check for note change
      if (isSignalPresent && frame.noteName !== this.currentNoteName) {
        const previousFrames = [...this.frames]
        this.currentNoteName = frame.noteName
        this.frames = [frame]
        return {
          type: 'NOTE_CHANGE',
          timestamp: now,
          noteName: frame.noteName,
          frames: previousFrames,
        }
      }

      if (isSilence || !isSignalPresent) {
        if (this.lastBelowThresholdTime === null) {
          this.lastBelowThresholdTime = now
        } else if (now - this.lastBelowThresholdTime >= this.options.offsetDebounceMs) {
          // OFFSET detected
          const completedFrames = [...this.frames]
          this.state = 'SILENCE'
          this.currentNoteName = null
          this.frames = []
          this.lastBelowThresholdTime = null
          return { type: 'OFFSET', timestamp: now, frames: completedFrames }
        }
      } else {
        this.lastBelowThresholdTime = null
      }
    }

    return null
  }

  /**
   * Resets the segmenter to its initial state.
   *
   * @remarks
   * This should be called when the audio stream is stopped or interrupted, ensuring that
   * the segmenter is ready for a new stream without carrying over any stale state.
   */
  reset() {
    this.state = 'SILENCE'
    this.currentNoteName = null
    this.frames = []
    this.gapFrames = []
    this.lastAboveThresholdTime = null
    this.lastBelowThresholdTime = null
  }
}
