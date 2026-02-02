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

export const validatedPersist = <T>(
  schema: z.ZodType<T>,
  config: StateCreator<T, [['zustand/persist', unknown]], []>,
  options: PersistOptions<T>
): StateCreator<T, [], [['zustand/persist', T]]> => {
  return persist(
    (set, get, api) => {
      return config(set, get, api)
    },
    {
      ...options,
      storage: options.storage || createCompressedStorage(options.name),
      merge: (persistedState, currentState) => {
        try {
          // In some cases (like tests or first load), persistedState might be the raw value from storage
          // or already processed by storage.getItem. createJSONStorage handles the JSON.parse part,
          // but our custom storage already returns the parsed SuperJSON object.

          // Validate the persisted state
          const validated = schema.parse(persistedState)
          console.log(`[Persist] ✅ State validated for ${options.name}`)

          if (options.merge) {
            return options.merge(validated, currentState)
          }
          return { ...currentState, ...validated }
        } catch (validationError) {
          console.error(`[Persist] ❌ Validation failed for ${options.name}. Falling back to default state.`, validationError)
          return currentState
        }
      }
    }
  )
}
