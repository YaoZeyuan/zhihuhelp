import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const configDir = path.dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig({
  // 使用相对路径指定 index.html 中入口地址，供 Electron loadFile 使用。
  base: './',
  server: {
    port: 8080,
    fs: {
      strict: false,
    },
  },
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
      },
    },
  },
  build: {
    sourcemap: false,
    assetsDir: '',
    rollupOptions: {
      output: {
        format: 'cjs',
      },
      external: ['electron'],
    },
  },
  optimizeDeps: {
    exclude: ['electron'],
  },
  resolve: {
    alias: [
      {
        find: '~/src',
        replacement: path.resolve(configDir, 'src'),
      },
      {
        find: '~/client',
        replacement: configDir,
      },
      {
        find: '@shared',
        replacement: path.resolve(configDir, '../src/shared'),
      },
    ],
  },
})
