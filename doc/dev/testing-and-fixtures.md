---
title: 测试与 Fixture
description: 离线测试、在线冒烟、fixture 更新及临时数据隔离规范。
---

# 测试与 Fixture

## 目标与边界

测试套件使用 Vitest workspace，把可重复的离线验证与受知乎状态影响的在线验证分开：

| 层级             | 默认联网 | 运行环境             | 目标                                                              |
| ---------------- | -------- | -------------------- | ----------------------------------------------------------------- |
| 单元测试         | 否       | Node                 | 配置、URL、任务分派、排序分卷、三格式生成、日志契约与脱敏等纯逻辑 |
| 前端组件测试     | 否       | jsdom + mock IPC     | 表单、页面状态、日志、数据浏览和错误边界                          |
| 本地集成测试     | 否       | Node + 临时 SQLite   | init/fetch/generate、持久化、输出、日志与 IPC 契约                |
| 知乎在线冒烟测试 | 是       | 可见 Electron runner | Cookie、签名、最小真实请求和 fixture 采集前置验证                 |

`pnpm test` 只运行前三层，强制阻止外网访问，也不会读取仓库根目录的 `config.json`。真实 Electron UI E2E 不在本期范围；在线命令显示 Electron/js-rpc 窗口只是为了提供签名运行时和诊断信息。

## 目录约定

| 路径                | 内容                                                      |
| ------------------- | --------------------------------------------------------- |
| `tests/unit`        | 后端与共享纯逻辑测试                                      |
| `tests/client`      | React 组件、页面状态和 mock IPC 测试                      |
| `tests/integration` | 临时 SQLite、workflow、生成、日志和 IPC 契约测试          |
| `tests/helpers`     | 临时目录、网络 guard、fixture loader、全局状态恢复等工具  |
| `tests/setup`       | Vitest 离线网络 guard 和 jsdom 初始化                     |
| `scripts/tests`     | Cookie 前置、Electron 在线 runner、fixture 刷新和辅助脚本 |
| `fixtures/zhihu`    | 已脱敏、裁剪、可离线复现的知乎响应及来源清单              |

测试不得依赖 `dist` 中的旧构建产物；模块别名、TS/TSX 和 renderer 环境由 Vitest workspace 的对应 project 配置。

## 命令

| 命令                    | 行为                                                               |
| ----------------------- | ------------------------------------------------------------------ |
| `pnpm test:titles`      | 静态检查三个测试目录的 Vitest 标题均包含中文描述                   |
| `pnpm test`             | 运行单元、前端组件和本地集成测试，并输出 V8 coverage；严格禁止联网 |
| `pnpm test:unit`        | 只运行离线单元测试                                                 |
| `pnpm test:client`      | 只运行 jsdom 前端组件测试                                          |
| `pnpm test:integration` | 只运行临时数据库与 workflow 集成测试                               |
| `pnpm test:online`      | 启动可见 Electron 签名运行时，执行低请求量在线冒烟；不更新 fixture |
| `pnpm fixtures:refresh` | 唯一允许联网并改写 `fixtures/zhihu` 的命令                         |

默认使用串行执行或独立进程隔离会修改全局路径、HTTP 缓存、任务池和 SQLite client 的用例。不要为了缩短时间把这些用例直接改成同进程并行。

两条 Electron 在线命令复用 `dist` 中的 HTTP、签名与请求配置模块；运行前必须先单独执行 `pnpm build`，或保持 `pnpm watch` 已完成首轮编译。在线 runner 不会隐式重建 `dist`。

## 测试描述语言

`tests/unit`、`tests/client` 与 `tests/integration` 中所有 `describe`、`it`、`test` 及 `.each` 参数化标题使用中文描述，以便从终端和覆盖率输出直接定位失败场景。`IPC`、`HTTP`、`JSONL`、`SQLite`、`HTML`、`Markdown`、`EPUB`、`Electron`、`Worker`、`CommonJS`、`ESM`、`partial_success`、`url_token`、类名和字段名等必要专业名词可以保留英文，但标题中仍须包含中文语义。

参数化标题保留 `%s`、`%#`、`$label` 等占位符。仅用于标题展示的 `label` 应使用中文；若值同时参与断言或业务逻辑，则保留原值并增加独立中文标题字段。测试文件名、Vitest project 名、断言消息、mock 数据、fixture 与快照不因标题中文化而修改。

`pnpm test:titles` 使用 AST 解析测试文件；发现纯英文标题时会输出文件、行号和原始标题，并以非零状态退出。全部离线测试命令都会先运行该检查。

## Cookie 规则

只有 `pnpm test:online` 与 `pnpm fixtures:refresh` 可以只读仓库根目录 `config.json` 中的 `request.cookie`。这是对“测试不得读取业务配置”的唯一例外：

