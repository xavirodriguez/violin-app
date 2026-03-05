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
        schemaVersion: 1;
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
        schemaVersion?: 1 | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    schemaVersion: 1;
    state: {
        schemaVersion: 1;
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
    };
}, {
    schemaVersion: 1;
    state: {
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
        schemaVersion?: 1 | undefined;
    };
}>;
