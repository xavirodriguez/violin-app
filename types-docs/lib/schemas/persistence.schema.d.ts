import { z } from 'zod';
export declare const NoteTechniqueSchema: z.ZodObject<{
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
}>;
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
}>;
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
    mode: "tuner" | "practice";
    accuracy: number;
    averageCents: number;
    notesAttempted: number;
    notesCompleted: number;
}, {
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
    mode: "tuner" | "practice";
    accuracy: number;
    averageCents: number;
    notesAttempted: number;
    notesCompleted: number;
}>;
export declare const ExerciseStatsSchema: z.ZodObject<{
    exerciseId: z.ZodString;
    timesCompleted: z.ZodNumber;
    bestAccuracy: z.ZodNumber;
    averageAccuracy: z.ZodNumber;
    fastestCompletionMs: z.ZodNumber;
    lastPracticedMs: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    lastPracticedMs: number;
    exerciseId: string;
    fastestCompletionMs: number;
    timesCompleted: number;
    bestAccuracy: number;
    averageAccuracy: number;
}, {
    lastPracticedMs: number;
    exerciseId: string;
    fastestCompletionMs: number;
    timesCompleted: number;
    bestAccuracy: number;
    averageAccuracy: number;
}>;
export declare const ProgressStateSchema: z.ZodObject<{
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
        fastestCompletionMs: number;
        timesCompleted: number;
        bestAccuracy: number;
        averageAccuracy: number;
    }, {
        lastPracticedMs: number;
        exerciseId: string;
        fastestCompletionMs: number;
        timesCompleted: number;
        bestAccuracy: number;
        averageAccuracy: number;
    }>>;
}, "strip", z.ZodTypeAny, {
    exerciseStats: Record<string, {
        lastPracticedMs: number;
        exerciseId: string;
        fastestCompletionMs: number;
        timesCompleted: number;
        bestAccuracy: number;
        averageAccuracy: number;
    }>;
    currentStreak: number;
    longestStreak: number;
    totalPracticeSessions: number;
    totalPracticeTime: number;
    exercisesCompleted: string[];
    intonationSkill: number;
    rhythmSkill: number;
    overallSkill: number;
}, {
    exerciseStats: Record<string, {
        lastPracticedMs: number;
        exerciseId: string;
        fastestCompletionMs: number;
        timesCompleted: number;
        bestAccuracy: number;
        averageAccuracy: number;
    }>;
    currentStreak: number;
    longestStreak: number;
    totalPracticeSessions: number;
    totalPracticeTime: number;
    exercisesCompleted: string[];
    intonationSkill: number;
    rhythmSkill: number;
    overallSkill: number;
}>;
export declare const AchievementSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    icon: z.ZodString;
    unlockedAtMs: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    unlockedAtMs: number;
    id: string;
    name: string;
    description: string;
    icon: string;
}, {
    unlockedAtMs: number;
    id: string;
    name: string;
    description: string;
    icon: string;
}>;
export declare const AchievementsStateSchema: z.ZodObject<{
    unlocked: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodString;
        icon: z.ZodString;
        unlockedAtMs: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        unlockedAtMs: number;
        id: string;
        name: string;
        description: string;
        icon: string;
    }, {
        unlockedAtMs: number;
        id: string;
        name: string;
        description: string;
        icon: string;
    }>, "many">;
    pending: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodString;
        icon: z.ZodString;
        unlockedAtMs: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        unlockedAtMs: number;
        id: string;
        name: string;
        description: string;
        icon: string;
    }, {
        unlockedAtMs: number;
        id: string;
        name: string;
        description: string;
        icon: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    unlocked: {
        unlockedAtMs: number;
        id: string;
        name: string;
        description: string;
        icon: string;
    }[];
    pending: {
        unlockedAtMs: number;
        id: string;
        name: string;
        description: string;
        icon: string;
    }[];
}, {
    unlocked: {
        unlockedAtMs: number;
        id: string;
        name: string;
        description: string;
        icon: string;
    }[];
    pending: {
        unlockedAtMs: number;
        id: string;
        name: string;
        description: string;
        icon: string;
    }[];
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
        mode: "tuner" | "practice";
        accuracy: number;
        averageCents: number;
        notesAttempted: number;
        notesCompleted: number;
    }, {
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
        mode: "tuner" | "practice";
        accuracy: number;
        averageCents: number;
        notesAttempted: number;
        notesCompleted: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    sessions: {
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
        mode: "tuner" | "practice";
        accuracy: number;
        averageCents: number;
        notesAttempted: number;
        notesCompleted: number;
    }[];
}, {
    sessions: {
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
        mode: "tuner" | "practice";
        accuracy: number;
        averageCents: number;
        notesAttempted: number;
        notesCompleted: number;
    }[];
}>;
export declare const PreferencesStateSchema: z.ZodObject<{
    feedbackLevel: z.ZodEnum<["beginner", "intermediate", "advanced"]>;
    showTechnicalDetails: z.ZodBoolean;
    enableCelebrations: z.ZodBoolean;
    enableHaptics: z.ZodBoolean;
    soundFeedbackEnabled: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
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
}>;
