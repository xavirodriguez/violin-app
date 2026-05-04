import { Language, translations } from './i18n'

/**
 * Generates an actionable feedback message for the tuner based on detected pitch deviation.
 *
 * @param cents - Deviation in cents from the target note.
 * @param confidence - Detection confidence (0-1).
 * @param lang - Target language.
 * @param thresholds - Configurable thresholds for feedback categories.
 * @returns A translated, human-friendly message.
 */
export function getTunerFeedbackMessage(
  cents: number | undefined,
  confidence: number | undefined,
  lang: Language,
  thresholds: {
    tooLow: number
    bitLow: number
    bitHigh: number
    tooHigh: number
  } = {
    tooLow: -35,
    bitLow: -10,
    bitHigh: 10,
    tooHigh: 35,
  },
): string {
  const t = translations[lang].tuner

  if (confidence === undefined || confidence < 0.5) {
    return t.playNote
  }

  if (confidence < 0.8) {
    return t.weakSignal
  }

  if (cents === undefined) {
    return t.playNote
  }

  if (cents < thresholds.tooLow) {
    return t.tooLow
  }
  if (cents < thresholds.bitLow) {
    return t.bitLow
  }
  if (cents <= thresholds.bitHigh) {
    return t.inTune
  }
  if (cents <= thresholds.tooHigh) {
    return t.bitHigh
  }
  return t.tooHigh
}
