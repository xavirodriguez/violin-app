import {
  TechniqueFrame,
  PitchedFrame,
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
 */
export type SegmenterEvent =
  | {
      type: 'ONSET'
      timestamp: TimestampMs
      noteName: MusicalNoteName
      gapFrames: ReadonlyArray<TechniqueFrame>
    }
  | {
      type: 'OFFSET'
      timestamp: TimestampMs
      segment: NoteSegment
    }
  | {
      type: 'NOTE_CHANGE'
      timestamp: TimestampMs
      noteName: MusicalNoteName
      segment: NoteSegment
    }

/**
 * Internal state of the segmenter.
 */
type SilenceState = { kind: 'SILENCE'; lastAboveThresholdTime: TimestampMs | undefined }
type NoteState = {
  kind: 'NOTE'
  currentNoteName: MusicalNoteName
  lastBelowThresholdTime: TimestampMs | undefined
  lastSignalTime: TimestampMs
  pendingNoteName: MusicalNoteName | undefined
  pendingSince: TimestampMs | undefined
}
type SegmenterState = SilenceState | NoteState

/**
 * A stateful class that segments an audio stream into musical notes.
 */
export class NoteSegmenter {
  private readonly options: SegmenterOptions
  private state: SegmenterState = { kind: 'SILENCE', lastAboveThresholdTime: undefined }
  private frames: TechniqueFrame[] = []
  private gapFrames: TechniqueFrame[] = []
  private lastSignalTime: TimestampMs | undefined = undefined
  private segmentCount = 0

  constructor(options: Partial<SegmenterOptions> = {}) {
    this.options = { ...defaultOptions, ...options }
    validateOptions(this.options)
  }

  processFrame(frame: TechniqueFrame): SegmenterEvent | undefined {
    const isSignalPresent = this.isSignal(frame)
    const isSilence = frame.rms < this.options.maxRmsSilence
    const now = frame.timestamp

    return this.state.kind === 'SILENCE'
      ? this.handleSilenceState(frame, isSignalPresent, isSilence, now)
      : this.handleNoteState(frame, isSignalPresent, isSilence, now)
  }

  private isSignal(frame: TechniqueFrame): boolean {
    const isRmsSignal = frame.rms > this.options.minRms
    const isPitchSignal = frame.kind === 'pitched' && frame.confidence > this.options.minConfidence
    return isRmsSignal && isPitchSignal
  }

  private handleSilenceState(
    frame: TechniqueFrame,
    isSignalPresent: boolean,
    isSilence: boolean,
    now: TimestampMs,
  ): SegmenterEvent | undefined {
    this.pushToBuffer(this.gapFrames, frame, this.options.maxGapFrames)
    if (isSignalPresent) {
      return this.processSilenceSignal(frame as PitchedFrame, now)
    }
    this.updateSilenceThreshold(isSilence, now)
    return undefined
  }

  private processSilenceSignal(frame: PitchedFrame, now: TimestampMs): SegmenterEvent | undefined {
    this.lastSignalTime = now
    const silenceState = this.state as SilenceState
    if (silenceState.lastAboveThresholdTime === undefined) {
      silenceState.lastAboveThresholdTime = now
      return undefined
    }
    if (now - silenceState.lastAboveThresholdTime >= this.options.onsetDebounceMs) {
      return this.triggerOnset(frame.noteName, now)
    }
    return undefined
  }

  private updateSilenceThreshold(isSilence: boolean, now: TimestampMs): void {
    const isNoisyGap =
      this.lastSignalTime !== undefined && now - this.lastSignalTime > this.options.noisyGapResetMs
    if (isSilence || isNoisyGap) {
      ;(this.state as SilenceState).lastAboveThresholdTime = undefined
    }
  }

  private triggerOnset(noteName: MusicalNoteName, now: TimestampMs): SegmenterEvent {
    this.state = {
      kind: 'NOTE',
      currentNoteName: noteName,
      lastBelowThresholdTime: undefined,
      lastSignalTime: now,
      pendingNoteName: undefined,
      pendingSince: undefined,
    }
    this.frames = [this.gapFrames[this.gapFrames.length - 1]!]
    const gap = Object.freeze([...this.gapFrames])
    this.gapFrames = []
    return { type: 'ONSET', timestamp: now, noteName, gapFrames: gap }
  }

  private handleNoteState(
    frame: TechniqueFrame,
    isSignalPresent: boolean,
    isSilence: boolean,
    now: TimestampMs,
  ): SegmenterEvent | undefined {
    this.pushToBuffer(this.frames, frame, this.options.maxNoteFrames)
    const noteState = this.state as NoteState

    const noteChangeEvent = this.checkNoteChange(frame, isSignalPresent, now, noteState)
    if (noteChangeEvent) return noteChangeEvent

    return this.processNoteOffset(isSignalPresent, isSilence, now, noteState)
  }

  private processNoteOffset(
    isSignalPresent: boolean,
    isSilence: boolean,
    now: TimestampMs,
    noteState: NoteState,
  ): SegmenterEvent | undefined {
    const hasPitchDropout =
      !isSignalPresent && now - noteState.lastSignalTime > this.options.pitchDropoutToleranceMs

    if (isSilence || hasPitchDropout) {
      return this.handleOffsetTimer(now, noteState)
    }
    noteState.lastBelowThresholdTime = undefined
    if (isSignalPresent) {
      noteState.lastSignalTime = now
    }
    return undefined
  }

  private handleOffsetTimer(now: TimestampMs, noteState: NoteState): SegmenterEvent | undefined {
    if (noteState.lastBelowThresholdTime === undefined) {
      noteState.lastBelowThresholdTime = now
      return undefined
    }
    if (now - noteState.lastBelowThresholdTime >= this.options.offsetDebounceMs) {
      return this.triggerOffset(noteState.currentNoteName, now)
    }
    return undefined
  }

  private triggerOffset(noteName: MusicalNoteName, now: TimestampMs): SegmenterEvent {
    const segment = this.createSegment(noteName)
    this.state = { kind: 'SILENCE', lastAboveThresholdTime: undefined }
    this.frames = []
    this.lastSignalTime = undefined
    return { type: 'OFFSET', timestamp: now, segment }
  }

  private checkNoteChange(
    frame: TechniqueFrame,
    isSignalPresent: boolean,
    now: TimestampMs,
    noteState: NoteState,
  ): SegmenterEvent | undefined {
    const isDifferentNote =
      isSignalPresent && frame.kind === 'pitched' && frame.noteName !== noteState.currentNoteName
    if (!isDifferentNote) {
      noteState.pendingNoteName = undefined
      noteState.pendingSince = undefined
      return undefined
    }

    return this.processPendingNoteChange(frame as PitchedFrame, now, noteState)
  }

  private processPendingNoteChange(
    frame: PitchedFrame,
    now: TimestampMs,
    noteState: NoteState,
  ): SegmenterEvent | undefined {
    if (noteState.pendingNoteName !== frame.noteName) {
      noteState.pendingNoteName = frame.noteName
      noteState.pendingSince = now
      return undefined
    }

    if (now - (noteState.pendingSince ?? 0) >= this.options.noteChangeDebounceMs) {
      return this.triggerNoteChange(frame, now, noteState)
    }
    return undefined
  }

  private triggerNoteChange(
    frame: PitchedFrame,
    now: TimestampMs,
    noteState: NoteState,
  ): SegmenterEvent {
    const segment = this.createSegment(noteState.currentNoteName)
    noteState.currentNoteName = frame.noteName
    this.frames = [frame]
    noteState.pendingNoteName = undefined
    noteState.pendingSince = undefined
    noteState.lastSignalTime = now
    noteState.lastBelowThresholdTime = undefined

    return { type: 'NOTE_CHANGE', timestamp: now, noteName: frame.noteName, segment }
  }

  private createSegment(noteName: MusicalNoteName): NoteSegment {
    const frames = Object.freeze([...this.frames])
    const startTime = frames[0]?.timestamp ?? (0 as TimestampMs)
    const endTime = frames[frames.length - 1]?.timestamp ?? (0 as TimestampMs)

    return {
      segmentId: `seg-${Date.now()}-${this.segmentCount++}`,
      noteIndex: 0,
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

  reset(): void {
    this.state = { kind: 'SILENCE', lastAboveThresholdTime: undefined }
    this.frames = []
    this.gapFrames = []
    this.lastSignalTime = undefined
    this.segmentCount = 0
  }
}
