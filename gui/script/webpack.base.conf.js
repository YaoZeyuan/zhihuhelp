'use strict'
const path = require('path')
const utils = require('./utils')
const config = require('../config')
const vueLoaderConfig = require('./vue-loader.conf')
const VueLoaderPlugin = require('vue-loader/lib/plugin')
let projectRoot = path.resolve(__dirname, '../')

module.exports = {
  cache: true, // 开启webpack的默认缓存
  entry: config.project.entry,
  output: {
    path: path.resolve(__dirname, `../dist`),
    filename: '[name].js',
    publicPath: '/'
  },
  // 指定在electron中运行
  target: 'electron-renderer',
  resolve: {
    extensions: ['.js', '.vue', '.json'],
    alias: {
      'vue$': 'vue/dist/vue.esm.js',
      'src': path.resolve(__dirname, '../src')
    }
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: vueLoaderConfig
      },
      {
        test: /\.js$/,
        loader: ['babel-loader?cacheDirectory=true'],
        include: [path.join(projectRoot, 'src')],
        exclude: [path.join(projectRoot, 'node_modules')]
      },
      // 它会应用到普通的 `.css` 文件
      // 以及 `.vue` 文件中的 `<style>` 块
      {
        test: /\.css$/,
        use: [
          'vue-style-loader',
          'css-loader'
        ]
      },
      {
        test: /\.less$/,
        use: [
          'vue-style-loader',
          'css-loader',
          'less-loader'
        ]
      },
      {
        test: /\.sass$/,
        use: [
          'vue-style-loader',
          'css-loader',
          'sass-loader'
        ]
      },
      {
        test: /\.saas$/,
        use: [
          'vue-style-loader',
          'css-loader',
          'saas-loader'
        ]
      },
      {
        test: /\.stylus$/,
        use: [
          'vue-style-loader',
          'css-loader',
          'stylus-loader'
        ]
      },
      {
        test: /\.styl$/,
        use: [
          'vue-style-loader',
          'css-loader',
          'stylus-loader'
        ]
      },
      {
        // 图片资源处理器
        // 10kb以下数据直接转为base64,否则置于img/文件夹中
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10240,
          name: utils.assetsPath(`${config.project.version}/img/[name].[hash:7].[ext]`)
        }
      },
      {
        // 媒体资源处理器
        // 10kb以下数据直接转为base64,否则置于media/文件夹中
        test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10240,
          name: utils.assetsPath(`${config.project.version}/media/[name].[hash:7].[ext]`)
        }
      },
      {
        // 字体资源处理器
        // 10kb以下数据直接转为base64,否则置于fonts/文件夹中
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10240,
          name: utils.assetsPath(`${config.project.version}/fonts/[name].[hash:7].[ext]`)
        }
      }
    ]
  },
  plugins: [
    new VueLoaderPlugin()
  ]
}
