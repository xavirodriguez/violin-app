import { PracticeUIEvent, PracticeStatus } from '@/lib/domain/practice';
interface UsePracticeShortcutsParams {
    status: PracticeStatus;
    dispatch: (event: PracticeUIEvent) => void;
    onToggleZenMode: () => void;
}
/**
 * Hook to manage keyboard shortcuts for the practice session.
 */
export declare function usePracticeShortcuts(params: UsePracticeShortcutsParams): void;
export {};
