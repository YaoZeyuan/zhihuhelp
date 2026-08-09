---
title: 关于知乎助手
description: 知乎助手的项目地址、版本状态、许可证、问题反馈和贡献入口。
---

# 关于知乎助手

知乎助手是一个开源的本地桌面工具，用于整理个人希望离线阅读的知乎内容。它通过 Electron 提供图形界面，在本机完成内容抓取、SQLite 持久化和 HTML / EPUB 生成。

## 项目信息

| 项目     | 信息                                                                      |
| -------- | ------------------------------------------------------------------------- |
| 当前版本 | `2.6.0`（开发中，尚未正式发布）                                           |
| 源代码   | [YaoZeyuan/zhihuhelp](https://github.com/YaoZeyuan/zhihuhelp)             |
| 下载     | [GitHub Releases](https://github.com/YaoZeyuan/zhihuhelp/releases)        |
| 许可证   | [MIT License](https://github.com/YaoZeyuan/zhihuhelp/blob/master/LICENSE) |
| 更新记录 | [查看更新日志](./changelog)                                               |

## 使用边界

知乎助手由个人开发者独立维护，与知乎及其关联公司不存在隶属、合作或官方背书关系。

知乎助手用于个人学习、整理和离线阅读。使用者应遵守知乎服务规则、内容版权和相关法律法规，不应将抓取或生成的内容用于未经授权的公开分发或商业用途。

软件默认将配置、缓存、数据库、日志和输出保存在本机。反馈问题前，请检查诊断材料，删除 Cookie、账号、私人收藏、本机绝对路径等敏感信息。

## 问题反馈

如果遇到可复现的问题，请先阅读[常见问题](/guide/faq)，再前往 [GitHub Issues](https://github.com/YaoZeyuan/zhihuhelp/issues) 提交反馈。建议同时说明：

1. 使用的版本、操作系统以及 Node.js / pnpm 版本（开发环境问题）。
2. 可以公开的任务类型、操作步骤与预期结果。
3. 脱敏后的错误提示、事件码、`traceId` / `runId` / `jobId`。
4. 问题是否可以用公开链接或 fixture 复现。

## 参与贡献

欢迎通过 Pull Request 改进抓取兼容性、输出质量、测试和文档。开始前请先阅读[开发环境与命令](/dev/environment)和[维护注意事项](/dev/maintenance)，并确保变更具有对应测试且不会读取或覆盖真实业务数据。

项目的需求和文档遵循仓库内的协作门禁：存在影响范围、接口、数据或验收的实质性歧义时，应先完成需求确认，再开始业务代码修改。
