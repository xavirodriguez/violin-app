import { z } from 'zod';
export declare const PracticeContractV1: z.ZodObject<{
    schemaVersion: z.ZodLiteral<1>;
    session: z.ZodObject<{
        id: z.ZodString;
        startTimeMs: z.ZodNumber;
        endTimeMs: z.ZodNumber;
        durationMs: z.ZodNumber;
        exerciseId: z.ZodString;
        exerciseName: z.ZodString;
        mode: z.ZodEnum<["tuner", "practice"]>;
        noteResults: z.ZodArray<z.ZodObject<{
            noteIndex: z.ZodNumber;
            targetPitch: z.ZodString;
            attempts: z.ZodNumber;
            timeToCompleteMs: z.ZodOptional<z.ZodNumber>;
            averageCents: z.ZodNumber;
            wasInTune: z.ZodBoolean;
            technique: z.ZodOptional<z.ZodObject<{
                vibrato: z.ZodObject<{
                    present: z.ZodBoolean;
                    rateHz: z.ZodNumber;
                    widthCents: z.ZodNumber;
                    regularity: z.ZodNumber;
                }, "strip", z.ZodTypeAny, {
                    rateHz: number;
                    widthCents: number;
                    regularity: number;
                    present: boolean;
                }, {
                    rateHz: number;
                    widthCents: number;
                    regularity: number;
                    present: boolean;
                }>;
                pitchStability: z.ZodObject<{
                    settlingStdCents: z.ZodNumber;
                    globalStdCents: z.ZodNumber;
                    driftCentsPerSec: z.ZodNumber;
                    inTuneRatio: z.ZodNumber;
                }, "strip", z.ZodTypeAny, {
                    settlingStdCents: number;
                    globalStdCents: number;
                    driftCentsPerSec: number;
                    inTuneRatio: number;
                }, {
                    settlingStdCents: number;
                    globalStdCents: number;
                    driftCentsPerSec: number;
                    inTuneRatio: number;
                }>;
                rhythm: z.ZodObject<{
                    onsetErrorMs: z.ZodOptional<z.ZodNumber>;
                    durationErrorMs: z.ZodOptional<z.ZodNumber>;
                }, "strip", z.ZodTypeAny, {
                    onsetErrorMs?: number | undefined;
                    durationErrorMs?: number | undefined;
                }, {
                    onsetErrorMs?: number | undefined;
                    durationErrorMs?: number | undefined;
                }>;
            }, "strip", z.ZodTypeAny, {
                vibrato: {
                    rateHz: number;
                    widthCents: number;
                    regularity: number;
                    present: boolean;
                };
                rhythm: {
                    onsetErrorMs?: number | undefined;
                    durationErrorMs?: number | undefined;
                };
                pitchStability: {
                    settlingStdCents: number;
                    globalStdCents: number;
                    driftCentsPerSec: number;
                    inTuneRatio: number;
                };
            }, {
                vibrato: {
                    rateHz: number;
                    widthCents: number;
                    regularity: number;
                    present: boolean;
                };
                rhythm: {
                    onsetErrorMs?: number | undefined;
                    durationErrorMs?: number | undefined;
                };
                pitchStability: {
                    settlingStdCents: number;
                    globalStdCents: number;
                    driftCentsPerSec: number;
                    inTuneRatio: number;
                };
            }>>;
        }, "strip", z.ZodTypeAny, {
            noteIndex: number;
            targetPitch: string;
            wasInTune: boolean;
            averageCents: number;
            attempts: number;
            timeToCompleteMs?: number | undefined;
            technique?: {
                vibrato: {
                    rateHz: number;
                    widthCents: number;
                    regularity: number;
                    present: boolean;
                };
                rhythm: {
                    onsetErrorMs?: number | undefined;
                    durationErrorMs?: number | undefined;
                };
                pitchStability: {
                    settlingStdCents: number;
                    globalStdCents: number;
                    driftCentsPerSec: number;
                    inTuneRatio: number;
                };
            } | undefined;
        }, {
            noteIndex: number;
            targetPitch: string;
            wasInTune: boolean;
            averageCents: number;
            attempts: number;
            timeToCompleteMs?: number | undefined;
            technique?: {
                vibrato: {
                    rateHz: number;
                    widthCents: number;
                    regularity: number;
                    present: boolean;
                };
                rhythm: {
                    onsetErrorMs?: number | undefined;
                    durationErrorMs?: number | undefined;
                };
                pitchStability: {
                    settlingStdCents: number;
                    globalStdCents: number;
                    driftCentsPerSec: number;
                    inTuneRatio: number;
                };
            } | undefined;
        }>, "many">;
        notesAttempted: z.ZodNumber;
        notesCompleted: z.ZodNumber;
        accuracy: z.ZodNumber;
        averageCents: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        accuracy: number;
        id: string;
        exerciseId: string;
        exerciseName: string;
        mode: "practice" | "tuner";
        noteResults: {
            noteIndex: number;
            targetPitch: string;
            wasInTune: boolean;
            averageCents: number;
            attempts: number;
            timeToCompleteMs?: number | undefined;
            technique?: {
                vibrato: {
                    rateHz: number;
                    widthCents: number;
                    regularity: number;
                    present: boolean;
                };
                rhythm: {
                    onsetErrorMs?: number | undefined;
                    durationErrorMs?: number | undefined;
                };
                pitchStability: {
                    settlingStdCents: number;
                    globalStdCents: number;
                    driftCentsPerSec: number;
                    inTuneRatio: number;
                };
            } | undefined;
        }[];
        durationMs: number;
        endTimeMs: number;
        startTimeMs: number;
        notesAttempted: number;
        notesCompleted: number;
        averageCents: number;
    }, {
        accuracy: number;
        id: string;
        exerciseId: string;
        exerciseName: string;
        mode: "practice" | "tuner";
        noteResults: {
            noteIndex: number;
            targetPitch: string;
            wasInTune: boolean;
            averageCents: number;
            attempts: number;
            timeToCompleteMs?: number | undefined;
            technique?: {
                vibrato: {
                    rateHz: number;
                    widthCents: number;
                    regularity: number;
                    present: boolean;
                };
                rhythm: {
                    onsetErrorMs?: number | undefined;
                    durationErrorMs?: number | undefined;
                };
                pitchStability: {
                    settlingStdCents: number;
                    globalStdCents: number;
                    driftCentsPerSec: number;
                    inTuneRatio: number;
                };
            } | undefined;
        }[];
        durationMs: number;
        endTimeMs: number;
        startTimeMs: number;
        notesAttempted: number;
        notesCompleted: number;
        averageCents: number;
    }>;
}, "strip", z.ZodTypeAny, {
    schemaVersion: 1;
    session: {
        accuracy: number;
        id: string;
        exerciseId: string;
        exerciseName: string;
        mode: "practice" | "tuner";
        noteResults: {
            noteIndex: number;
            targetPitch: string;
            wasInTune: boolean;
            averageCents: number;
            attempts: number;
            timeToCompleteMs?: number | undefined;
            technique?: {
                vibrato: {
                    rateHz: number;
                    widthCents: number;
                    regularity: number;
                    present: boolean;
                };
                rhythm: {
                    onsetErrorMs?: number | undefined;
                    durationErrorMs?: number | undefined;
                };
                pitchStability: {
                    settlingStdCents: number;
                    globalStdCents: number;
                    driftCentsPerSec: number;
                    inTuneRatio: number;
                };
            } | undefined;
        }[];
        durationMs: number;
        endTimeMs: number;
        startTimeMs: number;
        notesAttempted: number;
        notesCompleted: number;
        averageCents: number;
    };
}, {
    schemaVersion: 1;
    session: {
        accuracy: number;
        id: string;
        exerciseId: string;
        exerciseName: string;
        mode: "practice" | "tuner";
        noteResults: {
            noteIndex: number;
            targetPitch: string;
            wasInTune: boolean;
            averageCents: number;
            attempts: number;
            timeToCompleteMs?: number | undefined;
            technique?: {
                vibrato: {
                    rateHz: number;
                    widthCents: number;
                    regularity: number;
                    present: boolean;
                };
                rhythm: {
                    onsetErrorMs?: number | undefined;
                    durationErrorMs?: number | undefined;
                };
                pitchStability: {
                    settlingStdCents: number;
                    globalStdCents: number;
                    driftCentsPerSec: number;
                    inTuneRatio: number;
                };
            } | undefined;
        }[];
        durationMs: number;
        endTimeMs: number;
        startTimeMs: number;
        notesAttempted: number;
        notesCompleted: number;
        averageCents: number;
    };
}>;
