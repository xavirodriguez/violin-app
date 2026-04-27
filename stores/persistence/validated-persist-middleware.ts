import { StateCreator } from 'zustand'
import { persist, PersistOptions, PersistStorage, StorageValue } from 'zustand/middleware'
import { z } from 'zod'
import {
  serializeAndCompress,
  decompressAndDeserialize,
  validateAndMerge,
} from '@/lib/persistence/persistence-core'
import type { DeserializedStorageValue } from '@/lib/persistence/storage-types'

/**
 * Custom storage that uses SuperJSON for serialization and Pako for compression.
 */
const createCompressedStorage = (_name: string): PersistStorage<unknown> => {
  return {
    getItem: (key: string) => {
      const val = localStorage.getItem(key)
      if (!val) return undefined
      let result: DeserializedStorageValue
      try {
        const deserialized = decompressAndDeserialize(val)
        if (typeof deserialized === 'string') {
          try {
            result = JSON.parse(deserialized) as { state: Record<string, unknown>; version?: number }
          } catch {
            result = undefined
          }
        } else {
          result = deserialized as { state: Record<string, unknown>; version?: number }
        }
      } catch (e) {
        console.error(`[Storage] Failed to decompress/parse ${key}`, e)
        result = undefined
      }
      return result as unknown as StorageValue<unknown> | undefined
    },
    setItem: (key: string, value: unknown) => {
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: z.ZodType<any>,
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
