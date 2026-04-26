import type { HTMLAttributes, ReactNode, SVGAttributes } from 'react';
import type { Exercise } from '@/lib/exercises/types';
import type { TechniqueFrame } from '@/lib/technique-types';
/** Versión parcial de Exercise para uso en tests unitarios. */
export type MockExercise = Pick<Exercise, 'id' | 'name' | 'notes'> & Partial<Exercise>;
/** AudioResources parcial para mocks en tests, evitando instanciar AudioContext real. */
export type MockAudioResources = {
    context: Pick<AudioContext, 'sampleRate'>;
    analyser: Pick<AnalyserNode, 'fftSize'> & {
        context: Pick<AudioContext, 'sampleRate'>;
    };
    stream: Pick<MediaStream, 'getTracks'>;
};
export interface MotionDivProps extends HTMLAttributes<HTMLDivElement> {
    children?: ReactNode;
}
export interface MotionCircleProps extends SVGAttributes<SVGCircleElement> {
    className?: string;
}
export interface AnimatePresenceProps {
    children?: ReactNode;
}
export interface GlobalThisWithCrypto {
    crypto: Crypto & {
        randomUUID?: () => string;
    };
}
/** Versión mutable de TechniqueFrame para construcción en tests. */
export type MutableTechniqueFrame = {
    -readonly [K in keyof TechniqueFrame]: TechniqueFrame[K];
};
