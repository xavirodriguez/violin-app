export type MigrationFn<T = any> = (state: T) => T

export interface MigratorConfig<T> {
  [version: number]: MigrationFn<T>
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
  return (persistedState: any, version: number): T => {
    let state = persistedState
    const versions = Object.keys(config)
      .map(Number)
      .sort((a, b) => a - b)

    for (const v of versions) {
      if (v > version) {
        console.log(`[Migration] Applying migration to version ${v}`)
        state = config[v](state)
      }
    }

    return state
  }
}
