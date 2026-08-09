---
layout: home
title: 知乎助手
titleTemplate: false
description: 将知乎回答、文章、想法、收藏夹等内容保存到本地，并固定生成 HTML、Markdown 与 EPUB。

hero:
  name: 知乎助手
  text: 把喜欢的知乎内容，变成自己的离线书库
  tagline: 在本地完成任务识别、内容抓取与数据整理，每次同时生成 HTML、Markdown 和 EPUB，也为开发者提供完整的运行诊断与维护文档。
  image:
    src: /brand/知乎助手-宣传图.png
    alt: 知乎助手宣传图，展示从知乎内容到本地离线书库的产品定位
    width: 1731
    height: 909
    loading: eager
    fetchpriority: high
  actions:
    - theme: brand
      text: 开始使用
      link: /guide/getting-started
    - theme: alt
      text: 阅读开发文档
      link: /dev/
    - theme: alt
      text: 下载最新版本
      link: https://github.com/YaoZeyuan/zhihuhelp/releases

features:
  - icon: 🔗
    title: 覆盖常用知乎内容
    details: 识别回答、文章、想法、问题、收藏夹、专栏、话题和用户链接，并按任务类型抓取关联内容。
  - icon: 📚
    title: 三种格式固定输出
    details: 每次任务同时生成 HTML、Markdown 与 EPUB；HTML 和 Markdown 都包含多文件目录版与单文件版，并支持自动分卷。
  - icon: 🗂️
    title: 本地数据浏览
    details: 数据保存在本机 SQLite 中，可按实体类型浏览缓存内容并查看最近五日输出历史。
  - icon: 🩺
    title: 清晰的运行诊断
    details: 阶段状态、关联标识和结构化日志贯穿抓取与生成流程，失败位置和部分成功结果一目了然。
  - icon: 🖥️
    title: 桌面端操作体验
    details: 通过 Electron 完成登录、任务配置、执行、数据浏览和结果打开，数据处理不依赖远程服务。
  - icon: 🧩
    title: 可维护的开发链路
    details: GUI、Electron、IPC 与后端职责清晰，配套离线测试、在线冒烟、fixture 和流程图文档。
---

<div class="home-content">

## 从链接到离线书库

粘贴一个受支持的知乎链接，知乎助手会识别任务类型，低并发抓取公开内容并写入本地数据库，最后按照你的排序、图片质量和分卷设置同时生成 HTML、Markdown 与 EPUB。不可恢复错误会准确终止任务，个别实体失败则以部分成功结束并保留可用结果。

<div class="workflow-strip" aria-label="知乎助手任务执行流程">
  <div class="workflow-step"><strong>01 · 添加任务</strong><span>粘贴知乎链接，自动识别内容类型并检查登录状态。</span></div>
  <div class="workflow-step"><strong>02 · 抓取整理</strong><span>按页读取内容、扩展关联实体，并持久化到本地 SQLite。</span></div>
  <div class="workflow-step"><strong>03 · 配置生成</strong><span>设置排序、图片质量与自动分卷；三种输出格式无需选择。</span></div>
  <div class="workflow-step"><strong>04 · 阅读与诊断</strong><span>打开生成结果，或从运行日志和输出历史定位问题。</span></div>
</div>

## 熟悉的界面，完整的本地工作流

任务管理、运行诊断、数据浏览与最终输出都在同一套桌面应用中完成。示例画面使用公开 fixture 和隔离的临时环境制作，不包含真实 Cookie、账号或私人内容。

<div class="product-showcase">
  <figure class="product-shot">
    <img :src="'/screenshots/task-management.png'" alt="知乎助手任务管理页面，展示链接识别、生成设置和任务启动入口" loading="lazy">
    <figcaption>任务管理：识别链接、配置生成方式并启动任务</figcaption>
  </figure>
  <figure class="product-shot">
    <img :src="'/screenshots/runtime-log.png'" alt="知乎助手运行日志页面，展示阶段状态及 HTML、Markdown、EPUB 输出历史" loading="lazy">
    <figcaption>运行日志：查看阶段状态、诊断事件与三格式输出历史</figcaption>
  </figure>
  <figure class="product-shot">
    <img :src="'/screenshots/data-explorer.png'" alt="知乎助手数据浏览页面，展示本地缓存内容列表" loading="lazy">
    <figcaption>数据浏览：按内容类型查看本地 SQLite 缓存</figcaption>
  </figure>
  <figure class="product-shot">
    <img :src="'/screenshots/output-preview.png'" alt="知乎助手生成后的 HTML、Markdown 与 EPUB 内容预览" loading="lazy">
    <figcaption>输出预览：同时生成便于归档、编辑和离线阅读的三种格式</figcaption>
  </figure>
</div>

## 从使用到贡献，都有清晰入口

<div class="docs-entry-grid">
  <a class="docs-entry" href="/guide/">
    <strong>用户指南 →</strong>
    <span>了解登录、添加任务、输出设置、数据浏览和常见问题。</span>
  </a>
  <a class="docs-entry" href="/dev/">
    <strong>开发文档 →</strong>
    <span>理解架构、业务流程、IPC、日志、测试与 fixture 维护方式。</span>
  </a>
  <a class="docs-entry" href="/about/">
    <strong>关于项目 →</strong>
    <span>查看许可证、版本状态、更新日志和参与贡献的入口。</span>
  </a>
  <a class="docs-entry" href="https://github.com/YaoZeyuan/zhihuhelp/issues">
    <strong>问题反馈 →</strong>
    <span>在 GitHub 提交可复现的问题、改进建议或文档修正。</span>
  </a>
</div>

</div>
