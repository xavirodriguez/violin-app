import { z } from 'zod'
import { ProgressStateSchema } from '@/lib/schemas/persistence.schema'

export const ProgressContractV1 = z.object({
  schemaVersion: z.literal(1),
  state: ProgressStateSchema
}).openapi('ProgressStateV1')
