import { defineConfig } from 'vite'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  return {
    // 使用相对路径指定index.html中入口js地址. 本身属于hack, 对个人项目而言可以接受
    base: './',
    plugins: [],
    server: {
      host: "0.0.0.0",
      // 配置启动时打开的域名&端口
      port: 8080,

      fs: {
        strict: false,
      },
    },
    esbuild: {
      // 为jsx/tsx文件自动注入React变量
      // jsxInject: "import React from 'react';",
      // 同时, 项目其他文件中不能出现`import React from 'react'`语句, 否则会引起变量名重复, 导致项目无法启动
      // 为旧手机提供兼容, 例如红米 K30 5G(Chrome版本只有79, 无法识别?.运算符, 在默认的es2020模式下会原样输出?.运算符导致页面白屏)
      // target: "es2016"
    },
    css: {
      preprocessorOptions: {
        less: {
          // less-loader配置
          javascriptEnabled: true,
        },
      },
    },
    build: {
      // assetsDir: '', // require时使用相对路径, 解决加载问题
      sourcemap: false,
      assetsDir: '', // require时使用相对路径, 解决加载问题
      rollupOptions: {
        output: {
          format: 'cjs', // 配置 Rollup 打包输出 CommonJs 格式
        },
      },
    },
    resolve: {
      alias: [
        {
          find: '~/src',
          replacement: path.resolve(__dirname, 'src'),
        },
      ],
    },
  }
})