1. `pnpm test`、`test:unit`、`test:client`、`test:integration` 不得读取该文件。
2. `config.json` 不存在、Cookie 为空、格式错误或已失效时，在线命令给出更新指引并以非零状态退出；不得把认证失败当作正常空列表。
3. Cookie 不得复制到临时配置、fixture、快照、coverage、日志、错误消息或测试报告。
4. 在线 runner 的日志遵循[数据与日志](./data-and-logging)中的同一套脱敏规则。

## Fixture 更新流程

普通测试永不自动刷新 fixture。需要更新时：

1. 手工确认根目录 `config.json.request.cookie` 有效。
2. 执行 `pnpm fixtures:refresh`；runner 只请求场景所需的最少页数，通常为 1–2 页。
3. 采集器先递归移除敏感字段和无关长正文，再裁剪为测试真实使用的字段。
4. 每份 fixture 写入 `schemaVersion`、`sourceType`、`capturedAt` 和内容校验值；不得包含 Cookie、完整 headers、签名值或私人数据。
5. 刷新命令校验 schema 与内容校验值，自动执行完整 `pnpm test`，通过后输出待审阅的 diff 摘要。
6. 开发者人工检查 diff 后再提交。fixture 过旧只给维护提示，不导致离线测试随机失败。

在线 fixture 不只校验 envelope。`fixtures/zhihu/sources.json` 是采集语义清单；每个 `online/*.json` 文件名必须与 `source.name` 一致，并满足：

1. `sourceType`、`sourceUrl` 与 manifest 完全一致，实体稳定 id（作者为 `id` 或 `url_token`）与 `source.id` 匹配。
2. 声明 `pageOffsets` 时，fixture 必须逐页匹配 source name/type/id、offset 和正整数 limit；`itemCount` 必须等于 `items.length`。
3. 每个分页摘要必须至少有稳定 id 或 type；多页收藏夹还要求 id 可去重且不得跨页重复。
4. 非可选分页来源的第一页不能为空。异常/删除 envelope 只允许 manifest 中的可选来源或明确命名的异常采集来源。
5. fixture 必须使用 schemaVersion 1、合法 `capturedAt` 和匹配 `data` 的 SHA-256 校验值；离线测试另行扫描常见 Cookie、Authorization、Set-Cookie 与签名泄漏模式。

写入器会递归脱敏，并限制对象深度、字段数、数组长度与长字符串；当前校验器不另设整个 fixture 文件的字节上限。测试需要动态时间、随机 id 或本地路径时，应在 loader 中规范化，不把机器相关值写进快照。

`pnpm test:online` 从 `online: true` 的清单中按 `sourceType` 选择一个非异常代表样本；它校验实体 id、稳定字段、声明的最小分页，并把回答写入临时 SQLite 后读回，不更新 fixture。`pnpm fixtures:refresh` 则采集全部 `online: true` 来源，先写到测试产物中的 staging 目录，全部采集完成后才同步到 `fixtures/zhihu/online`；随后检查文件集合与 manifest 一致、逐份执行上述语义校验、运行完整离线测试并打印 Git 状态/统计供人工审阅。`online: false` 的空/404 收藏夹不联网刷新，只由固定离线错误 fixture 覆盖。

在线 runner 的专用事件码集中在 `scripts/tests/electron-online-runner.cjs` 的 `TestLogEventCode`，统一使用构建后的共享 `LogLevel/LogStage/LogStatus`，不得在测试步骤中散落状态魔法字符串。在线运行的日志、缓存、SQLite 和输出都指向临时产物目录。

## 在线公开数据

以下 URL 是当前在线冒烟和 fixture 采集的候选输入。同一实体可复用于多个场景；外部内容可能变化，在线断言只检查稳定字段和关系，不比较完整正文。

| 数据        | URL                                                                             | 用途与约束                                                |
| ----------- | ------------------------------------------------------------------------------- | --------------------------------------------------------- |
| 普通用户 1  | `https://www.zhihu.com/people/jin-xu-liang`                                     | 用户回答、文章、想法、提问、活动与分页候选                |
| 普通用户 2  | `https://www.zhihu.com/people/yu-san-geng`                                      | 第二组公开用户数据与分页候选                              |
| 异常用户    | `https://www.zhihu.com/people/ma-qian-zu`                                       | 404/销号候选；在线不稳定时允许跳过，离线 fixture 必须覆盖 |
| 问题        | `https://www.zhihu.com/question/1955952667529545081`                            | 多回答与分页                                              |
| 回答        | `https://www.zhihu.com/question/1955952667529545081/answer/1997069426684610035` | 单条回答                                                  |
| 文章        | `https://zhuanlan.zhihu.com/p/2044554555665428776`                              | 单条文章                                                  |
| 想法        | `https://www.zhihu.com/pin/2067239959539487399`                                 | 单条想法                                                  |
| 话题        | `https://www.zhihu.com/topic/19659568/hot`                                      | 话题回答与分页                                            |
| 收藏夹      | `https://www.zhihu.com/collection/37171281`                                     | 回答、文章、想法混合关系                                  |
| 专栏        | `https://www.zhihu.com/column/c_144661311`                                      | 专栏文章与分页                                            |
| 空/异常候选 | `https://www.zhihu.com/collection/1004788928`                                   | 404 或空列表候选；不稳定时仅保留离线覆盖                  |

