/**
 * OpenAPI Specification Generator
 *
 * Provides utilities for generating standardized API documentation from
 * internal Zod schemas and contract registries.
 */

import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi'
import { registry } from './registry'

/**
 * Generates a version 3.0.0 OpenAPI document for the practice engine.
 *
 * @remarks
 * Uses `@asteasolutions/zod-to-openapi` to transform TypeScript-safe Zod
 * definitions into a machine-readable JSON schema.
 *
 * @returns A structured OpenAPI document object.
 * @public
 */
export const generateOpenApiDocument = (): unknown => {
  const generator = new OpenApiGeneratorV3(registry.definitions)

  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      version: '1.0.0',
      title: 'Violin Mentor Practice Engine',
      description: 'Internal API for the Violin Mentor practice engine and progress tracking.',
    },
    servers: [{ url: 'v1' }],
  })
}

export const openApiDocument: unknown = generateOpenApiDocument()
