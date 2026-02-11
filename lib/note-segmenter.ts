import {
  TechniqueFrame,
  MusicalNoteName,
  TimestampMs,
  NoteSegment,
} from './technique-types'

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
  /** The duration in milliseconds a new pitch must be stable to trigger a `NOTE_CHANGE`. */
  noteChangeDebounceMs: number
  /** The duration in milliseconds to tolerate pitch dropouts if RMS is still high. */
  pitchDropoutToleranceMs: number
  /** The duration of silence that resets the noisy gap buffer. */
  noisyGapResetMs: number
  /** Maximum number of frames to keep in the gap buffer. */
  maxGapFrames: number
  /** Maximum number of frames to keep in the note buffer. */
  maxNoteFrames: number
}

const defaultOptions: SegmenterOptions = {
  minRms: 0.015,
  maxRmsSilence: 0.008,
  minConfidence: 0.8,
  onsetDebounceMs: 50,
  offsetDebounceMs: 150,
  noteChangeDebounceMs: 60,
  pitchDropoutToleranceMs: 100,
  noisyGapResetMs: 50,
  maxGapFrames: 100,
  maxNoteFrames: 2000, // Approx 33 seconds at 60fps
}

/**
 * Validates the provided options for the NoteSegmenter.
 * @throws Error if options are invalid or inconsistent.
 */
export function validateOptions(options: SegmenterOptions): void {
  if (options.minRms <= options.maxRmsSilence) {
    throw new Error('minRms must be greater than maxRmsSilence')
  }
  if (options.minConfidence < 0 || options.minConfidence > 1) {
    throw new Error('minConfidence must be between 0 and 1')
  }
  if (
    options.onsetDebounceMs < 0 ||
    options.offsetDebounceMs < 0 ||
    options.noteChangeDebounceMs < 0 ||
    options.pitchDropoutToleranceMs < 0 ||
    options.noisyGapResetMs < 0
  ) {
    throw new Error('All duration options must be non-negative')
  }
  if (options.maxGapFrames <= 0 || options.maxNoteFrames <= 0) {
    throw new Error('Buffer limits must be positive')
  }
}

/**
 * Possible segmenter events emitted during note detection.
 *
 * @remarks
 * Event Sequence:
 * 1. ONSET: Sound begins -> new note detected
 * 2. NOTE_CHANGE: Pitch changes mid-sound (unusual, may indicate sliding)
 * 3. OFFSET: Sound ends -> note completed with full analysis
 */
export type SegmenterEvent =
  | {
      type: 'ONSET'
      /** Timestamp when note attack was detected (ms) */
      timestamp: TimestampMs
      /** The detected note name (e.g., "A4") */
      noteName: MusicalNoteName
      /**
       * Frames captured during silence/transition before this note.
       * Used for analyzing attack quality and string crossing.
       */
      gapFrames: ReadonlyArray<TechniqueFrame>
    }
  | {
      type: 'OFFSET'
      /** Timestamp when note release was detected (ms) */
      timestamp: TimestampMs
      /**
       * Complete segment data including all frames captured during this note's sustain phase.
       * Used for intonation, vibrato, and stability analysis.
       */
      segment: NoteSegment
    }
  | {
      type: 'NOTE_CHANGE'
      /** Timestamp of pitch change (ms) */
      timestamp: TimestampMs
      /** The new detected note name */
      noteName: MusicalNoteName
      /**
       * Complete segment data for the note that just ended.
       * Frames may indicate intentional glissando or unintentional sliding.
       */
      segment: NoteSegment
    }

/**
 * Internal state of the segmenter.
 */
type SegmenterState =
  | { kind: 'SILENCE'; lastAboveThresholdTime: TimestampMs | null }
  | {
      kind: 'NOTE'
      currentNoteName: MusicalNoteName
      lastBelowThresholdTime: TimestampMs | null
      lastSignalTime: TimestampMs
      /** Tracking for NOTE_CHANGE */
      pendingNoteName: MusicalNoteName | null
      pendingSince: TimestampMs | null
    }

