/**
 * Persistence Migration System
 *
 * Provides utilities for handling versioned state updates in persistent storage.
 * This ensures that when the application schema changes, existing user data is
 * safely transformed to the new format without data loss.
 */

/**
 * A function that transforms state from one version to the next.
 */
export type MigrationFn<T = unknown> = (state: T) => T

export interface MigratorConfig<T> {
  [version: number]: MigrationFn<T>
}

/**
 * Extracts and sorts migration versions from the configuration.
 */
function getSortedVersions<T>(config: MigratorConfig<T>): number[] {
  const keys = Object.keys(config)
  const numbers = keys.map(Number)
  const sorted = numbers.sort((a, b) => a - b)
  const result = sorted

  return result
}

/**
 * Applies all pending migrations to the persisted state.
 */
function applyPendingMigrations<T>(params: {
  state: T
  version: number
  versions: number[]
  config: MigratorConfig<T>
}): T {
  const { version, versions, config } = params
  let currentState = params.state

  for (const v of versions) {
    const isNewer = v > version
    if (isNewer) {
      const logMsg = `[Migration] Applying migration to version ${v}`
      console.log(logMsg)
      currentState = config[v](currentState)
    }
  }

  return currentState
}

/**
 * Creates a declarative migrator compatible with Zustand's `persist` middleware.
 *
 * @remarks
 * The returned function will automatically detect the current version of the
 * persisted state and apply all necessary migrations in sequence until the
 * latest version is reached.
 *
 * @param config - A map of version numbers to their corresponding transformation functions.
 *
 * @example
 * ```ts
 * const migrator = createMigrator({
 *   1: (state) => ({ ...state, newField: 'default' }),
 *   2: (state) => ({ ...state, schemaVersion: 2 })
 * });
 * ```
 *
 * @public
 */
export function createMigrator<T>(config: MigratorConfig<T>) {
  return (persistedState: unknown, version: number): T => {
    const versions = getSortedVersions(config)
    const initialState = persistedState as T
    const result = applyPendingMigrations({
      state: initialState,
      version,
      versions,
      config,
    })

    return result
  }
}
