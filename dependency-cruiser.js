/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-domain-depends-on-framework',
      comment: 'El dominio no puede depender de React/Next/Zustand/infra.',
      severity: 'error',
      from: { path: '^src/domain' },
      to: { path: '(react|next|zustand|web-audio-api|tone)' },
    },
    {
      name: 'no-feature-cross-imports',
      comment: 'Features no se importan entre sí directamente (usar dominio/casos de uso).',
      severity: 'warn',
      from: { path: '^src/features/([^/]+)/' },
      to: { path: '^src/features/((?!\\1).)+/' },
    },
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    tsConfig: { fileName: 'tsconfig.json' },
    doNotFollow: { path: 'node_modules' },
  },
}
