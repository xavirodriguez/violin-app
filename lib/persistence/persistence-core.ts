import { z } from 'zod';
import superjson from 'superjson';
import pako from 'pako';

/**
 * Serializes and compresses a value.
 */
export function serializeAndCompress(value: unknown): string {
  const str = superjson.stringify(value);
  const compressed = pako.deflate(str);
  return btoa(String.fromCharCode(...compressed));
}

/**
 * Decompresses and deserializes a value.
 */
export function decompressAndDeserialize(val: string): unknown {
  const bin = Uint8Array.from(atob(val), (c) => c.charCodeAt(0));
  const decompressed = pako.inflate(bin, { to: 'string' });
  return superjson.parse(decompressed);
}

/**
 * Validates and merges persisted state with current state.
 */
export function validateAndMerge<T>(
  schema: z.ZodType<T>,
  persistedState: unknown,
  currentState: T,
  options: {
    name: string;
    merge?: (persisted: T, current: T) => T;
  }
): T {
  if (persistedState === undefined || persistedState === null) {
    return currentState;
  }

  try {
    const validated = schema.parse(persistedState);
    console.log(`[Persist] ✅ State validated for ${options.name}`);

    if (options.merge) {
      return options.merge(validated, currentState);
    }
    return { ...currentState, ...validated };
  } catch (validationError) {
    console.error(
      `[Persist] ❌ Validation failed for ${options.name}. Falling back to default state.`,
      validationError
    );
    return currentState;
  }
}
