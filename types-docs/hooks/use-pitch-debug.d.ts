import { type PitchDebugEvent } from '@/lib/observability/pitch-debug';
/**
 * Hook to subscribe to pitch debug events.
 * Maintains a history of the last N events.
 *
 * @param maxEvents - Maximum number of events to keep in history.
 * @returns An array of PitchDebugEvent objects.
 */
export declare function usePitchDebug(maxEvents?: number): PitchDebugEvent[];
