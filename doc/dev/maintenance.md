---
title: 维护注意事项
description: 修改 IPC、日志、数据浏览、输出和测试时的同步检查清单。
---

# 维护注意事项

## 不要扩大旧边界

当前项目可运行，但仍有一些历史边界较宽的模块：

1.  `src/index.ts` 同时管理窗口、IPC、cookie、文件和部分日志逻辑。
2.  `src/api/batch` 同时负责分页、子任务扩展和入库。
3.  `src/application/workflow/generate/customer.ts` 同时负责数据组装、排序、分卷、渲染和输出。

维护时优先把新业务放到更合适的位置，不要继续把所有逻辑塞进上述文件。

## 维护共享任务 schema

任务类型、生成模式、图片质量和输出格式的唯一常量源是 `src/shared/config/task_schema.ts`。根项目 `src/constant/task_config.ts` 与前端 `client/src/resource/const/task_config.ts` 只做兼容导出和各自默认值组合，不得重新定义一套不同的序列化值。

涉及任务配置转换时，应检查：

1.  `client/src/page/home/component/customer_task/library/task_config_adapter.ts`
2.  `src/domain/task/task_config.ts`
3.  `src/constant/task_config.ts`
4.  `client/src/resource/const/task_config.ts`

输出格式固定为 `html/markdown/epub`：GUI 不提供选择器，前端 adapter、parser 和 workflow 都必须忽略旧子集并恢复完整列表。新增格式或改变这一行为属于产品契约变化，必须同时修改用户文档、共享 schema、前后端测试和生成链路。

## 修改 IPC 的同步清单

新增或修改 IPC 时同步检查：

1.  `src/index.ts`
2.  `src/preload.cjs`
3.  `src/renderer.d.ts`
4.  `client/src/page/home/component/debug/index.tsx`
5.  `client/src/library/debug_log.ts` 的 passive channel 与调用记录
6.  [前端 / Electron / 后端分工](./frontend-electron-backend)

如果 IPC 返回本地文件路径，也要考虑：

1.  路径是否存在。
2.  文件和目录打开行为是否不同。
3.  是否需要脱敏。

前端日志 IPC 是特殊通道：renderer 不能传目标文件路径；主进程必须校验 schema、单条大小、批量数量和敏感字段；该通道必须绕过通用 IPC recorder，避免递归写日志。

## 修改日志的同步清单

日志影响运行状态、最近五日输出历史和诊断导出。修改共享契约、`Logger.event` 或关键 workflow 日志时同步检查：

1.  `src/shared/logging/log_contract.ts`
2.  `src/shared/logging/output_history.ts`
3.  `src/library/logger.ts`
4.  `client/src/library/debug_log.ts`
5.  `client/src/page/home/component/log/index.tsx`
6.  `src/index.ts` 中的输出历史和诊断导出 handler
7.  [数据与日志](./data-and-logging)
8.  `tests/unit/log-contract.test.ts`、`tests/unit/logger-files.test.ts` 及相关集成测试

阶段状态必须依赖共享 `eventCode/status`，不得依赖中文 `message`。关键阶段遵循：

