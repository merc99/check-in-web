import { defineConfig, globalIgnores } from 'eslint/config'
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

export default defineConfig([
  globalIgnores(['.next/**', 'node_modules/**', 'next-env.d.ts', 'prototype/**']),
  { extends: [...nextCoreWebVitals, ...nextTypescript] },
  // Small Node helpers (npm run ui:add) are CommonJS on purpose.
  { files: ['scripts/**/*.cjs'], rules: { '@typescript-eslint/no-require-imports': 'off' } },
])
