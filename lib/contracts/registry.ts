/**
 * API Contract Registry
 *
 * Central repository for all public and internal data contracts.
 * Enables automatic OpenAPI documentation generation and cross-module type safety.
 */

import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { PracticeContractV1 } from './v1/practice.contract'
import { ProgressContractV1 } from './v1/progress.contract'
import { AchievementsContractV1 } from './v1/achievements.contract'

/**
 * The global registry instance where all schemas and contracts must be registered.
 * @public
 */
export const registry = new OpenAPIRegistry()

registry.register('PracticeContractV1', PracticeContractV1)
registry.register('ProgressContractV1', ProgressContractV1)
registry.register('AchievementsContractV1', AchievementsContractV1)