赞同、关注、销号、删除和 404 等场景受账号权限或站点状态影响时，可以在在线层标记为可选；对应解析、错误分类和持久化行为仍必须由固定 fixture 离线覆盖。

## 覆盖与验收场景清单

下表是本需求的覆盖合同，也是继续补测时的索引；某个命令当前只执行其中的最小子集时，不得据此宣称整个层级已经覆盖。新增或拆分测试文件时保留编号，便于从失败结果反查业务链路。

### 单元测试

| 编号 | 模块          | 必测场景                                                                                                                                                                                                 |
| ---- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| U01  | 配置          | 默认配置创建、当前 schema 读写、缺失/非法字段、空文件、损坏 JSON；旧 schema 明确拒绝并给出诊断，不做隐式迁移；当前 schema 的旧格式子集强制规范化为 `html/markdown/epub`                                  |
| U02  | 配置转换      | 前端表单与任务配置双向转换不丢字段、无格式选择器且提交始终写入三格式；Cookie 不进入快照和错误输出                                                                                                        |
| U03  | URL 识别      | 用户、问题、回答、文章、想法、话题、收藏夹、专栏，以及 query、fragment、尾斜杠、空白和非法输入                                                                                                           |
| U04  | 任务编排      | 同类型合并、id 去重、`skipFetch`、空任务、未知类型和全部 15 种任务到 batch fetcher 的映射                                                                                                                |
| U05  | 日志契约      | 必填字段、共享常量、稳定 `eventCode`、关联 id、Error/非 Error、循环引用和 BigInt 等不可直接 JSON 化值                                                                                                    |
| U06  | 日志脱敏      | Cookie、Authorization、headers、嵌套敏感键、长文本、URL query 和完整响应正文                                                                                                                             |
| U07  | 日志文件      | 本地自然日命名、跨日切换、每类仅保留最近 5 个日期文件、并发追加产生合法 JSONL、写入失败安全降级                                                                                                          |
| U08  | 排序          | 7 种排序指标、升降序、缺失值、相同值稳定排序和多重排序                                                                                                                                                   |
| U09  | 分卷          | 0、`max-1`、`max`、`max+1`、多 Unit、单个 Unit 跨卷和卷内计数                                                                                                                                            |
| U10  | 生成策略      | `single`、`merge_by_task`、`merge_by_all` 的分组、标题、章节和顺序                                                                                                                                       |
| U11  | 三格式输出    | HTML/EPUB 的特殊字符、空内容、图片策略、安全文件名、长标题卷名、目录页、单页 HTML、EPUB XML/MIME/封面；Markdown 覆盖标题、列表、链接、表格、代码、中文、全部多文件/单文件来源、内部链接和远程/无图策略   |
| U12  | 数据模型      | 主表、关系表、损坏 `raw_json` 和问题信息从回答记录恢复                                                                                                                                                   |
| U13  | 输出历史      | 仅扫描最近 5 个自然日中 `success/partial_success` 的 `output.created`、保留三格式路径与告警状态、规范化路径去重、倒序、损坏行容错、忽略仅携带 `outputPath` 的其他成功事件，以及第 6 日历史随日志清理消失 |
| U14  | Pandoc Worker | generate 期间 worker 仅在首次转换时创建、跨书复用单实例串行队列、GFM 参数、命令结束释放与异常回收；转换失败生成 `.pandoc-failed.md` 并改写链接，回退成功不触发局部成功，真实写入失败向上汇总             |

### 前端组件测试

| 编号 | 页面/能力 | 必测场景                                                                                            |
| ---- | --------- | --------------------------------------------------------------------------------------------------- |
| F01  | 首页      | 普通/开发者模式页签、切换状态和动态调试页不改变 Hook 顺序                                           |
| F02  | 任务管理  | 初始配置、单条/批量链接、增删任务、校验错误、无格式选择器、旧格式子集规范化和固定三格式提交         |
| F03  | 登录状态  | 检查中、有效、失效、IPC 异常和跳转登录页                                                            |
| F04  | 运行日志  | 等待/运行/成功/局部成功/失败、最新 `runId`、自动刷新、损坏行和清理                                  |
| F05  | 输出历史  | 最近五日倒序、HTML/Markdown/EPUB 打开入口、空状态、打开路径失败和诊断导出                           |
| F06  | 数据浏览  | 摘要、分页、父子筛选、空数据、详情 HTML 和 IPC 失败                                                 |
| F07  | 调试面板  | IPC 成功/失败、非字符串日志、非法参数和高风险操作提示                                               |
| F08  | 前端日志  | 页面切换、关键操作、IPC、Error Boundary、`error`、`unhandledrejection`，以及日志 IPC 不递归记录自身 |

