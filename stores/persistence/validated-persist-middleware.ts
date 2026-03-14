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
  return createJSONStorage(() => ({
    getItem: (key): any => {
      const val = localStorage.getItem(key)
      if (!val) return undefined
      try {
        return decompressAndDeserialize(val)
      } catch (e) {
        console.error(`[Storage] Failed to decompress/parse ${key}`, e)
        return undefined
      }
    },
    setItem: (key, value) => {
      try {
        const base64 = serializeAndCompress(value)
        localStorage.setItem(key, base64)
      } catch (e) {
        console.error(`[Storage] Failed to compress/save ${key}`, e)
      }
    },
    removeItem: (key) => localStorage.removeItem(key),
  }))
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
  config: StateCreator<T, any, any>,
  options: PersistOptions<T, any>,
): StateCreator<T, any, any> => {
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
  ) as any
}
