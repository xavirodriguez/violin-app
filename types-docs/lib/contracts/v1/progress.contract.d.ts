import { z } from 'zod';
export declare const ProgressContractV1: z.ZodObject<{
    schemaVersion: z.ZodLiteral<1>;
    state: z.ZodObject<{
        schemaVersion: z.ZodDefault<z.ZodLiteral<1>>;
        totalPracticeSessions: z.ZodNumber;
        totalPracticeTime: z.ZodNumber;
        exercisesCompleted: z.ZodArray<z.ZodString, "many">;
        currentStreak: z.ZodNumber;
        longestStreak: z.ZodNumber;
        intonationSkill: z.ZodNumber;
        rhythmSkill: z.ZodNumber;
        overallSkill: z.ZodNumber;
        exerciseStats: z.ZodRecord<z.ZodString, z.ZodObject<{
            exerciseId: z.ZodString;
            timesCompleted: z.ZodNumber;
            bestAccuracy: z.ZodNumber;
            averageAccuracy: z.ZodNumber;
            fastestCompletionMs: z.ZodNumber;
            lastPracticedMs: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            lastPracticedMs: number;
            exerciseId: string;
            timesCompleted: number;
            bestAccuracy: number;
            averageAccuracy: number;
            fastestCompletionMs: number;
        }, {
            lastPracticedMs: number;
            exerciseId: string;
            timesCompleted: number;
            bestAccuracy: number;
            averageAccuracy: number;
            fastestCompletionMs: number;
        }>>;
        eventBuffer: z.ZodDefault<z.ZodArray<z.ZodObject<{
            ts: z.ZodNumber;
            exerciseId: z.ZodString;
            accuracy: z.ZodNumber;
            rhythmErrorMs: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            accuracy: number;
            exerciseId: string;
            ts: number;
            rhythmErrorMs: number;
        }, {
            accuracy: number;
            exerciseId: string;
            ts: number;
            rhythmErrorMs: number;
        }>, "many">>;
        snapshots: z.ZodDefault<z.ZodArray<z.ZodObject<{
            userId: z.ZodString;
            window: z.ZodEnum<["7d", "30d", "all"]>;
            aggregates: z.ZodObject<{
                intonation: z.ZodNumber;
                rhythm: z.ZodNumber;
                overall: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                intonation: number;
                rhythm: number;
                overall: number;
            }, {
                intonation: number;
                rhythm: number;
                overall: number;
            }>;
            lastSessionId: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            userId: string;
            window: "all" | "7d" | "30d";
            aggregates: {
                intonation: number;
                rhythm: number;
                overall: number;
            };
            lastSessionId: string;
        }, {
            userId: string;
            window: "all" | "7d" | "30d";
            aggregates: {
                intonation: number;
                rhythm: number;
                overall: number;
            };
            lastSessionId: string;
        }>, "many">>;
        eventCounter: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        exerciseStats: Record<string, {
            lastPracticedMs: number;
            exerciseId: string;
            timesCompleted: number;
            bestAccuracy: number;
            averageAccuracy: number;
            fastestCompletionMs: number;
        }>;
        currentStreak: number;
        longestStreak: number;
        schemaVersion: 1;
        totalPracticeSessions: number;
        totalPracticeTime: number;
        exercisesCompleted: string[];
        intonationSkill: number;
        rhythmSkill: number;
        overallSkill: number;
        eventBuffer: {
            accuracy: number;
            exerciseId: string;
            ts: number;
            rhythmErrorMs: number;
        }[];
        snapshots: {
            userId: string;
            window: "all" | "7d" | "30d";
            aggregates: {
                intonation: number;
                rhythm: number;
                overall: number;
            };
            lastSessionId: string;
        }[];
        eventCounter: number;
    }, {
        exerciseStats: Record<string, {
            lastPracticedMs: number;
            exerciseId: string;
            timesCompleted: number;
            bestAccuracy: number;
            averageAccuracy: number;
            fastestCompletionMs: number;
        }>;
        currentStreak: number;
        longestStreak: number;
        totalPracticeSessions: number;
        totalPracticeTime: number;
        exercisesCompleted: string[];
        intonationSkill: number;
        rhythmSkill: number;
        overallSkill: number;
        schemaVersion?: 1 | undefined;
        eventBuffer?: {
            accuracy: number;
            exerciseId: string;
            ts: number;
            rhythmErrorMs: number;
        }[] | undefined;
        snapshots?: {
            userId: string;
            window: "all" | "7d" | "30d";
            aggregates: {
                intonation: number;
                rhythm: number;
                overall: number;
            };
            lastSessionId: string;
        }[] | undefined;
        eventCounter?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    state: {
        exerciseStats: Record<string, {
            lastPracticedMs: number;
            exerciseId: string;
            timesCompleted: number;
            bestAccuracy: number;
            averageAccuracy: number;
            fastestCompletionMs: number;
        }>;
        currentStreak: number;
        longestStreak: number;
        schemaVersion: 1;
        totalPracticeSessions: number;
        totalPracticeTime: number;
        exercisesCompleted: string[];
        intonationSkill: number;
        rhythmSkill: number;
        overallSkill: number;
        eventBuffer: {
            accuracy: number;
            exerciseId: string;
            ts: number;
            rhythmErrorMs: number;
        }[];
        snapshots: {
            userId: string;
            window: "all" | "7d" | "30d";
            aggregates: {
                intonation: number;
                rhythm: number;
                overall: number;
            };
            lastSessionId: string;
        }[];
        eventCounter: number;
    };
    schemaVersion: 1;
}, {
    state: {
        exerciseStats: Record<string, {
            lastPracticedMs: number;
            exerciseId: string;
            timesCompleted: number;
            bestAccuracy: number;
            averageAccuracy: number;
            fastestCompletionMs: number;
        }>;
        currentStreak: number;
        longestStreak: number;
        totalPracticeSessions: number;
        totalPracticeTime: number;
        exercisesCompleted: string[];
        intonationSkill: number;
        rhythmSkill: number;
        overallSkill: number;
        schemaVersion?: 1 | undefined;
        eventBuffer?: {
            accuracy: number;
            exerciseId: string;
            ts: number;
            rhythmErrorMs: number;
        }[] | undefined;
        snapshots?: {
            userId: string;
            window: "all" | "7d" | "30d";
            aggregates: {
                intonation: number;
                rhythm: number;
                overall: number;
            };
            lastSessionId: string;
        }[] | undefined;
        eventCounter?: number | undefined;
    };
    schemaVersion: 1;
}>;
