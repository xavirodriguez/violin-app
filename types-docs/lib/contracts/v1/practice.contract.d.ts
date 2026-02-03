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
                    present: boolean;
                    rateHz: number;
                    widthCents: number;
                    regularity: number;
                }, {
                    present: boolean;
                    rateHz: number;
                    widthCents: number;
                    regularity: number;
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
                    present: boolean;
                    rateHz: number;
                    widthCents: number;
                    regularity: number;
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
                    present: boolean;
                    rateHz: number;
                    widthCents: number;
                    regularity: number;
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
            averageCents: number;
            noteIndex: number;
            targetPitch: string;
            attempts: number;
            wasInTune: boolean;
            timeToCompleteMs?: number | undefined;
            technique?: {
                vibrato: {
                    present: boolean;
                    rateHz: number;
                    widthCents: number;
                    regularity: number;
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
            averageCents: number;
            noteIndex: number;
            targetPitch: string;
            attempts: number;
            wasInTune: boolean;
            timeToCompleteMs?: number | undefined;
            technique?: {
                vibrato: {
                    present: boolean;
                    rateHz: number;
                    widthCents: number;
                    regularity: number;
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
        startTimeMs: number;
        endTimeMs: number;
        id: string;
        durationMs: number;
        noteResults: {
            averageCents: number;
            noteIndex: number;
            targetPitch: string;
            attempts: number;
            wasInTune: boolean;
            timeToCompleteMs?: number | undefined;
            technique?: {
                vibrato: {
                    present: boolean;
                    rateHz: number;
                    widthCents: number;
                    regularity: number;
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
        exerciseId: string;
        exerciseName: string;
        mode: "practice" | "tuner";
        averageCents: number;
        notesAttempted: number;
        notesCompleted: number;
    }, {
        accuracy: number;
        startTimeMs: number;
        endTimeMs: number;
        id: string;
        durationMs: number;
        noteResults: {
            averageCents: number;
            noteIndex: number;
            targetPitch: string;
            attempts: number;
            wasInTune: boolean;
            timeToCompleteMs?: number | undefined;
            technique?: {
                vibrato: {
                    present: boolean;
                    rateHz: number;
                    widthCents: number;
                    regularity: number;
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
        exerciseId: string;
        exerciseName: string;
        mode: "practice" | "tuner";
        averageCents: number;
        notesAttempted: number;
        notesCompleted: number;
    }>;
}, "strip", z.ZodTypeAny, {
    schemaVersion: 1;
    session: {
        accuracy: number;
        startTimeMs: number;
        endTimeMs: number;
        id: string;
        durationMs: number;
        noteResults: {
            averageCents: number;
            noteIndex: number;
            targetPitch: string;
            attempts: number;
            wasInTune: boolean;
            timeToCompleteMs?: number | undefined;
            technique?: {
                vibrato: {
                    present: boolean;
                    rateHz: number;
                    widthCents: number;
                    regularity: number;
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
        exerciseId: string;
        exerciseName: string;
        mode: "practice" | "tuner";
        averageCents: number;
        notesAttempted: number;
        notesCompleted: number;
    };
}, {
    schemaVersion: 1;
    session: {
        accuracy: number;
        startTimeMs: number;
        endTimeMs: number;
        id: string;
        durationMs: number;
        noteResults: {
            averageCents: number;
            noteIndex: number;
            targetPitch: string;
            attempts: number;
            wasInTune: boolean;
            timeToCompleteMs?: number | undefined;
            technique?: {
                vibrato: {
                    present: boolean;
                    rateHz: number;
                    widthCents: number;
                    regularity: number;
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
        exerciseId: string;
        exerciseName: string;
        mode: "practice" | "tuner";
        averageCents: number;
        notesAttempted: number;
        notesCompleted: number;
    };
}>;
