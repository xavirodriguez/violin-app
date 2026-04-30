import { z } from 'zod';
/**
 * Zod schema for validating the technical performance metrics of a single note.
 *
 * @remarks
 * Used for both real-time validation and persistent storage of technique analysis results.
 *
 * @public
 */
export declare const NoteTechniqueSchema: z.ZodObject<{
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
}>;
/**
 * Zod schema for validating the summarized results of practicing a single note.
 *
 * @public
 */
export declare const NoteResultSchema: z.ZodObject<{
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
    attempts: number;
    averageCents: number;
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
    attempts: number;
    averageCents: number;
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
}>;
/**
 * Zod schema for validating a complete practice session.
 *
 * @remarks
 * This schema ensures that session data is durable and can be safely rehydrated
 * from `localStorage`.
 *
 * @public
 */
export declare const PracticeSessionSchema: z.ZodObject<{
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
        attempts: number;
        averageCents: number;
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
        attempts: number;
        averageCents: number;
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
    durationMs: number;
    accuracy: number;
    id: string;
    exerciseId: string;
    exerciseName: string;
    mode: "tuner" | "practice";
    noteResults: {
        noteIndex: number;
        targetPitch: string;
        wasInTune: boolean;
        attempts: number;
        averageCents: number;
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
    endTimeMs: number;
    startTimeMs: number;
    averageCents: number;
    notesAttempted: number;
    notesCompleted: number;
}, {
    durationMs: number;
    accuracy: number;
    id: string;
    exerciseId: string;
    exerciseName: string;
    mode: "tuner" | "practice";
    noteResults: {
        noteIndex: number;
        targetPitch: string;
        wasInTune: boolean;
        attempts: number;
        averageCents: number;
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
    endTimeMs: number;
    startTimeMs: number;
    averageCents: number;
    notesAttempted: number;
    notesCompleted: number;
}>;
/**
 * Zod schema for validating lifetime statistics for an individual exercise.
 *
 * @public
 */
export declare const ExerciseStatsSchema: z.ZodObject<{
    exerciseId: z.ZodString;
    timesCompleted: z.ZodNumber;
    bestAccuracy: z.ZodNumber;
    averageAccuracy: z.ZodNumber;
    fastestCompletionMs: z.ZodNumber;
    lastPracticedMs: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    exerciseId: string;
    fastestCompletionMs: number;
    lastPracticedMs: number;
    timesCompleted: number;
    bestAccuracy: number;
    averageAccuracy: number;
}, {
    exerciseId: string;
    fastestCompletionMs: number;
    lastPracticedMs: number;
    timesCompleted: number;
    bestAccuracy: number;
    averageAccuracy: number;
}>;
export declare const ProgressEventSchema: z.ZodObject<{
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
}>;
export declare const SkillAggregatesSchema: z.ZodObject<{
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
export declare const ProgressSnapshotSchema: z.ZodObject<{
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
    window: "7d" | "30d" | "all";
    aggregates: {
        intonation: number;
        rhythm: number;
        overall: number;
    };
    lastSessionId: string;
}, {
    userId: string;
    window: "7d" | "30d" | "all";
    aggregates: {
        intonation: number;
        rhythm: number;
        overall: number;
    };
    lastSessionId: string;
}>;
/**
 * Zod schema for the entire persistent progress state.
 *
 * @remarks
 * Defines the canonical structure of the user's technical profile in storage.
 *
 * @public
 */
export declare const ProgressStateSchema: z.ZodObject<{
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
        exerciseId: string;
        fastestCompletionMs: number;
        lastPracticedMs: number;
        timesCompleted: number;
        bestAccuracy: number;
        averageAccuracy: number;
    }, {
        exerciseId: string;
        fastestCompletionMs: number;
        lastPracticedMs: number;
        timesCompleted: number;
        bestAccuracy: number;
        averageAccuracy: number;
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
        window: "7d" | "30d" | "all";
        aggregates: {
            intonation: number;
            rhythm: number;
            overall: number;
        };
        lastSessionId: string;
    }, {
        userId: string;
        window: "7d" | "30d" | "all";
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
        exerciseId: string;
        fastestCompletionMs: number;
        lastPracticedMs: number;
        timesCompleted: number;
        bestAccuracy: number;
        averageAccuracy: number;
    }>;
    schemaVersion: 1;
    totalPracticeSessions: number;
    totalPracticeTime: number;
    exercisesCompleted: string[];
    currentStreak: number;
    longestStreak: number;
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
        window: "7d" | "30d" | "all";
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
        exerciseId: string;
        fastestCompletionMs: number;
        lastPracticedMs: number;
        timesCompleted: number;
        bestAccuracy: number;
        averageAccuracy: number;
    }>;
    totalPracticeSessions: number;
    totalPracticeTime: number;
    exercisesCompleted: string[];
    currentStreak: number;
    longestStreak: number;
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
        window: "7d" | "30d" | "all";
        aggregates: {
            intonation: number;
            rhythm: number;
            overall: number;
        };
        lastSessionId: string;
    }[] | undefined;
    eventCounter?: number | undefined;
}>;
/**
 * Zod schema for a single user achievement milestone.
 *
 * @public
 */
