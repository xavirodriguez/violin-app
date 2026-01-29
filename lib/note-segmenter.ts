import { TechniqueFrame } from './technique-types'

export interface SegmenterOptions {
  minRms: number
  maxRmsSilence: number
  minConfidence: number
  onsetDebounceMs: number
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
 * Possible segmenter events emitted during note detection.
 *
 * @remarks
 * Event Sequence:
 * 1. ONSET: Sound begins → new note detected
 * 2. NOTE_CHANGE: Pitch changes mid-sound (unusual, may indicate sliding)
 * 3. OFFSET: Sound ends → note completed with full analysis
 */
export type SegmenterEvent =
  | {
      type: 'ONSET'
      /** Timestamp when note attack was detected (ms) */
      timestamp: number
      /** The detected note name (e.g., "A4") */
      noteName: string
      /**
       * Frames captured during silence/transition before this note.
       * Used for analyzing attack quality and string crossing.
       */
      gapFrames: TechniqueFrame[]
    }
  | {
      type: 'OFFSET'
      /** Timestamp when note release was detected (ms) */
      timestamp: number
      /**
       * All frames captured during this note's sustain phase.
       * Used for intonation, vibrato, and stability analysis.
       */
      frames: TechniqueFrame[]
    }
  | {
      type: 'NOTE_CHANGE'
      /** Timestamp of pitch change (ms) */
      timestamp: number
      /** The new detected note name */
      noteName: string
      /**
       * Frames captured during the pitch transition.
       * May indicate intentional glissando or unintentional sliding.
       */
      frames: TechniqueFrame[]
    }

export class NoteSegmenter {
  private options: SegmenterOptions
  private state: 'SILENCE' | 'NOTE' = 'SILENCE'
  private currentNoteName: string | null = null
  private frames: TechniqueFrame[] = []
  private gapFrames: TechniqueFrame[] = []

  private lastAboveThresholdTime: number | null = null
  private lastBelowThresholdTime: number | null = null
  private lastSignalTime: number | null = null

  // NOTE_CHANGE debouncing: prevents false note changes from momentary pitch flicker
  private pendingNoteName: string | null = null
  private pendingSince: number | null = null

  constructor(options: Partial<SegmenterOptions> = {}) {
    this.options = { ...defaultOptions, ...options }
  }

  /**
   * Processes a single audio analysis frame.
   *
   * @param frame - Current pitch detection result
   * @returns Event if state transition occurred, null otherwise
   *
   * @remarks
   * **State Machine**:
   * - SILENCE → ONSET (when RMS \> minRms)
   * - ONSET → OFFSET (when RMS \< maxRmsSilence for offsetDebounceMs)
   * - ONSET → NOTE_CHANGE (when detected note changes)
   *
   * Uses debouncing to prevent false triggers from noise.
   */
  processFrame(frame: TechniqueFrame): SegmenterEvent | null {
    const isSignalPresent =
      frame.rms > this.options.minRms && frame.confidence > this.options.minConfidence
    const isSilence = frame.rms < this.options.maxRmsSilence
    const now = frame.timestamp

    if (this.state === 'SILENCE') {
      return this.handleSilenceState(frame, isSignalPresent, isSilence, now)
    } else {
      return this.handleNoteState(frame, isSignalPresent, isSilence, now)
    }
  }

  private handleSilenceState(
    frame: TechniqueFrame,
    isSignalPresent: boolean,
    isSilence: boolean,
    now: number,
  ): SegmenterEvent | null {
    this.gapFrames.push(frame)
    if (isSignalPresent) {
      this.lastSignalTime = now
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
    } else if (isSilence || (this.lastSignalTime !== null && now - this.lastSignalTime > 50)) {
      // Reset onset timer if we have true silence or too much noisy gap
      this.lastAboveThresholdTime = null
    }
    return null
  }

  private handleNoteState(
    frame: TechniqueFrame,
    isSignalPresent: boolean,
    isSilence: boolean,
    now: number,
  ): SegmenterEvent | null {
    this.frames.push(frame)

    const noteChangeEvent = this.checkNoteChange(frame, isSignalPresent, now)
    if (noteChangeEvent) return noteChangeEvent

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
        this.lastSignalTime = null
        return { type: 'OFFSET', timestamp: now, frames: completedFrames }
      }
    } else {
      this.lastBelowThresholdTime = null
    }

    return null
  }

  private checkNoteChange(
    frame: TechniqueFrame,
    isSignalPresent: boolean,
    now: number,
  ): SegmenterEvent | null {
    if (isSignalPresent && frame.noteName !== this.currentNoteName) {
      if (!this.pendingNoteName) {
        this.pendingNoteName = frame.noteName
        this.pendingSince = now
      } else if (this.pendingNoteName === frame.noteName && now - (this.pendingSince ?? 0) >= 60) {
        // Confirmed: new note stable for ≥60ms
        const previousFrames = [...this.frames]
        this.currentNoteName = frame.noteName
        this.frames = [frame]
        this.pendingNoteName = null
        this.pendingSince = null
        return {
          type: 'NOTE_CHANGE',
          timestamp: now,
          noteName: frame.noteName,
          frames: previousFrames,
        }
      }
    } else {
      // Note returned to current or signal lost: cancel pending change
      this.pendingNoteName = null
      this.pendingSince = null
    }
    return null
  }

  /**
   * Resets segmenter to initial state.
   *
   * @remarks
   * Call between exercises or when audio context is recreated.
   * Discards all buffered frames and resets internal timers.
   */
  reset() {
    this.state = 'SILENCE'
    this.currentNoteName = null
    this.frames = []
    this.gapFrames = []
    this.lastAboveThresholdTime = null
    this.lastBelowThresholdTime = null
    this.pendingNoteName = null
    this.pendingSince = null
  }
}
