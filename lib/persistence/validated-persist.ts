import { StateCreator } from 'zustand'
import { persist, PersistOptions, createJSONStorage } from 'zustand/middleware'
import { z } from 'zod'
import superjson from 'superjson'
import pako from 'pako'

/**
 * Custom storage that uses SuperJSON for serialization and Pako for compression.
 */
const createCompressedStorage = (name: string) => {
  return createJSONStorage(() => ({
    getItem: (key) => {
      const val = localStorage.getItem(key)
      if (!val) return null
      try {
        // 1. Base64 to Uint8Array
        const bin = Uint8Array.from(atob(val), (c) => c.charCodeAt(0))
        // 2. Decompress
        const decompressed = pako.inflate(bin, { to: 'string' })
        // 3. SuperJSON parse
        return superjson.parse(decompressed)
      } catch (e) {
        console.error(`[Storage] Failed to decompress/parse ${key}`, e)
        return null
      }
    },
    setItem: (key, value) => {
      try {
        // 1. SuperJSON stringify
        const str = superjson.stringify(value)
        // 2. Compress
        const compressed = pako.deflate(str)
        // 3. Uint8Array to Base64
        const base64 = btoa(String.fromCharCode(...compressed))
        localStorage.setItem(key, base64)
      } catch (e) {
        console.error(`[Storage] Failed to compress/save ${key}`, e)
      }
    },
    removeItem: (key) => localStorage.removeItem(key),
  }))
}

type JsonPrimitive = string | number | boolean | null
type JsonObject = { [key: string]: JsonValue }
type JsonArray = JsonValue[]
type JsonValue = JsonPrimitive | JsonObject | JsonArray

/**
 * Ensures a type is JSON-serializable.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type Serializable<T> = T extends JsonValue ? T : never

/**
 * Wrapper for Zustand's persist middleware that adds Zod validation.
 *
 * @remarks
 * Uses internal type casting for the state creator to handle complex mutator
 * array types from Zustand's middleware.
 */
export const validatedPersist = <T>(
  schema: z.ZodType<T>,
  config: StateCreator<T, any, any>,
  options: PersistOptions<T, any>
): StateCreator<T, any, any> => {
  return persist(
    (set, get, api) => {
      return config(set, get, api)
    },
    {
      ...options,
      storage: options.storage || createCompressedStorage(options.name),
      merge: (persistedState, currentState) => {
        try {
          // Validate the persisted state
          const validated = schema.parse(persistedState)
          console.log(`[Persist] ✅ State validated for ${options.name}`)

          if (options.merge) {
            return options.merge(validated, currentState)
          }
          return { ...currentState, ...validated }
        } catch (validationError) {
          console.error(
            `[Persist] ❌ Validation failed for ${options.name}. Falling back to default state.`,
            validationError,
          )
          return currentState
        }
      },
    }
  ) as any
}
