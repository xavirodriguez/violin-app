import { z } from 'zod'
import { AchievementsStateSchema } from '@/lib/schemas/persistence.schema'

export const AchievementsContractV1 = z.object({
  schemaVersion: z.literal(1),
  state: AchievementsStateSchema
}).openapi('AchievementsStateV1')
