import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  {
    ignores: [
      'convex/_generated/**',
      'lint_detailed.txt',
      'lint_output.txt',
      'dist/**',
      '.output/**',
      'prettier.config.js',
      'eslint.config.js',
    ],
  },
  ...tanstackConfig,
]
