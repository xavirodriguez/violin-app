import { DetectedNote } from './practice-core'
import { Observation, Ratio01 } from './technique-types'

/**
 * Calculates real-time technical observations based on a history of recent detections.
 *
 * @remarks
 * Processes high-frequency pitch data into actionable pedagogical advice.
 * Limited to the top 2 most relevant observations by severity and confidence.
 *
 * @param recentDetections - Chronological detections (newest first).
 * @param targetPitch - Target scientific pitch name (e.g., "A4").
 * @returns Prioritized {@link Observation} objects.
 *
 * @public
 */
export function calculateLiveObservations(
  recentDetections: readonly DetectedNote[],
  targetPitch: string
): Observation[] {
  if (recentDetections.length < 5) return []

  const last10 = recentDetections.slice(0, 10)
  const intonation = analyzeIntonation(last10)
  const stability = intonation.length === 0 ? analyzeStability(last10) : []

  const observations: Observation[] = [
    ...intonation,
    ...stability,
    ...analyzeNoteAccuracy(last10, targetPitch),
    ...analyzeToneQuality(last10)
  ]

  return observations
    .sort((a, b) => b.severity * b.confidence - a.severity * a.confidence)
    .slice(0, 2)
}

function analyzeIntonation(detections: readonly DetectedNote[]): Observation[] {
  const avgCents = detections.reduce((sum, d) => sum + d.cents, 0) / detections.length
  if (Math.abs(avgCents) <= 15) return []

  return [{
    type: 'intonation',
    severity: 2,
    confidence: 0.9 as Ratio01,
    message: avgCents > 0 ? 'Consistently sharp' : 'Consistently flat',
    tip: avgCents > 0
      ? 'Move your finger slightly down (toward scroll)'
      : 'Move your finger slightly up (toward bridge)',
    evidence: { avgCents }
  }]
}

function analyzeStability(detections: readonly DetectedNote[]): Observation[] {
  const stdDev = calculateStdDev(detections.map(d => d.cents))
  if (stdDev <= 12) return []

  return [{
    type: 'stability',
    severity: 2,
    confidence: 0.85 as Ratio01,
    message: 'Pitch is wavering',
    tip: 'Apply steady finger pressure and keep your hand relaxed',
    evidence: { stdDev }
  }]
}

function analyzeNoteAccuracy(detections: readonly DetectedNote[], targetPitch: string): Observation[] {
  const isWrongNote = detections.every(d => d.pitch !== targetPitch)
  if (!isWrongNote) return []

  return [{
    type: 'intonation',
    severity: 3,
    confidence: 0.95 as Ratio01,
    message: `Playing ${detections[0].pitch} instead of ${targetPitch}`,
    tip: 'Check your finger position on the fingerboard',
    evidence: { detectedPitch: detections[0].pitch, targetPitch }
  }]
}

function analyzeToneQuality(detections: readonly DetectedNote[]): Observation[] {
  const avgConfidence = detections.reduce((sum, d) => sum + d.confidence, 0) / detections.length
  if (avgConfidence >= 0.7) return []

  return [{
    type: 'attack',
    severity: 1,
    confidence: 0.7 as Ratio01,
    message: 'Weak or unclear tone',
    tip: 'Apply more bow pressure and check contact point',
    evidence: { avgConfidence }
  }]
}

/**
 * Calculates the standard deviation of an array of numbers.
 * @internal
 */
function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length
  const squareDiffs = values.map(v => (v - mean) ** 2)
  const avgSquareDiff = squareDiffs.reduce((sum, v) => sum + v, 0) / values.length
  return Math.sqrt(avgSquareDiff)
}
