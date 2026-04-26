import { useOSMDSafe } from '@/hooks/use-osmd-safe';
/**
 * Custom hook to manage keyboard shortcuts and cursor synchronization for the practice session.
 *
 * @param params - Hook dependencies including state and actions.
 */
export declare function usePracticeUIEffects(params: {
    status: string;
    currentNoteIndex: number;
    start: () => void;
    stop: () => void;
    setZenMode: (v: (prev: boolean) => boolean) => void;
    osmdHook: ReturnType<typeof useOSMDSafe>;
}): void;
