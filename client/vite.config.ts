import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://cn.vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  server: {
    port: 8080,
    fs: {
      strict: false,
    }
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        format: 'cjs', // 配置 Rollup 打包输出 CommonJs 格式
      },
      external: ['electron'], // 告诉 Rollup 不要去打包 electron
    },
  },
  optimizeDeps: {
    exclude: ['electron'], // 告诉 Vite 不要转换 electron 模块
  },
  resolve: {
    alias: [
      {
        "find": "~/client",
        "replacement": path.resolve(__dirname)
      }
    ]
  },

})
