/**
 * Type-safe persistence migration utilities.
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
 * Creates a declarative migrator for Zustand's persist middleware.
 *
 * @example
 * ```ts
 * const migrator = createMigrator({
 *   1: (state) => ({ ...state, newField: 'default' }),
 *   2: (state) => ({ ...state, schemaVersion: 2 })
 * });
 * ```
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