/**
 * A stateful class that segments an audio stream into musical notes.
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
  private state: SegmenterState = { kind: 'SILENCE', lastAboveThresholdTime: null }
  private frames: TechniqueFrame[] = []
  private gapFrames: TechniqueFrame[] = []
  private lastSignalTime: TimestampMs | null = null
  private segmentCount = 0

  constructor(options: Partial<SegmenterOptions> = {}) {
    this.options = { ...defaultOptions, ...options }
    validateOptions(this.options)
  }

  /**
   * Processes a single audio analysis frame.
   *
   * @param frame - Current pitch detection result
   * @returns Event if state transition occurred, null otherwise
   *
   * @remarks
   * **State Machine**:
   * - SILENCE -> ONSET (when RMS > minRms)
   * - ONSET -> OFFSET (when RMS < maxRmsSilence for offsetDebounceMs)
   * - ONSET -> NOTE_CHANGE (when detected note changes)
   *
   * Uses debouncing to prevent false triggers from noise.
   */
  processFrame(frame: TechniqueFrame): SegmenterEvent | null {
    const isRmsSignal = frame.rms > this.options.minRms
    const isPitchSignal = frame.kind === 'pitched' && frame.confidence > this.options.minConfidence
    const isSignalPresent = isRmsSignal && isPitchSignal
    const isSilence = frame.rms < this.options.maxRmsSilence
    const now = frame.timestamp

    if (this.state.kind === 'SILENCE') {
      return this.handleSilenceState(frame, isSignalPresent, isSilence, now)
    } else {
      return this.handleNoteState(frame, isSignalPresent, isSilence, now)
    }
  }

  private handleSilenceState(
    frame: TechniqueFrame,
    isSignalPresent: boolean,
    isSilence: boolean,
    now: TimestampMs,
  ): SegmenterEvent | null {
    this.pushToBuffer(this.gapFrames, frame, this.options.maxGapFrames)

    if (isSignalPresent) {
      this.lastSignalTime = now
      const s = this.state as Extract<SegmenterState, { kind: 'SILENCE' }>

      if (s.lastAboveThresholdTime === null) {
        s.lastAboveThresholdTime = now
      } else if (now - s.lastAboveThresholdTime >= this.options.onsetDebounceMs) {
        // ONSET detected
        const noteName = (frame as any).noteName as MusicalNoteName // Guaranteed by isSignalPresent
        this.state = {
          kind: 'NOTE',
          currentNoteName: noteName,
          lastBelowThresholdTime: null,
          lastSignalTime: now,
          pendingNoteName: null,
          pendingSince: null,
        }
        this.frames = [frame]
        const gap = Object.freeze([...this.gapFrames])
        this.gapFrames = []
        return { type: 'ONSET', timestamp: now, noteName, gapFrames: gap }
      }
    } else if (
      isSilence ||
      (this.lastSignalTime !== null && now - this.lastSignalTime > this.options.noisyGapResetMs)
    ) {
      ;(this.state as any).lastAboveThresholdTime = null
    }
    return null
  }

  private handleNoteState(
    frame: TechniqueFrame,
    isSignalPresent: boolean,
    isSilence: boolean,
    now: TimestampMs,
  ): SegmenterEvent | null {
    this.pushToBuffer(this.frames, frame, this.options.maxNoteFrames)
    const s = this.state as Extract<SegmenterState, { kind: 'NOTE' }>

    // Note Change Detection
    const noteChangeEvent = this.checkNoteChange(frame, isSignalPresent, now, s)
    if (noteChangeEvent) return noteChangeEvent

    // Offset Detection
    // We allow the note to continue if RMS is still high even if confidence drops (pitchDropoutToleranceMs)
    const hasPitchDropout =
      !isSignalPresent && now - s.lastSignalTime > this.options.pitchDropoutToleranceMs
    const shouldStartOffsetTimer = isSilence || hasPitchDropout

    if (shouldStartOffsetTimer) {
      if (s.lastBelowThresholdTime === null) {
        s.lastBelowThresholdTime = now
      } else if (now - s.lastBelowThresholdTime >= this.options.offsetDebounceMs) {
        // OFFSET detected
        const segment = this.createSegment(s.currentNoteName)
        this.state = { kind: 'SILENCE', lastAboveThresholdTime: null }
        this.frames = []
        this.lastSignalTime = null
        return { type: 'OFFSET', timestamp: now, segment }
      }
    } else {
      s.lastBelowThresholdTime = null
      if (isSignalPresent) {
        s.lastSignalTime = now
      }
    }

    return null
  }

  private checkNoteChange(
    frame: TechniqueFrame,
    isSignalPresent: boolean,
    now: TimestampMs,
    s: Extract<SegmenterState, { kind: 'NOTE' }>,
  ): SegmenterEvent | null {
    if (isSignalPresent && frame.kind === 'pitched' && frame.noteName !== s.currentNoteName) {
      if (!s.pendingNoteName) {
        s.pendingNoteName = frame.noteName
        s.pendingSince = now
      } else if (
        s.pendingNoteName === frame.noteName &&
        now - (s.pendingSince ?? 0) >= this.options.noteChangeDebounceMs
      ) {
        // Confirmed: new note stable
        const segment = this.createSegment(s.currentNoteName)
        s.currentNoteName = frame.noteName
        this.frames = [frame]
        s.pendingNoteName = null
        s.pendingSince = null
        s.lastSignalTime = now
        s.lastBelowThresholdTime = null

        return {
          type: 'NOTE_CHANGE',
          timestamp: now,
          noteName: frame.noteName,
          segment,
        }
      }
    } else {
      s.pendingNoteName = null
      s.pendingSince = null
    }
    return null
  }

  private createSegment(noteName: MusicalNoteName): NoteSegment {
    const frames = Object.freeze([...this.frames])
    const startTime = frames[0]?.timestamp ?? (0 as TimestampMs)
    const endTime = frames[frames.length - 1]?.timestamp ?? (0 as TimestampMs)

    return {
      segmentId: `seg-${Date.now()}-${this.segmentCount++}`,
      noteIndex: 0, // Should be populated by consumer if needed
      targetPitch: noteName,
      startTime,
      endTime,
      durationMs: (endTime - startTime) as TimestampMs,
      frames,
    }
  }

  private pushToBuffer(buffer: TechniqueFrame[], frame: TechniqueFrame, limit: number): void {
    buffer.push(frame)
    if (buffer.length > limit) {
      buffer.shift()
    }
  }

  /**
   * Resets segmenter to initial state.
   *
   * @remarks
   * Call between exercises or when audio context is recreated.
   * Discards all buffered frames and resets internal timers.
   */
  reset(): void {
    this.state = { kind: 'SILENCE', lastAboveThresholdTime: null }
    this.frames = []
    this.gapFrames = []
    this.lastSignalTime = null
    this.segmentCount = 0
  }
}
