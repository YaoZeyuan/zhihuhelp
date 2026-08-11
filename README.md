# 知乎助手

知乎助手是一款本地桌面工具，用于把知乎回答、文章、想法、问题、收藏夹、专栏、话题和用户内容抓取到本地 SQLite 数据库，并固定生成 HTML、Markdown、EPUB 三种产物，方便个人离线阅读、AI 分析和整理。

项目由 [姚泽源](http://www.yaozeyuan.online/) 创作。项目自有代码采用
`MIT OR GPL-2.0-or-later` 双重许可；包含 Pandoc WASM 的官方桌面发行版
整体按 GPL-2.0-or-later 发布。详见 [许可证说明](LICENSE)、
[第三方声明](THIRD_PARTY_NOTICES.md)与[对应源码说明](CORRESPONDING_SOURCE.md)。

## 下载地址

请在[zhihuhelp.yaozeyuan.online](https://zhihuhelp.yaozeyuan.online/) 中下载最新版本

| 文档                           | 面向对象 | 内容                                                       |
| ------------------------------ | -------- | ---------------------------------------------------------- |
| [用户指南](doc/guide/index.md) | 使用者   | 安装使用、任务配置、数据浏览、输出结果、常见问题           |
| [开发文档](doc/dev/index.md)   | 开发者   | 环境命令、架构、业务流程、三端分工、数据日志、维护注意事项 |
| [文档站源码](doc/index.md)     | 所有人   | 产品介绍和文档入口                                         |

## 快速使用

1.  打开知乎助手。
2.  在“登录”页完成知乎登录。
3.  回到“任务管理”页，粘贴知乎链接并点击“识别链接”。
4.  选择图片质量；输出固定包含 HTML、Markdown 和 EPUB。
5.  点击“开始”。
6.  在“运行日志”页查看状态，并从输出历史打开结果。

完整说明见 [快速开始](doc/guide/getting-started.md)。

## 开发

环境要求：

| 项      | 版本 |
| ------- | ---- |
| Node.js | 24.x |
| pnpm    | 11.x |

安装依赖：

```shell
npm install --global pnpm@11.5.0
pnpm install
```

常用命令：

```shell
pnpm build
pnpm watch
pnpm startgui
pnpm start
pnpm buildgui
pnpm zhihuhelp --help
```

文档站本地开发和验收：

```shell
pnpm docs:dev
pnpm docs:build
pnpm docs:check
pnpm docs:preview
```

注: `docs:build` 会把仓库根 `api` 原样镜像到站点产物的 `/api`；`docs:check` 检查已经生成的 `doc/.vitepress/dist`，因此需在构建之后执行。完整开发说明见[开发环境与命令](doc/dev/environment.md)。

## 使用限制

知乎助手用于个人学习、整理和离线阅读。请遵守知乎内容版权、账号规则和相关法律法规，不要把生成的内容用于未获授权的分发或商业用途。
