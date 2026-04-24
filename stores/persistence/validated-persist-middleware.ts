import { StateCreator } from 'zustand'
import { persist, PersistOptions, createJSONStorage } from 'zustand/middleware'
import { z } from 'zod'
import {
  serializeAndCompress,
  decompressAndDeserialize,
  validateAndMerge,
} from '@/lib/persistence/persistence-core'

/**
 * Custom storage that uses SuperJSON for serialization and Pako for compression.
 */
const createCompressedStorage = (_name: string) => {
  return {
    getItem: (key: string) => {
      const val = localStorage.getItem(key)
      if (!val) return null
      try {
        return decompressAndDeserialize(val) as any
      } catch (e) {
        console.error(`[Storage] Failed to decompress/parse ${key}`, e)
        return null
      }
    },
    setItem: (key: string, value: any) => {
      try {
        const base64 = serializeAndCompress(value)
        localStorage.setItem(key, base64)
      } catch (e) {
        console.error(`[Storage] Failed to compress/save ${key}`, e)
      }
    },
    removeItem: (key: string) => localStorage.removeItem(key),
  }
}

/**
 * Wrapper for Zustand's persist middleware that adds Zod validation.
 *
 * @remarks
 * Uses internal type casting for the state creator to handle complex mutator
 * array types from Zustand's middleware.
 */
export const validatedPersist = <T>(
  schema: z.ZodType<T>,
  config: StateCreator<T, [], []>,
  options: PersistOptions<T, unknown>,
): StateCreator<T, [], []> => {
  return persist(
    (set, get, api) => {
      return config(set, get, api)
    },
    {
      ...options,
      storage: options.storage || createCompressedStorage(options.name),
      merge: (persistedState, currentState) => {
        return validateAndMerge(schema, persistedState, currentState, {
          name: options.name,
          merge: options.merge,
        })
      },
    },
  ) as StateCreator<T, [], []>
}
