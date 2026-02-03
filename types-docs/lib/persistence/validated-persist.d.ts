import { StateCreator } from 'zustand';
import { PersistOptions } from 'zustand/middleware';
import { z } from 'zod';
export declare const validatedPersist: <T>(schema: z.ZodType<T>, config: StateCreator<T, any, any>, options: PersistOptions<T, any>) => StateCreator<T, any, any>;
