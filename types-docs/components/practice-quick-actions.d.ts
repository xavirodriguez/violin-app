interface PracticeQuickActionsProps {
    status: string;
    onRepeatNote: () => void;
    onRepeatMeasure: () => void;
    onContinue: () => void;
    onTogglePause: () => void;
    onToggleZen: () => void;
    isZen: boolean;
}
export declare function PracticeQuickActions({ status, onRepeatNote, onRepeatMeasure, onContinue, onTogglePause, onToggleZen, isZen }: PracticeQuickActionsProps): import("react/jsx-runtime").JSX.Element;
export {};
