import { z } from 'zod'
import { PracticeSessionSchema } from '@/lib/schemas/persistence.schema'

export const PracticeContractV1 = z.object({
  schemaVersion: z.literal(1),
  session: PracticeSessionSchema
}).openapi('PracticeSessionV1')
