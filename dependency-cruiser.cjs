/* global module, __dirname */
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-domain-depends-on-framework',
      comment:
        'The domain (lib) cannot depend on React, Next.js, Zustand, or other UI/framework packages.',
      severity: 'error',
      from: { path: '^lib' },
      to: { path: '(react|next|zustand|opensheetmusicdisplay|@radix-ui)' },
    },
    {
      name: 'no-components-depend-on-app',
      comment: 'Components should not import from the app directory.',
      severity: 'error',
      from: { path: '^components' },
      to: { path: '^app' },
    },
    {
      name: 'no-hooks-depend-on-app-or-components',
      comment: 'Hooks should not import from app or component directories.',
      severity: 'warn',
      from: { path: '^hooks' },
      to: { path: '(^app|^components)' },
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
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
      mainFields: ['main', 'module', 'exports'],
    },
  },
}
