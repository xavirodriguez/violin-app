import { DetectedNote } from './practice-core'
import { Observation, Ratio01 } from './technique-types'

/**
 * Calculates real-time technical observations based on a history of recent detections.
 *
 * @remarks
 * This function provides immediate feedback to the student while they are playing,
 * without waiting for the note to be completed. It analyzes patterns in intonation,
 * stability, and accuracy.
 *
 * @param recentDetections - Array of recently detected notes/frames.
 * @param targetPitch - The scientific pitch name (e.g., "A4") of the target note.
 * @returns An array of {@link Observation} objects, limited to the top 2 most relevant ones.
 *
 * @public
 */
export function calculateLiveObservations(
  recentDetections: readonly DetectedNote[],
  targetPitch: string
): Observation[] {
  if (recentDetections.length < 5) {
    return [] // Need at least 5 frames to detect patterns
  }

  const observations: Observation[] = []

  // 1. PERSISTENT INTONATION ANALYSIS
  const last10 = recentDetections.slice(0, 10)
  const avgCents = last10.reduce((sum, d) => sum + d.cents, 0) / last10.length
  const isConsistentlyOff = Math.abs(avgCents) > 15

  if (isConsistentlyOff) {
    observations.push({
      type: 'intonation',
      severity: 2,
      confidence: 0.9 as Ratio01,
      message: avgCents > 0
        ? 'Consistently sharp'
        : 'Consistently flat',
      tip: avgCents > 0
        ? 'Move your finger slightly down (toward scroll)'
        : 'Move your finger slightly up (toward bridge)',
      evidence: { avgCents }
    })
  }

  // 2. STABILITY ANALYSIS (Pitch Jitter)
  const centsValues = last10.map(d => d.cents)
  const stdDev = calculateStdDev(centsValues)
  const isUnstable = stdDev > 12

  if (isUnstable && !isConsistentlyOff) {
    observations.push({
      type: 'stability',
      severity: 2,
      confidence: 0.85 as Ratio01,
      message: 'Pitch is wavering',
      tip: 'Apply steady finger pressure and keep your hand relaxed',
      evidence: { stdDev }
    })
  }

  // 3. WRONG NOTE ANALYSIS
  const isWrongNote = last10.every(d => d.pitch !== targetPitch)

  if (isWrongNote) {
    observations.push({
      type: 'intonation',
      severity: 3,
      confidence: 0.95 as Ratio01,
      message: `Playing ${last10[0].pitch} instead of ${targetPitch}`,
      tip: 'Check your finger position on the fingerboard',
      evidence: { detectedPitch: last10[0].pitch, targetPitch }
    })
  }

  // 4. LOW CONFIDENCE ANALYSIS (Tone Quality)
  const avgConfidence = last10.reduce((sum, d) => sum + d.confidence, 0) / last10.length
  const isLowConfidence = avgConfidence < 0.7

  if (isLowConfidence) {
    observations.push({
      type: 'attack',
      severity: 1,
      confidence: 0.7 as Ratio01,
      message: 'Weak or unclear tone',
      tip: 'Apply more bow pressure and check contact point',
      evidence: { avgConfidence }
    })
  }

  // Prioritize observations (highest severity and confidence first)
  return observations
    .sort((a, b) => (b.severity * b.confidence) - (a.severity * a.confidence))
    .slice(0, 2) // Maximum of 2 concurrent observations to avoid overwhelming the user
}

/**
 * Calculates the standard deviation of an array of numbers.
 *
 * @param values - The numeric values.
 * @returns The standard deviation.
 * @internal
 */
function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length
  const squareDiffs = values.map(v => (v - mean) ** 2)
  const avgSquareDiff = squareDiffs.reduce((sum, v) => sum + v, 0) / values.length
  return Math.sqrt(avgSquareDiff)
}
