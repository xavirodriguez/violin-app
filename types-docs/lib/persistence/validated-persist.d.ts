import { StateCreator } from 'zustand';
import { PersistOptions } from 'zustand/middleware';
import { z } from 'zod';
export declare const validatedPersist: <T>(schema: z.ZodType<T>, config: StateCreator<T, [["zustand/persist", unknown]], []>, options: PersistOptions<T>) => StateCreator<T, [], [["zustand/persist", T]]>;
