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
  const currentOptions = options
  validateRmsOptions(currentOptions)
  validateConfidence(currentOptions.minConfidence)
  validateDurations(currentOptions)
  validateBuffers(currentOptions)
}

function validateRmsOptions(options: SegmenterOptions): void {
  const minRmsValue = options.minRms
  const silenceThreshold = options.maxRmsSilence
  const isInvalid = minRmsValue <= silenceThreshold

  if (isInvalid) {
    const msg = 'minRms must be greater than maxRmsSilence'
    throw new Error(msg)
  }
}

function validateConfidence(minConfidence: number): void {
  const confidence = minConfidence
  const isBelowZero = confidence < 0
  const isAboveOne = confidence > 1
  const isInvalid = isBelowZero || isAboveOne

  if (isInvalid) {
    const msg = 'minConfidence must be between 0 and 1'
    throw new Error(msg)
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
    const msg = 'All duration options must be non-negative'
    throw new Error(msg)
  }
}

function validateBuffers(options: SegmenterOptions): void {
  const gapLimit = options.maxGapFrames
  const noteLimit = options.maxNoteFrames
  const isInvalid = gapLimit <= 0 || noteLimit <= 0

  if (isInvalid) {
    const msg = 'Buffer limits must be positive'
    throw new Error(msg)
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

import { debugBus } from './debug/debug-event-bus'

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
    this.segmentCount = 0
  }

  processFrame(frame: TechniqueFrame): SegmenterEvent | undefined {
    const isSignalPresent = this.isSignal(frame)
    const isSilence = frame.rms < this.options.maxRmsSilence
    const now = frame.timestamp
    const context = { frame, isSignalPresent, isSilence, now }

    const isSilentState = this.state.kind === 'SILENCE'
    let event: SegmenterEvent | undefined

    if (isSilentState) {
      event = this.handleSilenceState(context)
    } else {
      event = this.handleNoteState(context)
    }

    if (process.env.NODE_ENV === 'development') {
      debugBus.emit({
        type: 'SEGMENTER_STATE',
        timestamp: now,
        state: this.state.kind,
        event: event?.type,
      })
    }

    return event
  }

  reset(): void {
    const kind = 'SILENCE'
    const lastAboveThresholdTime = undefined
    const initialState: SegmenterState = { kind, lastAboveThresholdTime }

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
    const result = isRmsSignal && isPitchSignal

    return result
  }

  private handleSilenceState(params: {
    frame: TechniqueFrame
    isSignalPresent: boolean
    isSilence: boolean
    now: TimestampMs
  }): SegmenterEvent | undefined {
    const { frame, isSignalPresent, isSilence, now } = params
    const limit = this.options.maxGapFrames
    this.pushToBuffer({ buffer: this.gapFrames, frame, limit })

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
    const event = this.evaluateOnsetEligibility({ silenceState, frame, now })

    return event
  }

  private evaluateOnsetEligibility(params: {
    silenceState: SilenceState
    frame: PitchedFrame
    now: TimestampMs
  }): SegmenterEvent | undefined {
    const { silenceState, frame, now } = params
    if (silenceState.lastAboveThresholdTime === undefined) {
      silenceState.lastAboveThresholdTime = now
      return undefined
    }

    const elapsed = now - silenceState.lastAboveThresholdTime
    if (elapsed >= this.options.onsetDebounceMs) {
      return this.triggerOnset({ noteName: frame.noteName, now })
    }
    return undefined
  }

  private resetSilenceOnThreshold(isSilence: boolean, now: TimestampMs): void {
    const lastSignal = this.lastSignalTime
    const noisyThreshold = this.options.noisyGapResetMs
    const isNoisyGap = lastSignal !== undefined && now - lastSignal > noisyThreshold
    const shouldReset = isSilence || isNoisyGap

    if (shouldReset) {
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
    const framesRef = this.gapFrames
    const lastIndex = framesRef.length - 1
    const lastGapFrame = framesRef[lastIndex]!
    const initialNoteFrames = [lastGapFrame]

    this.frames = initialNoteFrames
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
    const dropoutThreshold = this.options.pitchDropoutToleranceMs
    const hasPitchDropout = !isSignalPresent && now - noteState.lastSignalTime > dropoutThreshold
    const shouldTrigger = isSilence || hasPitchDropout

    return shouldTrigger
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
    const lastBelow = noteState.lastBelowThresholdTime
    if (lastBelow === undefined) {
      noteState.lastBelowThresholdTime = now
      return undefined
    }

    const elapsed = now - lastBelow
    const threshold = this.options.offsetDebounceMs
    if (elapsed >= threshold) {
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
    const isDifferent = this.isDifferentNoteDetected({
      frame,
      isSignal: isSignalPresent,
      noteState,
    })

    if (isDifferent) {
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
    const isPitched = frame.kind === 'pitched'
    const currentName = noteState.currentNoteName
    const hasChanged = isPitched && frame.noteName !== currentName
    const isDifferent = isSignal && hasChanged

    return isDifferent
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
    const isNewPending = noteState.pendingNoteName !== frame.noteName
    if (isNewPending) {
      noteState.pendingNoteName = frame.noteName
      noteState.pendingSince = now
      return undefined
    }

    const event = this.evaluateNoteChangeEligibility({ frame, now, noteState })
    return event
  }

  private evaluateNoteChangeEligibility(params: {
    frame: PitchedFrame
    now: TimestampMs
    noteState: NoteState
  }): SegmenterEvent | undefined {
    const { frame, now, noteState } = params
    const pendingSince = noteState.pendingSince ?? 0
    const elapsed = now - pendingSince

    if (elapsed >= this.options.noteChangeDebounceMs) {
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
    const durationMs = (endTime - startTime) as TimestampMs

    return this.assembleSegment({ frames, startTime, endTime, durationMs, noteName })
  }

  private assembleSegment(params: {
    frames: readonly TechniqueFrame[]
    startTime: TimestampMs
    endTime: TimestampMs
    durationMs: TimestampMs
    noteName: MusicalNoteName
  }): NoteSegment {
    const { frames, startTime, endTime, durationMs, noteName } = params
    return {
      segmentId: `seg-${Date.now()}-${this.segmentCount++}`,
      noteIndex: 0,
      targetPitch: noteName,
      startTime,
      endTime,
      durationMs,
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
