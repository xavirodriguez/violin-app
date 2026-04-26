import { AudioLoopPort, PitchDetectionPort } from '@/lib/ports/audio.port';
import type { PracticeState, PracticeEvent } from '@/lib/practice-core';
/**
 * Hook to encapsulate the high-frequency audio pipeline lifecycle.
 * Refactored to satisfy Senior Software Craftsmanship 5-15 line limits.
 */
export declare function usePracticePipeline({ practiceState, audioLoop, detector, consumePipelineEvents, }: {
    practiceState: PracticeState | undefined;
    audioLoop: AudioLoopPort | undefined;
    detector: PitchDetectionPort | undefined;
    consumePipelineEvents: (pipeline: AsyncIterable<PracticeEvent>) => Promise<void>;
}): void;
