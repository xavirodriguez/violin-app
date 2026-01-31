/**
 * Calculates technical observations in real time based on the history
 * of recent detections (without waiting to complete the note).
 */

import { DetectedNote } from './practice-core'
import { Observation } from './technique-types'

/**
 * Calculates live observations that the student can correct
 * WHILE they are playing.
 */
export function calculateLiveObservations(
  recentDetections: DetectedNote[],
  targetPitch: string
): Observation[] {
  if (recentDetections.length < 5) {
    return [] // We need at least 5 frames to detect patterns
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
      confidence: 0.9,
      message: avgCents > 0
        ? 'Consistently sharp'
        : 'Consistently flat',
      tip: avgCents > 0
        ? 'Move your finger slightly down (toward scroll)'
        : 'Move your finger slightly up (toward bridge)',
      evidence: { avgCents }
    })
  }

  // 2. STABILITY ANALYSIS (Oscillation)
  const centsValues = last10.map(d => d.cents)
  const stdDev = calculateStdDev(centsValues)
  const isUnstable = stdDev > 12

  if (isUnstable && !isConsistentlyOff) {
    observations.push({
      type: 'stability',
      severity: 2,
      confidence: 0.85,
      message: 'Pitch is wavering',
      tip: 'Apply steady finger pressure and keep your hand relaxed',
      evidence: { stdDev }
    })
  }

  // 3. INCORRECT NOTE ANALYSIS
  const isWrongNote = last10.every(d => d.pitch !== targetPitch)

  if (isWrongNote) {
    observations.push({
      type: 'intonation',
      severity: 3,
      confidence: 0.95,
      message: `Playing ${last10[0].pitch} instead of ${targetPitch}`,
      tip: 'Check your finger position on the fingerboard',
      evidence: { detectedPitch: last10[0].pitch, targetPitch }
    })
  }

  // 4. LOW CONFIDENCE ANALYSIS (Possible technique issue)
  const avgConfidence = last10.reduce((sum, d) => sum + d.confidence, 0) / last10.length
  const isLowConfidence = avgConfidence < 0.7

  if (isLowConfidence) {
    observations.push({
      type: 'attack',
      severity: 1,
      confidence: 0.7,
      message: 'Weak or unclear tone',
      tip: 'Apply more bow pressure and check contact point',
      evidence: { avgConfidence }
    })
  }

  // Prioritize observations (most severe and confident first)
  return observations
    .sort((a, b) => (b.severity * b.confidence) - (a.severity * a.confidence))
    .slice(0, 2) // Maximum 2 simultaneous observations
}

function calculateStdDev(values: number[]): number {
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length
  const squareDiffs = values.map(v => (v - mean) ** 2)
  const avgSquareDiff = squareDiffs.reduce((sum, v) => sum + v, 0) / values.length
  return Math.sqrt(avgSquareDiff)
}
