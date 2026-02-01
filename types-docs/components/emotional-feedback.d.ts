interface EmotionalFeedbackProps {
    centsOff: number | null;
    isInTune: boolean;
    noteMatches: boolean;
    status: string;
}
/**
 * Componente que proporciona feedback emocional visual
 * adaptado al nivel de experiencia del usuario
 */
export declare function EmotionalFeedback({ centsOff, isInTune, noteMatches, status }: EmotionalFeedbackProps): import("react/jsx-runtime").JSX.Element;
export {};
