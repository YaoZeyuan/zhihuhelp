import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const rootPath = path.dirname(fileURLToPath(import.meta.url))
const offlineSetupFile = path.resolve(rootPath, 'tests/setup/offline.ts')

export default defineConfig({
  test: {
    reporters: ['default'],
    coverage: {
      provider: 'v8',
      enabled: false,
      reporter: ['text', 'html', 'json-summary'],
      reportsDirectory: path.resolve(rootPath, 'coverage'),
      exclude: ['**/*.d.ts', '**/resource/type/**', '**/public/**', 'tests/**', 'scripts/**'],
    },
    projects: [
      {
        extends: true,
        resolve: {
          alias: {
            '~/src': path.resolve(rootPath, 'src'),
          },
        },
        test: {
          name: 'unit',
          environment: 'node',
          include: ['tests/unit/**/*.test.ts'],
          setupFiles: [offlineSetupFile],
          isolate: true,
          fileParallelism: false,
        },
      },
      {
        extends: true,
        resolve: {
          alias: {
            '~/src': path.resolve(rootPath, 'client/src'),
            '@shared': path.resolve(rootPath, 'src/shared'),
          },
        },
        test: {
          name: 'client',
          environment: 'jsdom',
          include: ['tests/client/**/*.test.{ts,tsx}'],
          setupFiles: [offlineSetupFile, path.resolve(rootPath, 'tests/setup/client.ts')],
          isolate: true,
        },
      },
      {
        extends: true,
        resolve: {
          alias: {
            '~/src': path.resolve(rootPath, 'src'),
          },
        },
        test: {
          name: 'integration',
          environment: 'node',
          include: ['tests/integration/**/*.test.ts'],
          setupFiles: [offlineSetupFile],
          isolate: true,
          fileParallelism: false,
        },
      },
    ],
  },
})
