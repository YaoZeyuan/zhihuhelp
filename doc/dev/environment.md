---
title: 开发环境与命令
description: 安装依赖并运行知乎助手的后端、前端、Electron 与测试命令。
---

# 开发环境与命令

## 环境要求

版本以根目录和 `client/package.json` 为准，不再沿用旧文档中的 Electron 23、React 18 或 Vite 4。

| 项             | 当前要求或版本                     |
| -------------- | ---------------------------------- |
| Node.js        | `>=24 <25`                         |
| pnpm           | `>=11 <12`，仓库固定 `pnpm@11.5.0` |
| Electron       | 43.3                               |
| React          | 19.2                               |
| Vite           | 8.2                                |
| Ant Design     | 6.5                                |
| TypeScript     | 7.0                                |
| Babel          | 8.0                                |
| Vitest / jsdom | 4.1 / 30                           |
| SQLite / knex  | sqlite3 6.0 / knex 3.3             |
| VitePress      | 2.0 alpha                          |
| Mermaid        | 11.16                              |

Windows 上如遇 `sqlite3`、`sharp` 等原生依赖安装失败，先确认已安装 Visual Studio 2022 C++ 构建工具和 Python 3。Node 主版本必须保持 24，避免 Electron 原生模块 ABI 不一致。

生成器在 Windows + Node.js 24 下复制含中文的 HTML 输出目录时，刻意不使用 `fs.cpSync`，而是递归遍历并调用 `fs.copyFileSync`。这是针对进程可能被直接终止的运行时兼容处理；升级 Node/Electron 后如要替换，必须先通过中文长标题和多卷真实输出集成测试。

## 初次安装

仓库根目录是 pnpm workspace，`client` 会随根安装一起处理：

```shell
corepack enable
corepack prepare pnpm@11.5.0 --activate
pnpm install
```

不要在根项目和 `client` 分别使用不同版本的 npm/pnpm 重写 lockfile。

## 常用开发与构建命令

| 命令                                           | 说明                                                    |
| ---------------------------------------------- | ------------------------------------------------------- |
| `pnpm watch`                                   | 监听 `src` 并持续用 Babel 编译到 `dist`                 |
| `pnpm build`                                   | 一次性编译根项目 `src` 到 `dist`                        |
| `pnpm startgui`                                | 启动 Vite 开发服务，端口 8080                           |
| `pnpm start`                                   | 用调试参数启动现有 `dist/index.js`，不会自动编译源码    |
| `pnpm buildgui`                                | 构建前端并复制到 `dist/client`                          |
| `pnpm docs:dev`                                | 启动 VitePress 文档站开发服务                           |
| `pnpm docs:build`                              | 构建文档站到 `doc/.vitepress/dist`                      |
| `pnpm docs:check`                              | 校验已构建站点的链接、资源、公开边界、域名和敏感信息    |
| `pnpm docs:preview`                            | 本地预览已构建的文档站                                  |
| `pnpm pack`                                    | 构建根项目和 GUI，生成未打包应用目录                    |
| `pnpm dist`                                    | 构建根项目和 GUI，并调用 electron-builder 生成安装包    |
| `pnpm zhihuhelp --help`                        | 显示 CLI 帮助                                           |
| `pnpm zhihuhelp init --config config.json`     | 初始化目录和 SQLite                                     |
| `pnpm zhihuhelp fetch --config config.json`    | 按配置抓取并持久化；真实请求要求宿主已注入签名 bridge   |
| `pnpm zhihuhelp generate --config config.json` | 从 SQLite 读取并生成输出                                |
| `pnpm zhihuhelp run --config config.json`      | 顺序执行 init、fetch、generate；真实请求要求签名 bridge |

`pnpm start` 必须保持只启动已有构建产物。开发时不要依赖它隐式编译；先执行一次 `pnpm build`，或保持 `pnpm watch` 运行。

## 文档站开发与发布

编辑 `doc/guide`、`doc/dev`、`doc/index.md` 或 VitePress 主题时，使用：

```shell
pnpm docs:dev
```

提交前执行完整的生产构建和产物校验：

```shell
pnpm docs:build
pnpm docs:check
pnpm docs:preview
```

`docs:check` 只检查已经生成的 `doc/.vitepress/dist`，不会隐式重新构建。它会验证公开英文路由、内部链接、静态资源、本地搜索索引、站点地图和 `CNAME`，同时阻止 `doc/task`、`doc/项目文档` 路由及疑似 Cookie、令牌、私钥或本机绝对路径进入发布产物。

