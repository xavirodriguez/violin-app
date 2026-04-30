import { type PracticeSession } from '@/lib/domain/practice-session';
interface PracticeCompletionProps {
    onRestart: () => void;
    sessionData: PracticeSession | undefined;
}
export declare function PracticeCompletion({ onRestart, sessionData }: PracticeCompletionProps): import("react/jsx-runtime").JSX.Element;
export {};
