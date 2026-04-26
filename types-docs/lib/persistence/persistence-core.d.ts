import { z } from 'zod';
/**
 * Serializes and compresses a value for local storage.
 */
export declare function serializeAndCompress(value: unknown): string;
/**
 * Decompresses and deserializes a value from local storage.
 */
export declare function decompressAndDeserialize(val: string): unknown;
/**
 * Validates and merges persisted state with current state.
 */
export declare function validateAndMerge<T>(schema: z.ZodType<T>, persistedState: unknown, currentState: T, options: {
    name: string;
    merge?: (persisted: T, current: T) => T;
}): T;