推送到 `master` 或手动运行 `Documentation Pages` 工作流后，GitHub Actions 会拉取完整 Git 历史以生成准确的页面更新时间，重新安装锁定依赖、构建和校验站点，再把 `doc/.vitepress/dist` 发布到 GitHub Pages。仓库 Settings → Pages → Build and deployment 的 Source 必须设置为 **GitHub Actions**；旧 `homepage` 分支不再承担官网发布职责。正式域名由 `doc/public/CNAME` 固定为 `zhihuhelp.yaozeyuan.online`。

## 测试命令

| 命令                    | 说明                                                  |
| ----------------------- | ----------------------------------------------------- |
| `pnpm test`             | 运行全部离线 project，并生成 V8 coverage              |
| `pnpm test:unit`        | 运行 Node 单元测试                                    |
| `pnpm test:client`      | 运行 jsdom 前端组件测试                               |
| `pnpm test:integration` | 运行串行或进程隔离的本地集成测试                      |
| `pnpm test:online`      | 启动可见 Electron 签名运行时并执行在线冒烟            |
| `pnpm fixtures:refresh` | 联网刷新脱敏知乎 fixture；唯一允许修改 fixture 的命令 |

`pnpm test` 强制断网并使用临时目录，不读取根目录 `config.json`。在线两条命令只读 `config.json.request.cookie`；Cookie 缺失、为空或失效会提示手工更新并以非零状态退出。完整规则、公开测试输入和 `KEEP_TEST_ARTIFACTS=1` 用法见[测试与 Fixture](./testing-and-fixtures)。

## GUI 调试流程

首次调试先执行一次构建，之后通常开三个终端：

```shell
pnpm watch
pnpm startgui
pnpm start
```

链路如下：

1. `pnpm watch` 把主进程、preload、workflow 和 js-rpc 资源更新到 `dist`。
2. `pnpm startgui` 在 8080 端口提供 React 页面。
3. `pnpm start` 加载 `dist/index.js --zhihuhelp-debug`；主窗口加载 Vite 页面并打开 DevTools。
4. js-rpc 子窗口用于知乎签名，调试模式下可见并可打开 DevTools。
5. 前后端按日日志写入 `PathConfig.rootPath/log`，文件名和排查方法见[数据与日志](./data-and-logging)。

修改 `src/preload.js`、`src/public/js-rpc` 或 Electron 主进程后必须等待 `pnpm watch` 完成，再重启 Electron；只刷新浏览器页面不会更新这些代码。

## CLI 调试流程

```shell
pnpm build
pnpm zhihuhelp run --config config.json
```

可以从 `demo.config.json` 复制配置结构。`--config` 指向当前 schema：`request`、`tasks`、`generate`；旧的 `requestConfig/fetchTaskList/generateConfig` schema 会明确报错，不做隐式迁移。`--database` 和 `--output` 可覆盖默认数据库或输出位置。

纯 Node CLI 可直接运行 `init` 和 `generate`。当前 CLI 不会自动拉起 Electron signer；执行需要知乎签名的 `fetch/run` 时，若宿主没有预先注入签名 bridge，会以稳定的 `SIGNATURE_FAILED` 非零退出，而不是 TypeError 或假成功。GUI、`pnpm test:online` 和 `pnpm fixtures:refresh` 会负责注册 Electron signer；CLI 独立真实抓取不属于本期范围。

执行后检查：

1. 命令退出码和终端摘要。
2. `log/runtime.YYYY-MM-DD.log` 与 `log/runtime.YYYY-MM-DD.jsonl`。
3. SQLite 数据和 `知乎助手输出的电子书`。

## 类型检查与构建验证

前端类型和生产构建：

```shell
cd client
pnpm exec tsc --noEmit
pnpm build
```

根项目类型检查和编译：

```shell
pnpm exec tsc --noEmit
pnpm build
```

根 `tsconfig.json` 的 `checkJs` 为 `false`，历史 JavaScript preload/js-rpc 文件不参与完整 JS 类型检查；新增或修改 TypeScript 仍必须通过根类型检查。涉及 GUI 静态资源或打包时，再执行：

```shell
pnpm buildgui
```

完整交付前至少运行与改动范围对应的类型检查、离线测试和构建。在线测试是显式验证，不包含在普通 `pnpm test` 中。
