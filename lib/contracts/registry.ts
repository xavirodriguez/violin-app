import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { PracticeContractV1 } from './v1/practice.contract'
import { ProgressContractV1 } from './v1/progress.contract'
import { AchievementsContractV1 } from './v1/achievements.contract'

export const registry = new OpenAPIRegistry()

registry.register('PracticeContractV1', PracticeContractV1)
registry.register('ProgressContractV1', ProgressContractV1)
registry.register('AchievementsContractV1', AchievementsContractV1)
