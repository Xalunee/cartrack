import { defineConfig } from 'vitest/config'

export default defineConfig({
  // Vite 7+ resolves tsconfig.json `paths` natively — no plugin, no duplicated
  // alias table. Keeps @shared/* etc. in one place: tsconfig.json.
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/shared/lib/calculations/**/*.ts'],
    },
  },
})
