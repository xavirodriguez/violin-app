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
            icon: string;
            id: string;
            name: string;
            unlockedAtMs: number;
            description: string;
        }, {
            icon: string;
            id: string;
            name: string;
            unlockedAtMs: number;
            description: string;
        }>, "many">;
        pending: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            description: z.ZodString;
            icon: z.ZodString;
            unlockedAtMs: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            icon: string;
            id: string;
            name: string;
            unlockedAtMs: number;
            description: string;
        }, {
            icon: string;
            id: string;
            name: string;
            unlockedAtMs: number;
            description: string;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        schemaVersion: 1;
        unlocked: {
            icon: string;
            id: string;
            name: string;
            unlockedAtMs: number;
            description: string;
        }[];
        pending: {
            icon: string;
            id: string;
            name: string;
            unlockedAtMs: number;
            description: string;
        }[];
    }, {
        unlocked: {
            icon: string;
            id: string;
            name: string;
            unlockedAtMs: number;
            description: string;
        }[];
        pending: {
            icon: string;
            id: string;
            name: string;
            unlockedAtMs: number;
            description: string;
        }[];
        schemaVersion?: 1 | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    state: {
        schemaVersion: 1;
        unlocked: {
            icon: string;
            id: string;
            name: string;
            unlockedAtMs: number;
            description: string;
        }[];
        pending: {
            icon: string;
            id: string;
            name: string;
            unlockedAtMs: number;
            description: string;
        }[];
    };
    schemaVersion: 1;
}, {
    state: {
        unlocked: {
            icon: string;
            id: string;
            name: string;
            unlockedAtMs: number;
            description: string;
        }[];
        pending: {
            icon: string;
            id: string;
            name: string;
            unlockedAtMs: number;
            description: string;
        }[];
        schemaVersion?: 1 | undefined;
    };
    schemaVersion: 1;
}>;
