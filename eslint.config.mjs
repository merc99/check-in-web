import { defineConfig, globalIgnores } from 'eslint/config'
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

export default defineConfig([
  // Reference kits (premium-ui-kit, mmo-fx-kit) are source material for components/fx, not app code.
  globalIgnores(['.next/**', 'node_modules/**', 'next-env.d.ts', 'prototype/**', 'premium-ui-kit/**', 'mmo-fx-kit/**']),
  { extends: [...nextCoreWebVitals, ...nextTypescript] },
  // Small Node helpers (npm run ui:add) are CommonJS on purpose.
  { files: ['scripts/**/*.cjs'], rules: { '@typescript-eslint/no-require-imports': 'off' } },
])
