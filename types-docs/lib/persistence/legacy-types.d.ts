/** Sesión tal como se guardaba antes de la migración v3. */
export interface LegacySessionV2 {
    duration?: number;
    startTime?: string | Date;
    endTime?: string | Date;
    durationMs?: number;
    startTimeMs?: number;
    endTimeMs?: number;
    noteResults?: LegacyNoteResultV2[];
    [key: string]: unknown;
}
/** NoteResult antes de la migración. */
export interface LegacyNoteResultV2 {
    timeToComplete?: number;
    timeToCompleteMs?: number;
    [key: string]: unknown;
}
/** Achievement antes de la migración. */
export interface LegacyAchievementV2 {
    unlockedAt?: string | Date;
    unlockedAtMs?: number;
    [key: string]: unknown;
}
/** ExerciseStats antes de la migración. */
export interface LegacyExerciseStatsV2 {
    fastestCompletion?: number;
    fastestCompletionMs?: number;
    lastPracticed?: string | Date;
    lastPracticedMs?: number;
    [key: string]: unknown;
}
/** Estado completo persistido del facade antes de migraciones. */
export interface LegacyPersistedFacadeState {
    sessions?: LegacySessionV2[];
    progress?: {
        achievements?: LegacyAchievementV2[];
        exerciseStats?: Record<string, LegacyExerciseStatsV2>;
        [key: string]: unknown;
    };
    [key: string]: unknown;
}
