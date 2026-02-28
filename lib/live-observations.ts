import { DetectedNote } from './practice-core'
import { Observation, Ratio01 } from './technique-types'

/**
 * Calculates real-time technical observations based on a history of recent detections.
 *
 * @remarks
 * This function is a core part of the pedagogical feedback loop. It processes high-frequency
 * pitch detection data into actionable, human-readable advice.
 *
 * @param recentDetections - Readonly array of recently detected notes/frames from the pipeline.
 *                           Expected to be in chronological order (newest first).
 * @param targetPitch - The scientific pitch name (e.g., "A4") of the currently practiced note.
 * @returns An array of {@link Observation} objects, prioritized and limited to the top 2.
 *
 * @public
 */
export function calculateLiveObservations(
  recentDetections: readonly DetectedNote[],
  targetPitch: string,
): Observation[] {
  if (recentDetections.length < 5) {
    return []
  }

  const last10 = recentDetections.slice(0, 10)
  const observations: (Observation | undefined)[] = [
    analyzeIntonation(last10),
    analyzeStability(last10),
    analyzeNoteAccuracy(last10, targetPitch),
    analyzeToneQuality(last10),
  ]

  return prioritizeObservations(observations.filter((o): o is Observation => o !== undefined))
}

function analyzeIntonation(detections: readonly DetectedNote[]): Observation | undefined {
  const avgCents = detections.reduce((sum, d) => sum + d.cents, 0) / detections.length
  if (Math.abs(avgCents) <= 15) return undefined

  return {
    type: 'intonation',
    severity: 2,
    confidence: 0.9 as Ratio01,
    message: avgCents > 0 ? 'Consistently sharp' : 'Consistently flat',
    tip: avgCents > 0
      ? 'Move your finger slightly down (toward scroll)'
      : 'Move your finger slightly up (toward bridge)',
    evidence: { avgCents },
  }
}

function analyzeStability(detections: readonly DetectedNote[]): Observation | undefined {
  const centsValues = detections.map((d) => d.cents)
  const stdDev = calculateStdDev(centsValues)
  const avgCents = detections.reduce((sum, d) => sum + d.cents, 0) / detections.length

  if (stdDev <= 12 || Math.abs(avgCents) > 15) return undefined

  return {
    type: 'stability',
    severity: 2,
    confidence: 0.85 as Ratio01,
    message: 'Pitch is wavering',
    tip: 'Apply steady finger pressure and keep your hand relaxed',
    evidence: { stdDev },
  }
}

function analyzeNoteAccuracy(
  detections: readonly DetectedNote[],
  targetPitch: string,
): Observation | undefined {
  const isWrongNote = detections.every((d) => d.pitch !== targetPitch)
  if (!isWrongNote) return undefined

  return {
    type: 'intonation',
    severity: 3,
    confidence: 0.95 as Ratio01,
    message: `Playing ${detections[0].pitch} instead of ${targetPitch}`,
    tip: 'Check your finger position on the fingerboard',
    evidence: { detectedPitch: detections[0].pitch, targetPitch },
  }
}

function analyzeToneQuality(detections: readonly DetectedNote[]): Observation | undefined {
  const avgConfidence = detections.reduce((sum, d) => sum + d.confidence, 0) / detections.length
  if (avgConfidence >= 0.7) return undefined

  return {
    type: 'attack',
    severity: 1,
    confidence: 0.7 as Ratio01,
    message: 'Weak or unclear tone',
    tip: 'Apply more bow pressure and check contact point',
    evidence: { avgConfidence },
  }
}

function prioritizeObservations(observations: Observation[]): Observation[] {
  return observations
    .sort((a, b) => b.severity * b.confidence - a.severity * a.confidence)
    .slice(0, 2)
}

/**
 * Calculates the standard deviation of an array of numbers.
 * @internal
 */
function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length
  return Math.sqrt(variance)
}