1.  先写 `start`。
2.  最后恰好写一个 `success`、`failure` 或 `partial_success`。
3.  局部失败记录成功数、失败数和失败实体摘要。
4.  不可恢复错误继续向上抛出，日志失败不能覆盖业务错误。
5.  新增事件码时同时更新共享常量和[结构化日志事件诊断表](./data-and-logging#结构化日志事件诊断表)。Markdown 子 job 必须保持 `output.markdown.start` 后恰好一个终止事件：`success`、`fallback(status=success)` 或 `failure`；回退详情在该终止事件中汇总。

日志默认位于 `PathConfig.rootPath/log`，文本、后端 JSONL 和前端 JSONL 每类各保留最近 5 个日期文件。GUI 输出历史也只覆盖这 5 日；不要重新引入“日志永久保存”或独立永久历史的假设。

## 修改数据浏览的同步清单

数据浏览涉及前端、IPC 和数据库摘要模型：

1.  `client/src/page/home/component/db_explorer/index.tsx`
2.  `client/src/page/home/component/db_explorer/index.less`
3.  `client/src/page/home/component/db_explorer/resource/type/index.d.ts`
4.  `src/model/summary.ts`
5.  `src/index.ts` 中的 `get-db-summary-info` 和 `get-db-record-list`

增加新字段时，优先在 `src/model/summary.ts` 做统一转换，不要让前端直接理解 SQLite 行结构。

配置与数据库页面都必须保留可见失败态。配置解析失败时只能展示安全默认表单并禁止启动，不能把默认值写回覆盖损坏或旧 schema 配置；数据库摘要/列表失败必须与合法空数据使用不同的 Alert、Empty 文案和测试断言。

## 修改生成输出的同步清单

生成文件、分卷或任一输出格式结构变更时同步检查：

1. `src/shared/path/safe_output_path.ts` 的 Windows 非法字符、保留名、路径越界、120 字符上限和长名稳定摘要。
2. 分卷名称在安全化前包含 `_N-of-M卷`，保证超长标题的不同卷仍生成不同路径。
3. Windows + Node.js 24 的中文目录复制继续使用显式递归与 `copyFileSync`；不要未经真实回归改回 `fs.cpSync`。
4. EPUB 的 `mimetype` 是第一个 STORE 条目，OPF/TOC XML 已转义，图片扩展名与 MIME 一致，封面不重复登记。
5. 每本书全部 `html/*.html` 与 `单文件版/*.html` 都进入 Markdown 来源清单；结果分别位于 `markdown/<安全书名>/html/*.md` 与 `单文件版/*.md`，内部链接必须指向实际结果。
6. Markdown 的 `none` 图片策略删除图片，`raw/hd` 恢复远程 URL 且不复制资源；不要把 HTML 缓存中的本地图片路径泄漏进 Markdown。
7. Pandoc 只能在 generate 期间按需创建的单 worker 中串行运行，并在命令结束后回收。转换失败写 `.pandoc-failed.md` 并汇总 fallback，不触发局部成功；结果文件真正写入失败才按其他格式是否可用汇总为 `partial_success/failure`。
8. 缺失下载图片不进入 EPUB manifest，并把可用产物记录为 `partial_success`；输出历史仍应保留并显示该告警状态。
9. 运行 `safe-output-path`、`epub-metadata`、Markdown generator/worker、`output-generation-contract` 和真实双卷 workflow 集成测试。

## 维护 ESM 与 CJS 边界

根包是原生 ESM。Electron main、CLI 和后端 TypeScript 的导入必须符合 NodeNext 运行时解析，并保留显式 `.js` 扩展。sandbox preload 和必须使用 CommonJS 的工具脚本以 `.cjs` 命名；不要重新添加无后缀相对导入、`require` 业务入口或同名旧 `.js` preload。

修改模块边界后至少检查：

1. `pnpm exec tsc --noEmit` 与 `pnpm build`。
2. `dist/index.js` 和 CLI 入口仍是 ESM，两个 preload 复制为 `.cjs`，没有旧 preload 残留。
3. `pnpm watch` 可以单独增量更新 `dist`，`pnpm start` 仍只启动已有产物。
4. `pnpm watch`、`pnpm startgui`、`pnpm start` 组合下完成 Electron 人工冒烟。
5. Markdown worker 的运行时 URL 能在源码测试、`dist` 和打包目录中解析，Pandoc WASM 只在转换时加载，worker 在 generate 结束后释放。
6. `pnpm-workspace.yaml` 将 `app-builder-lib>@electron/get` 精确覆盖为 `3.1.0`：该版本仍在 electron-builder 声明的 3.x 兼容范围内，并提供构建器使用的缓存模式 API。不要把这个 CJS 调用方全局覆盖到 ESM-only 的 5.x；升级 electron-builder 后应重新核对依赖范围并同时执行 `pnpm pack` 与 `pnpm dist`。

## 发布 Pandoc 对应源码

桌面发行包包含 `pandoc-wasm@1.1.0` 与 Pandoc 3.10 WASM。项目源码允许按 `MIT OR GPL-2.0-or-later` 使用；包含 Pandoc 的官方桌面发行包按 `GPL-2.0-or-later` 分发，并必须同时提供精确的对应源码，不能把 `node_modules` 或单独的 `pandoc.wasm` 当作源码。

发布前检查：

1. 执行 `node scripts/release/create-corresponding-source.cjs --verify-installed`，确认锁定版本与 WASM 校验值。
2. 生成 `zhihuhelp-<version>-corresponding-source.tar.gz` 及 `.sha256`，其中包含同一 Git commit、锁文件、构建说明以及固定校验值的 pandoc-wasm/Pandoc 源码归档。
3. 在构建前使用 `--stage-license-files dist/licenses`，在打包后使用 `--verify-packaged release`。
4. 每个 Windows/macOS 二进制 Release 必须同时上传对应源码包和校验文件；任一下载、版本、工作区状态或校验失败都应中止发布。
5. 具体命令、离线源码缓存方式和重建步骤以仓库根 `CORRESPONDING_SOURCE.md` 与 `THIRD_PARTY_NOTICES.md` 为准。

## 维护 Mermaid 流程图查看器

`doc/.vitepress/theme/mermaid.ts` 在客户端渲染每张流程图，并为其添加“全屏查看”和“新标签打开 SVG”操作。维护时保留以下边界：

1. 全屏状态依赖浏览器 Fullscreen API，使用原生 `Esc` 或“关闭全屏”退出；退出后焦点回到触发按钮。
2. 新标签入口必须始终是可直接激活的 `<a target="_blank" rel="noopener noreferrer">`。浏览器不支持或拒绝全屏时，显示提示并把焦点移到该入口。
3. 独立 SVG 使用 Blob URL，并固化当前主题背景；主题重绘、路由切换和页面退出时及时撤销旧 URL，但不能在点击后立即撤销。
4. 异步 Mermaid 渲染写入 DOM 前必须检查节点仍在页面中；渲染失败时只显示源码回退，不保留无效查看按钮。
5. 全屏样式必须用 `!important` 覆盖 Mermaid SVG 的内联尺寸限制，移动端操作区不小于 44px 并保留安全区边距。
6. 修改交互后运行 `tests/client/mermaid-viewer.test.ts`、`pnpm docs:build` 和 `pnpm docs:check`。

## 更新文档站产品截图

首页产品截图必须使用隔离的公开示例，不得连接真实 Electron 主进程或读取根目录 `config.json`、Cookie 和业务 SQLite。

1. 任务管理、运行日志和数据浏览预览只有在 Vite 开发模式、`VITE_DOCS_SCREENSHOT_MODE=1` 与 `?docs-preview=app` 三项同时满足时才会加载 `client/src/docs_preview/install.ts`；不得放宽这三重门禁。
2. HTML / Markdown / EPUB 输出示例先完成根项目构建，再运行 `node scripts/docs/prepare-output-screenshot.cjs`。脚本只把产物写入仓库内的 `.docs-screenshot-tmp`，采集完成后必须删除该目录。
3. 更新后的 PNG 放入 `doc/public/screenshots`，随后执行 `pnpm buildgui`，确认生产 GUI 产物中不存在 `docs-preview` fixture 标记。
4. 最后执行 `pnpm docs:build` 与 `pnpm docs:check`；校验会检查四张截图、品牌资源、七张 Mermaid 图、公开路由和敏感信息。

## 验证建议

文档或前端改动：

```shell
cd client
pnpm exec tsc --noEmit
pnpm build
```

Electron 静态资源更新：

```shell
pnpm buildgui
```

根项目构建：

```shell
pnpm build
```

根项目类型检查：

```shell
pnpm exec tsc --noEmit
```

行为、日志或数据改动还应运行：

```shell
pnpm test
```

真实知乎验证只通过显式的 `pnpm test:online` 或 `pnpm fixtures:refresh` 执行。普通测试不得联网或读取业务 `config.json`；详细边界见[测试与 Fixture](./testing-and-fixtures)。

## 修改测试或 Fixture 的同步清单

1.  测试源码放在 `tests/unit`、`tests/client` 或 `tests/integration`；不要把真实网络调用混入这些目录。
2.  知乎响应 fixture 放在 `fixtures/zhihu`，必须通过 envelope、内容校验值、脱敏扫描和 `sources.json` 语义校验。
3.  只有 `pnpm fixtures:refresh` 可以改写 fixture，更新后人工审阅 diff。
4.  修改可变全局配置、任务池、HTTP 缓存或 SQLite client 时，补充 teardown 和串行/进程隔离验证。
5.  修改命令、Cookie 前提、临时产物策略或允许跳过的在线场景时，同步更新[开发环境与命令](./environment)和[测试与 Fixture](./testing-and-fixtures)。

## 文档更新规则

1.  面向用户的行为变化，更新 `doc/guide`。
2.  架构、流程、IPC、数据、日志变化，更新 `doc/dev`。
3.  阶段性规划和任务拆解，可继续更新 `doc/项目文档`。
4.  新问题处理记录放在 `doc/task/问题描述-*`。
5.  不要只改 README；README 应保持为入口。
6.  开发文档只描述最终有效行为，不保留已经结束的需求问答或待办标记。
