import { type CompletedPracticeSession } from '@/lib/domain/practice';
interface PracticeCompletionProps {
    onRestart: () => void;
    sessionData: CompletedPracticeSession | undefined;
}
export declare function PracticeCompletion({ onRestart, sessionData }: PracticeCompletionProps): import("react/jsx-runtime").JSX.Element;
export {};
