export type DebugEvent =
  | {
      type: 'RAW_PITCH'
      timestamp: number
      pitchHz: number
      confidence: number
      rms: number
    }
  | {
      type: 'DETECTION_QUALITY'
      timestamp: number
      passed: boolean
      reason?: string
      pitchHz: number
      rms: number
      confidence: number
      cents: number
    }
  | {
      type: 'SEGMENTER_STATE'
      timestamp: number
      state: 'SILENCE' | 'NOTE'
      event?: 'ONSET' | 'OFFSET' | 'NOTE_CHANGE'
    }
  | {
      type: 'SEGMENT_EVALUATED'
      timestamp: number
      noteName: string
      durationMs: number
      requiredHoldTime: number
      centsDev: number
      centsTolerance: number
      passed: boolean
      failReason?: string
    }
  | {
      type: 'PRACTICE_EVENT'
      timestamp: number
      eventType: string
      currentIndex: number
      status: string
    }
  | {
      type: 'PIPELINE_INSTANCE'
      timestamp: number
      source: 'hook' | 'runner'
      action: 'created' | 'destroyed'
    }
  | {
      type: 'STATE_TRANSITION'
      timestamp: number
      from: string
      to: string
      trigger: string
    }
