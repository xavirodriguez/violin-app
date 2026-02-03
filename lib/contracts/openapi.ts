import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi'
import { registry } from './registry'

export const generateOpenApiDocument = (): any => {
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

export const openApiDocument: any = generateOpenApiDocument()