### 本地集成测试

| 编号 | 链路          | 必测场景                                                                                                                                                                                                                                                               |
| ---- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I01  | 初始化        | 临时目录和 SQLite 建立、重复执行、`rebase`、失败路径；版本检查与外网均被替换                                                                                                                                                                                           |
| I02  | Single API    | 各类 fixture 解析；空列表、分页结束、字段缺失、认证、权限、删除和网络错误可区分                                                                                                                                                                                        |
| I03  | Batch 抓取    | 全部任务类型、1–2 页分页、活动时间段、子任务扩展、去重、局部失败和入库                                                                                                                                                                                                 |
| I04  | 数据关系      | 收藏夹混合内容、话题回答、专栏文章、问题回答和作者内容关系一致                                                                                                                                                                                                         |
| I05  | 完整 Workflow | init → fetch → generate，以及各阶段失败；同一 `runId` 的 start 后恰好一个终态                                                                                                                                                                                          |
| I06  | 输出          | 三种生成模式每次固定 HTML/Markdown/EPUB；每书全部多文件与单文件 HTML 都有对应 Markdown，GFM/图片/链接/fallback 可读；缺图或真实写入失败局部成功、Windows 中文目录、超长标题双卷；成品 EPUB 必须可解包，包含必需元数据、正文文件，且 OPF manifest/spine 与 ZIP 条目一致 |
| I07  | 日志汇聚      | 前后端 schema、关联 id、脱敏、按日保留、最近五日历史、诊断导出和写入失败降级                                                                                                                                                                                           |
| I08  | IPC 契约      | channel 白名单、payload schema、大小/频率限制、非法路径和主进程错误返回                                                                                                                                                                                                |
| I09  | 隔离清理      | 成功时清理、保留现场开关、SQLite/计时器/任务池/HTTP 缓存/全局路径恢复                                                                                                                                                                                                  |

### 在线冒烟与刷新

| 编号 | 场景                             | 预期                                                               |
| ---- | -------------------------------- | ------------------------------------------------------------------ |
| O01  | `config.json` 缺失或 Cookie 为空 | 给出配置方法并非零退出                                             |
| O02  | Cookie 格式错误或失效            | 明确认证失败，不把空数据当成功，不输出 Cookie                      |
| O03  | 有效 Cookie 与最小签名请求       | 返回稳定字段，并记录耗时和脱敏诊断信息                             |
| O04  | 单条回答、文章、想法             | 各读取一条并通过 fixture schema 校验                               |
| O05  | 问题、话题、收藏夹、专栏         | 各最多读取 1–2 页，验证分页结束和关系                              |
| O06  | 用户型任务                       | 回答、文章、想法、提问、赞同、关注覆盖首个有效页；权限不稳定项可选 |
| O07  | 销号、删除、404、正常空列表      | 区分认证、权限、删除、空数据和网络失败；不稳定输入允许在线跳过     |
| O08  | fixture 刷新                     | 脱敏、裁剪、schema、校验值、全部离线回归和人工 diff 摘要通过       |

## 临时目录与清理

每次离线集成测试创建独立临时根目录，并把配置、SQLite、缓存、输出和日志全部指向该目录。测试完成时：

1. 关闭 SQLite、Electron、文件句柄和计时器。
2. 清理 HTTP 缓存、任务池及所有可变静态配置。
3. 默认删除临时目录。
4. 设置 `KEEP_TEST_ARTIFACTS=1` 时保留现场，并在测试结果中打印绝对路径。
5. 测试无论成功或失败都不得覆盖仓库现有 `config.json`、SQLite、缓存、输出和日志。

## 结果与验收

`pnpm test` 只有在全部离线 project 通过、没有未关闭 handle、没有外网请求且没有业务目录写入时才返回 0。V8 coverage 报告用于发现后续补测点，本期不以容易失真的全仓百分比作为唯一门槛。

`pnpm test:online` 是显式命令：Cookie 前置验证失败必须非零退出；仅已标注的外部不稳定场景可以 `SKIP`，并在摘要中给出原因。`partial_success` 不能被测试当作 `success`，必须断言成功数、失败数和失败实体摘要。Markdown 用例还要区分“Pandoc 转换失败但回退文件成功”的警告与“文件无法写入”的真实输出失败：前者保持成功并断言 `fallbackCount`，后者才按剩余 HTML/EPUB 产物断言局部成功或失败。
