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

export type SegmenterEvent =
  | { type: 'ONSET'; timestamp: number; noteName: string; gapFrames: TechniqueFrame[] }
  | { type: 'OFFSET'; timestamp: number; frames: TechniqueFrame[] }
  | { type: 'NOTE_CHANGE'; timestamp: number; noteName: string; frames: TechniqueFrame[] }

export class NoteSegmenter {
  private options: SegmenterOptions
  private state: 'SILENCE' | 'NOTE' = 'SILENCE'
  private currentNoteName: string | null = null
  private frames: TechniqueFrame[] = []
  private gapFrames: TechniqueFrame[] = []

  private lastAboveThresholdTime: number | null = null
  private lastBelowThresholdTime: number | null = null

  constructor(options: Partial<SegmenterOptions> = {}) {
    this.options = { ...defaultOptions, ...options }
  }

  processFrame(frame: TechniqueFrame): SegmenterEvent | null {
    const isSignalPresent = frame.rms > this.options.minRms && frame.confidence > this.options.minConfidence
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
          frames: previousFrames
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

  reset() {
    this.state = 'SILENCE'
    this.currentNoteName = null
    this.frames = []
    this.gapFrames = []
    this.lastAboveThresholdTime = null
    this.lastBelowThresholdTime = null
  }
}
