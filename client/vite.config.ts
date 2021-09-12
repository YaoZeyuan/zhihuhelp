import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import commonjsExternals from 'vite-plugin-commonjs-externals';
// node内置模块列表
import builtinModules from 'builtin-modules';
// 如果package.json里装了外部依赖, 也通过这个导入进去
import pkg from './package.json';
const commonjsPackages = [
  'electron',
  ...builtinModules,
] as const;

// https://cn.vitejs.dev/config/
export default defineConfig({
  // 使用相对路径指定index.html中入口js地址. 本身属于hack, 对个人项目而言可以接受
  base: "./",
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // 忽略webview标签
          isCustomElement: (tag) => tag === "webview"
        }
      }
    }),
    // 解决vite不允许导入fs/path等非client包的问题
    commonjsExternals({
      externals: commonjsPackages,
      // 需要主动指定处理.vue文件
      exts: ["vue", 'ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs']
    }),
  ],
  server: {
    port: 8080,
    fs: {
      strict: false,
    }
  },
  build: {
    assetsDir: '', // require时使用相对路径, 解决加载问题
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
