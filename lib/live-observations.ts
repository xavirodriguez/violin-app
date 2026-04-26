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
  const isTooSmall = recentDetections.length < 5
  if (isTooSmall) return []

  const last10 = recentDetections.slice(0, 10)
  const observations = gatherTechnicalObservations(last10, targetPitch)

  return observations
    .sort((a, b) => b.severity * b.confidence - a.severity * a.confidence)
    .slice(0, 2)
}

function gatherTechnicalObservations(
  detections: readonly DetectedNote[],
  targetPitch: string,
): Observation[] {
  const intonation = analyzeIntonation(detections)
  const stability = intonation.length === 0 ? analyzeStability(detections) : []
  const accuracy = analyzeNoteAccuracy(detections, targetPitch)
  const tone = analyzeToneQuality(detections)

  return [...intonation, ...stability, ...accuracy, ...tone]
}

function analyzeIntonation(detections: readonly DetectedNote[]): Observation[] {
  const sum = detections.reduce((acc, d) => acc + d.cents, 0)
  const avgCents = sum / detections.length
  const isCorrect = Math.abs(avgCents) <= 15

  if (isCorrect) {
    return []
  }

  return [createIntonationObservation(avgCents)]
}

function createIntonationObservation(avgCents: number): Observation {
  const isSharp = avgCents > 0
  const message = isSharp ? 'Consistently sharp' : 'Consistently flat'
  const tip = isSharp
    ? 'Move your finger slightly down (toward scroll)'
    : 'Move your finger slightly up (toward bridge)'

  return {
    type: 'intonation',
    severity: 2,
    confidence: 0.9 as Ratio01,
    message,
    tip,
    evidence: { avgCents },
  }
}

function analyzeStability(detections: readonly DetectedNote[]): Observation[] {
  const cents = detections.map((d) => d.cents)
  const stdDev = calculateStdDev(cents)
  const isStable = stdDev <= 12

  if (isStable) {
    return []
  }

  return [createStabilityObservation(stdDev)]
}

function createStabilityObservation(stdDev: number): Observation {
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
): Observation[] {
  const isWrongNote = detections.every((d) => d.pitch !== targetPitch)

  if (!isWrongNote) {
    return []
  }

  return [createAccuracyObservation(detections[0].pitch, targetPitch)]
}

function createAccuracyObservation(detected: string, target: string): Observation {
  return {
    type: 'intonation',
    severity: 3,
    confidence: 0.95 as Ratio01,
    message: `Playing ${detected} instead of ${target}`,
    tip: 'Check your finger position on the fingerboard',
    evidence: { detectedPitch: detected, targetPitch: target },
  }
}

function analyzeToneQuality(detections: readonly DetectedNote[]): Observation[] {
  const sum = detections.reduce((acc, d) => acc + d.confidence, 0)
  const avgConfidence = sum / detections.length
  const isGood = avgConfidence >= 0.7

  if (isGood) {
    return []
  }

  return [createToneObservation(avgConfidence)]
}

function createToneObservation(avgConfidence: number): Observation {
  return {
    type: 'attack',
    severity: 1,
    confidence: 0.7 as Ratio01,
    message: 'Weak or unclear tone',
    tip: 'Apply more bow pressure and check contact point',
    evidence: { avgConfidence },
  }
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
