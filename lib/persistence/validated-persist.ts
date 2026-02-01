import { StateCreator } from 'zustand'
import { persist, PersistOptions } from 'zustand/middleware'
import { z } from 'zod'

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
      merge: (persistedState, currentState) => {
        try {
          // Validate the persisted state
          const validated = schema.parse(persistedState)
          console.log(`[Persist] ✅ State validated for ${options.name}`)

          // If the user provided a custom merge, use it, otherwise use default shallow merge
          if (options.merge) {
            return options.merge(validated, currentState)
          }
          return { ...currentState, ...validated }
        } catch (validationError) {
          console.error(`[Persist] ❌ Validation failed for ${options.name}. Falling back to default state.`, validationError)
          // Return currentState to effectively discard invalid persisted data
          return currentState
        }
      }
    }
  )
}
