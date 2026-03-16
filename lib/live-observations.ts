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
  targetPitch: string,
): Observation[] {
  if (recentDetections.length < 5) return []

  const last10 = recentDetections.slice(0, 10)
  const intonation = analyzeIntonation(last10)
  const stability = intonation.length === 0 ? analyzeStability(last10) : []

  const observations: Observation[] = [
    ...intonation,
    ...stability,
    ...analyzeNoteAccuracy(last10, targetPitch),
    ...analyzeToneQuality(last10),
  ]

  return observations
    .sort((a, b) => b.severity * b.confidence - a.severity * a.confidence)
    .slice(0, 2)
}

function analyzeIntonation(detections: readonly DetectedNote[]): Observation[] {
  const sum = detections.reduce((acc, d) => acc + d.cents, 0)
  const avgCents = sum / detections.length
  const isCorrect = Math.abs(avgCents) <= 15

  if (isCorrect) {
    return []
  }

  const observation: Observation = {
    type: 'intonation',
    severity: 2,
    confidence: 0.9 as Ratio01,
    message: avgCents > 0 ? 'Consistently sharp' : 'Consistently flat',
    tip:
      avgCents > 0
        ? 'Move your finger slightly down (toward scroll)'
        : 'Move your finger slightly up (toward bridge)',
    evidence: { avgCents },
  }

  return [observation]
}

function analyzeStability(detections: readonly DetectedNote[]): Observation[] {
  const cents = detections.map((d) => d.cents)
  const stdDev = calculateStdDev(cents)
  const isStable = stdDev <= 12

  if (isStable) {
    return []
  }

  const observation: Observation = {
    type: 'stability',
    severity: 2,
    confidence: 0.85 as Ratio01,
    message: 'Pitch is wavering',
    tip: 'Apply steady finger pressure and keep your hand relaxed',
    evidence: { stdDev },
  }

  return [observation]
}

function analyzeNoteAccuracy(
  detections: readonly DetectedNote[],
  targetPitch: string,
): Observation[] {
  const isWrongNote = detections.every((d) => d.pitch !== targetPitch)

  if (!isWrongNote) {
    return []
  }

  const detected = detections[0].pitch
  const observation: Observation = {
    type: 'intonation',
    severity: 3,
    confidence: 0.95 as Ratio01,
    message: `Playing ${detected} instead of ${targetPitch}`,
    tip: 'Check your finger position on the fingerboard',
    evidence: { detectedPitch: detected, targetPitch },
  }

  return [observation]
}

function analyzeToneQuality(detections: readonly DetectedNote[]): Observation[] {
  const sum = detections.reduce((acc, d) => acc + d.confidence, 0)
  const avgConfidence = sum / detections.length
  const isGood = avgConfidence >= 0.7

  if (isGood) {
    return []
  }

  const observation: Observation = {
    type: 'attack',
    severity: 1,
    confidence: 0.7 as Ratio01,
    message: 'Weak or unclear tone',
    tip: 'Apply more bow pressure and check contact point',
    evidence: { avgConfidence },
  }

  return [observation]
}

/**
 * Calculates the standard deviation of an array of numbers.
 * @internal
 */
function calculateStdDev(values: number[]): number {
  const count = values.length
  if (count === 0) {
    return 0
  }

  const sum = values.reduce((acc, v) => acc + v, 0)
  const mean = sum / count
  const squareDiffs = values.map((v) => (v - mean) ** 2)
  const varianceSum = squareDiffs.reduce((acc, v) => acc + v, 0)
  const avgSquareDiff = varianceSum / count

  return Math.sqrt(avgSquareDiff)
}
