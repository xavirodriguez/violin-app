import { StateCreator } from 'zustand';
import { PersistOptions } from 'zustand/middleware';
import { z } from 'zod';
/**
 * Wrapper for Zustand's persist middleware that adds Zod validation.
 *
 * @remarks
 * Uses internal type casting for the state creator to handle complex mutator
 * array types from Zustand's middleware.
 */
export declare const validatedPersist: <T>(schema: z.ZodType<any>, config: StateCreator<T, [], []>, options: PersistOptions<T, unknown>) => StateCreator<T, [], []>;
