import { Language } from './i18n';
/**
 * Generates an actionable feedback message for the tuner based on detected pitch deviation.
 *
 * @param cents - Deviation in cents from the target note.
 * @param confidence - Detection confidence (0-1).
 * @param lang - Target language.
 * @param thresholds - Configurable thresholds for feedback categories.
 * @returns A translated, human-friendly message.
 */
export declare function getTunerFeedbackMessage(cents: number | undefined, confidence: number | undefined, lang: Language, thresholds?: {
    tooLow: number;
    bitLow: number;
    bitHigh: number;
    tooHigh: number;
}): string;