export declare const AchievementSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    icon: z.ZodString;
    unlockedAtMs: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: string;
    unlockedAtMs: number;
    icon: string;
    description: string;
    name: string;
}, {
    id: string;
    unlockedAtMs: number;
    icon: string;
    description: string;
    name: string;
}>;
export declare const AchievementsStateSchema: z.ZodObject<{
    schemaVersion: z.ZodDefault<z.ZodLiteral<1>>;
    unlocked: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodString;
        icon: z.ZodString;
        unlockedAtMs: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        id: string;
        unlockedAtMs: number;
        icon: string;
        description: string;
        name: string;
    }, {
        id: string;
        unlockedAtMs: number;
        icon: string;
        description: string;
        name: string;
    }>, "many">;
    pending: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodString;
        icon: z.ZodString;
        unlockedAtMs: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        id: string;
        unlockedAtMs: number;
        icon: string;
        description: string;
        name: string;
    }, {
        id: string;
        unlockedAtMs: number;
        icon: string;
        description: string;
        name: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    schemaVersion: 1;
    unlocked: {
        id: string;
        unlockedAtMs: number;
        icon: string;
        description: string;
        name: string;
    }[];
    pending: {
        id: string;
        unlockedAtMs: number;
        icon: string;
        description: string;
        name: string;
    }[];
}, {
    unlocked: {
        id: string;
        unlockedAtMs: number;
        icon: string;
        description: string;
        name: string;
    }[];
    pending: {
        id: string;
        unlockedAtMs: number;
        icon: string;
        description: string;
        name: string;
    }[];
    schemaVersion?: 1 | undefined;
}>;
export declare const SessionHistoryStateSchema: z.ZodObject<{
    sessions: z.ZodArray<z.ZodObject<{
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
            attempts: number;
            averageCents: number;
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
            attempts: number;
            averageCents: number;
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
        durationMs: number;
        accuracy: number;
        id: string;
        exerciseId: string;
        exerciseName: string;
        mode: "tuner" | "practice";
        noteResults: {
            noteIndex: number;
            targetPitch: string;
            wasInTune: boolean;
            attempts: number;
            averageCents: number;
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
        endTimeMs: number;
        startTimeMs: number;
        averageCents: number;
        notesAttempted: number;
        notesCompleted: number;
    }, {
        durationMs: number;
        accuracy: number;
        id: string;
        exerciseId: string;
        exerciseName: string;
        mode: "tuner" | "practice";
        noteResults: {
            noteIndex: number;
            targetPitch: string;
            wasInTune: boolean;
            attempts: number;
            averageCents: number;
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
        endTimeMs: number;
        startTimeMs: number;
        averageCents: number;
        notesAttempted: number;
        notesCompleted: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    sessions: {
        durationMs: number;
        accuracy: number;
        id: string;
        exerciseId: string;
        exerciseName: string;
        mode: "tuner" | "practice";
        noteResults: {
            noteIndex: number;
            targetPitch: string;
            wasInTune: boolean;
            attempts: number;
            averageCents: number;
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
        endTimeMs: number;
        startTimeMs: number;
        averageCents: number;
        notesAttempted: number;
        notesCompleted: number;
    }[];
}, {
    sessions: {
        durationMs: number;
        accuracy: number;
        id: string;
        exerciseId: string;
        exerciseName: string;
        mode: "tuner" | "practice";
        noteResults: {
            noteIndex: number;
            targetPitch: string;
            wasInTune: boolean;
            attempts: number;
            averageCents: number;
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
        endTimeMs: number;
        startTimeMs: number;
        averageCents: number;
        notesAttempted: number;
        notesCompleted: number;
    }[];
}>;
/**
 * Zod schema for validating persistent user preferences.
 *
 * @public
 */
export declare const PreferencesStateSchema: z.ZodObject<{
    schemaVersion: z.ZodDefault<z.ZodLiteral<1>>;
    feedbackLevel: z.ZodEnum<["beginner", "intermediate", "advanced"]>;
    showTechnicalDetails: z.ZodBoolean;
    enableCelebrations: z.ZodBoolean;
    enableHaptics: z.ZodBoolean;
    soundFeedbackEnabled: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    schemaVersion: 1;
    feedbackLevel: "beginner" | "intermediate" | "advanced";
    showTechnicalDetails: boolean;
    enableCelebrations: boolean;
    enableHaptics: boolean;
    soundFeedbackEnabled: boolean;
}, {
    feedbackLevel: "beginner" | "intermediate" | "advanced";
    showTechnicalDetails: boolean;
    enableCelebrations: boolean;
    enableHaptics: boolean;
    soundFeedbackEnabled: boolean;
    schemaVersion?: 1 | undefined;
}>;
