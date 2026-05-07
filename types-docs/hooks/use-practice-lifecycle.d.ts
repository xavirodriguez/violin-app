/**
 * usePracticeLifecycle
 *
 * Orchestrates the lifecycle of a practice session.
 */
import { ScoreViewPort } from '@/lib/ports/score-view.port';
import { PracticeUIEvent, PracticeStatus } from '@/lib/domain/practice';
interface LifecycleParams {
    dispatch: (event: PracticeUIEvent) => void;
    onToggleZenMode: () => void;
    scoreView: ScoreViewPort;
    status: PracticeStatus;
    currentNoteIndex: number;
}
export declare function usePracticeLifecycle(params: LifecycleParams): void;
export {};
