import { z } from 'zod';
export declare const AchievementsContractV1: z.ZodObject<{
    schemaVersion: z.ZodLiteral<1>;
    state: z.ZodObject<{
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
}, "strip", z.ZodTypeAny, {
    state: {
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
    };
    schemaVersion: 1;
}, {
    state: {
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
    };
    schemaVersion: 1;
}>;
