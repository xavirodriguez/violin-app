export type MigrationFn<T = any> = (state: T) => T;
export interface MigratorConfig<T> {
    [version: number]: MigrationFn<T>;
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
export declare function createMigrator<T>(config: MigratorConfig<T>): (persistedState: any, version: number) => T;
