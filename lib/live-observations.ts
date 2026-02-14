import { DetectedNote } from './practice-core'
import { Observation, Ratio01 } from './technique-types'

/**
 * Calculates real-time technical observations based on a history of recent detections.
 *
 * @remarks
 * This function is a core part of the pedagogical feedback loop. It processes high-frequency
 * pitch detection data into actionable, human-readable advice.
 *
 * **Analysis Domains**:
 * 1. **Persistent Intonation**: Detects systematic sharp/flat tendencies using mean deviation.
 * 2. **Pitch Stability**: Measures "jitter" or micro-variations using standard deviation.
 * 3. **Note Accuracy**: Direct comparison against target scientific pitch notation.
 * 4. **Tone Quality**: Infers clarity from the detector's confidence/signal-to-noise ratio.
 *
 * **Implementation Details**:
 * - Uses a sliding window of the last 10 frames (minimum 5 required for results).
 * - Implements a priority-based sorting to avoid "feedback overload".
 * - Metrics are normalized to the {@link Observation} interface.
 *
 * **Prioritization**:
 * To avoid overwhelming the student, only the top 2 most relevant observations are returned,
 * sorted by a combination of severity and confidence.
 *
 * @param recentDetections - Readonly array of recently detected notes/frames from the pipeline.
 *                           Expected to be in chronological order (newest first).
 * @param targetPitch - The scientific pitch name (e.g., "A4") of the currently practiced note.
 * @returns An array of {@link Observation} objects, prioritized and limited to the top 2 most relevant ones.
 *          Returns an empty array if there is insufficient data or signal is lost.
 *
 * @public
 */
export function calculateLiveObservations(
  recentDetections: readonly DetectedNote[],
  targetPitch: string
): Observation[] {
  if (recentDetections.length < 5) {
    return [] // Need at least 5 frames to detect patterns reliably
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
  // Evaluates micro-variations in pitch. High jitter often indicates
  // poor finger pressure or bow control.
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
  // Low confidence from the detector often correlates with poor tone
  // production (e.g., scratchy bow, weak signal, or room noise).
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
  // Limited to 2 concurrent observations to avoid overwhelming the student.
  return observations
    .sort((a, b) => (b.severity * b.confidence) - (a.severity * a.confidence))
    .slice(0, 2)
}

/**
 * Calculates the standard deviation of an array of numbers.
 *
 * @remarks
 * Standard deviation is used here to quantify pitch jitter. High SD values
 * correlate with technical instability in the student's left hand or bow arm.
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
