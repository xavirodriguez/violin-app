import { logger } from './logger'

export type PitchDebugEvent =
  | { stage: 'raw_audio'; rms: number; timestamp: number }
  | { stage: 'yin_silent'; rms: number; threshold: number; timestamp: number }
  | { stage: 'yin_no_pitch'; rms: number; confidence: number; timestamp: number }
  | { stage: 'yin_out_of_range'; pitchHz: number; minHz: number; maxHz: number; timestamp: number }
  | { stage: 'yin_detected'; pitchHz: number; confidence: number; rms: number; timestamp: number }
  | {
      stage: 'quality_rejected'
      reason: 'low_rms' | 'low_confidence' | 'unpitched'
      rms: number
      confidence: number
      noteName: string
      timestamp: number
    }
  | {
      stage: 'quality_passed'
      noteName: string
      cents: number
      rms: number
      confidence: number
      timestamp: number
    }
  | {
      stage: 'segmenter_frame'
      segmenterState: 'SILENCE' | 'NOTE'
      isSignal: boolean
      isSilence: boolean
      timestamp: number
    }
  | {
      stage: 'segmenter_event'
      eventType: 'ONSET' | 'OFFSET' | 'NOTE_CHANGE'
      noteName: string
      timestamp: number
    }
  | {
      stage: 'match_check'
      detectedNote: string
      targetNote: string
      cents: number
      centsTolerance: number
      durationMs: number
      requiredHoldTime: number
      passed: boolean
      timestamp: number
    }

type DebugListener = (event: PitchDebugEvent) => void
const listeners: DebugListener[] = []

export const pitchDebugBus = {
  emit: (event: PitchDebugEvent) => {
    try {
      // Log all events at debug level
      logger.debug(`Pitch Debug: ${event.stage}`, { ...event })

      // Notify listeners
      for (const listener of listeners) {
        try {
          listener(event)
        } catch (error) {
          // Listeners should not break the pipeline
          console.error('Error in pitchDebugBus listener:', error)
        }
      }
    } catch (error) {
      // Ensure emit itself never throws
      console.error('Error emitting pitch debug event:', error)
    }
  },

  subscribe: (listener: DebugListener) => {
    listeners.push(listener)
    return () => {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  },
}
