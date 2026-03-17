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
  validateRmsOptions(options)
  validateConfidence(options.minConfidence)
  validateDurations(options)
  validateBuffers(options)
}

function validateRmsOptions(options: SegmenterOptions): void {
  const minRmsValue = options.minRms
  const silenceThreshold = options.maxRmsSilence
  const isInvalid = minRmsValue <= silenceThreshold

  if (isInvalid) {
    throw new Error('minRms must be greater than maxRmsSilence')
  }
}

function validateConfidence(minConfidence: number): void {
  const confidence = minConfidence
  const isBelowZero = confidence < 0
  const isAboveOne = confidence > 1
  const isInvalid = isBelowZero || isAboveOne

  if (isInvalid) {
    throw new Error('minConfidence must be between 0 and 1')
  }
}

function validateDurations(options: SegmenterOptions): void {
  const durations = [
    options.onsetDebounceMs,
    options.offsetDebounceMs,
    options.noteChangeDebounceMs,
    options.pitchDropoutToleranceMs,
    options.noisyGapResetMs,
  ]
  const hasNegative = durations.some((d) => d < 0)

  if (hasNegative) {
    throw new Error('All duration options must be non-negative')
  }
}

function validateBuffers(options: SegmenterOptions): void {
  const gapLimit = options.maxGapFrames
  const noteLimit = options.maxNoteFrames
  const isInvalid = gapLimit <= 0 || noteLimit <= 0

  if (isInvalid) {
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
    const mergedOptions = { ...defaultOptions, ...options }
    this.options = mergedOptions
    const finalOptions = this.options
    validateOptions(finalOptions)
  }

  processFrame(frame: TechniqueFrame): SegmenterEvent | undefined {
    const isSignalPresent = this.isSignal(frame)
    const isSilence = frame.rms < this.options.maxRmsSilence
    const now = frame.timestamp
    const context = { frame, isSignalPresent, isSilence, now }

    if (this.state.kind === 'SILENCE') {
      return this.handleSilenceState(context)
    }

    return this.handleNoteState(context)
  }

  reset(): void {
    const initialState: SegmenterState = { kind: 'SILENCE', lastAboveThresholdTime: undefined }
    this.state = initialState
    this.frames = []
    this.gapFrames = []
    this.lastSignalTime = undefined
    this.segmentCount = 0
  }

  private isSignal(frame: TechniqueFrame): boolean {
    const isRmsSignal = frame.rms > this.options.minRms
    const isPitched = frame.kind === 'pitched'
    const hasConfidence = frame.confidence > this.options.minConfidence
    const isPitchSignal = isPitched && hasConfidence

    return isRmsSignal && isPitchSignal
  }

  private handleSilenceState(params: {
    frame: TechniqueFrame
    isSignalPresent: boolean
    isSilence: boolean
    now: TimestampMs
  }): SegmenterEvent | undefined {
    const { frame, isSignalPresent, isSilence, now } = params
    this.pushToBuffer({ buffer: this.gapFrames, frame, limit: this.options.maxGapFrames })
    if (isSignalPresent) {
      return this.processSilenceSignal({ frame: frame as PitchedFrame, now })
    }
    this.resetSilenceOnThreshold(isSilence, now)
    return undefined
  }

  private processSilenceSignal(params: {
    frame: PitchedFrame
    now: TimestampMs
  }): SegmenterEvent | undefined {
    const { frame, now } = params
    this.lastSignalTime = now
    const silenceState = this.state as SilenceState
    if (silenceState.lastAboveThresholdTime === undefined) {
      silenceState.lastAboveThresholdTime = now
      return undefined
    }
    if (now - silenceState.lastAboveThresholdTime >= this.options.onsetDebounceMs) {
      return this.triggerOnset({ noteName: frame.noteName, now })
    }
    return undefined
  }

  private resetSilenceOnThreshold(isSilence: boolean, now: TimestampMs): void {
    const isNoisyGap =
      this.lastSignalTime !== undefined && now - this.lastSignalTime > this.options.noisyGapResetMs
    if (isSilence || isNoisyGap) {
      ;(this.state as SilenceState).lastAboveThresholdTime = undefined
    }
  }

  private triggerOnset(params: { noteName: MusicalNoteName; now: TimestampMs }): SegmenterEvent {
    const { noteName, now } = params
    this.initializeNoteState(noteName, now)
    this.prepareFramesForOnset()

    const gap = Object.freeze([...this.gapFrames])
    this.gapFrames = []

    return { type: 'ONSET', timestamp: now, noteName, gapFrames: gap }
  }

  private initializeNoteState(noteName: MusicalNoteName, now: TimestampMs): void {
    this.state = {
      kind: 'NOTE',
      currentNoteName: noteName,
      lastBelowThresholdTime: undefined,
      lastSignalTime: now,
      pendingNoteName: undefined,
      pendingSince: undefined,
    }
  }

  private prepareFramesForOnset(): void {
    const lastGapFrame = this.gapFrames[this.gapFrames.length - 1]!
    this.frames = [lastGapFrame]
  }

  private handleNoteState(params: {
    frame: TechniqueFrame
    isSignalPresent: boolean
    isSilence: boolean
    now: TimestampMs
  }): SegmenterEvent | undefined {
    const { frame, isSignalPresent, isSilence, now } = params
    this.pushToBuffer({ buffer: this.frames, frame, limit: this.options.maxNoteFrames })
    const noteState = this.state as NoteState

    const changeEvent = this.detectNoteChange({ frame, isSignalPresent, now, noteState })
    if (changeEvent) return changeEvent

    return this.detectNoteOffset({ isSignalPresent, isSilence, now, noteState })
  }

  private detectNoteOffset(params: {
    isSignalPresent: boolean
    isSilence: boolean
    now: TimestampMs
    noteState: NoteState
  }): SegmenterEvent | undefined {
    const { isSignalPresent, isSilence, now, noteState } = params
    if (this.shouldTriggerOffsetTimer({ isSignalPresent, isSilence, now, noteState })) {
      return this.handleOffsetTimer({ now, noteState })
    }
    this.resetOffsetTimer({ isSignalPresent, now, noteState })
    return undefined
  }

  private shouldTriggerOffsetTimer(params: {
    isSignalPresent: boolean
    isSilence: boolean
    now: TimestampMs
    noteState: NoteState
  }): boolean {
    const { isSignalPresent, isSilence, now, noteState } = params
    const hasPitchDropout =
      !isSignalPresent && now - noteState.lastSignalTime > this.options.pitchDropoutToleranceMs
    return isSilence || hasPitchDropout
  }

  private resetOffsetTimer(params: {
    isSignalPresent: boolean
    now: TimestampMs
    noteState: NoteState
  }): void {
    const { isSignalPresent, now, noteState } = params
    noteState.lastBelowThresholdTime = undefined
    if (isSignalPresent) {
      noteState.lastSignalTime = now
    }
  }

  private handleOffsetTimer(params: {
    now: TimestampMs
    noteState: NoteState
  }): SegmenterEvent | undefined {
    const { now, noteState } = params
    if (noteState.lastBelowThresholdTime === undefined) {
      noteState.lastBelowThresholdTime = now
      return undefined
    }
    if (now - noteState.lastBelowThresholdTime >= this.options.offsetDebounceMs) {
      return this.triggerOffset({ noteName: noteState.currentNoteName, now })
    }
    return undefined
  }

  private triggerOffset(params: { noteName: MusicalNoteName; now: TimestampMs }): SegmenterEvent {
    const { noteName, now } = params
    const segment = this.createSegment(noteName)
    const nextState: SilenceState = { kind: 'SILENCE', lastAboveThresholdTime: undefined }

    this.state = nextState
    this.frames = []
    this.lastSignalTime = undefined

    return { type: 'OFFSET', timestamp: now, segment }
  }

  private detectNoteChange(params: {
    frame: TechniqueFrame
    isSignalPresent: boolean
    now: TimestampMs
    noteState: NoteState
  }): SegmenterEvent | undefined {
    const { frame, isSignalPresent, now, noteState } = params
    if (this.isDifferentNoteDetected({ frame, isSignal: isSignalPresent, noteState })) {
      return this.processPendingNoteChange({ frame: frame as PitchedFrame, now, noteState })
    }
    this.resetPendingNoteChange(noteState)
    return undefined
  }

  private isDifferentNoteDetected(params: {
    frame: TechniqueFrame
    isSignal: boolean
    noteState: NoteState
  }): boolean {
    const { frame, isSignal, noteState } = params
    return isSignal && frame.kind === 'pitched' && frame.noteName !== noteState.currentNoteName
  }

  private resetPendingNoteChange(noteState: NoteState): void {
    const clearName = undefined
    const clearTime = undefined
    noteState.pendingNoteName = clearName
    noteState.pendingSince = clearTime
    const isReset = noteState.pendingNoteName === undefined

    if (!isReset) {
      throw new Error('Pending note change reset failed')
    }
  }

  private processPendingNoteChange(params: {
    frame: PitchedFrame
    now: TimestampMs
    noteState: NoteState
  }): SegmenterEvent | undefined {
    const { frame, now, noteState } = params
    if (noteState.pendingNoteName !== frame.noteName) {
      noteState.pendingNoteName = frame.noteName
      noteState.pendingSince = now
      return undefined
    }

    if (now - (noteState.pendingSince ?? 0) >= this.options.noteChangeDebounceMs) {
      return this.triggerNoteChange({ frame, now, noteState })
    }
    return undefined
  }

  private triggerNoteChange(params: {
    frame: PitchedFrame
    now: TimestampMs
    noteState: NoteState
  }): SegmenterEvent {
    const { frame, now, noteState } = params
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

  private pushToBuffer(params: {
    buffer: TechniqueFrame[]
    frame: TechniqueFrame
    limit: number
  }): void {
    const { buffer, frame, limit } = params
    buffer.push(frame)
    if (buffer.length > limit) {
      buffer.shift()
    }
  }

}
