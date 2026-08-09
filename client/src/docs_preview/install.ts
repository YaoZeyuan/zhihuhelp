import type { IElectronAPI } from '../../../src/renderer'

// This module is dynamically imported only when development mode, the explicit
// build-time opt-in and the preview query flag are all enabled. Keep every
// fixture self-contained so screenshot capture never needs Electron or local data.
const previewConfig = {
  request: {
    ua: 'ZhihuHelp documentation screenshot fixture',
    cookie: '',
  },
  tasks: [
    {
      type: 'question',
      id: '330437383',
      rawInputText: 'https://www.zhihu.com/question/330437383',
      comment: '公开文档示例',
      skipFetch: false,
    },
    {
      type: 'answer',
      id: '720591171',
      rawInputText: 'https://www.zhihu.com/question/330437383/answer/720591171',
      comment: '公开文档示例',
      skipFetch: false,
    },
  ],
  generate: {
    title: '知乎助手公开示例电子书',
    mode: 'merge_by_task',
    imageQuality: 'none',
    maxItemsPerBook: 100,
    orderBy: [{ orderBy: 'desc', orderWith: 'createAt' }],
    outputFormats: ['html', 'epub'],
    comment: '仅用于产品文档截图，不包含真实账号或业务数据',
  },
}

const runtimeEventList = [
  {
    schemaVersion: 1,
    triggerAt: '2026-08-08T02:00:00.000Z',
    source: 'backend',
    traceId: 'docs-preview-trace',
    runId: 'docs-preview-run',
    jobId: 'config-read-docs-preview',
    eventCode: 'config.read.success',
    stage: 'config',
    status: 'success',
    level: 'info',
    message: '任务配置读取完成',
  },
  {
    schemaVersion: 1,
    triggerAt: '2026-08-08T02:00:01.000Z',
    source: 'backend',
    traceId: 'docs-preview-trace',
    runId: 'docs-preview-run',
    jobId: 'stage-init-docs-preview',
    eventCode: 'init.success',
    stage: 'init',
    status: 'success',
    level: 'info',
    message: '缓存目录与数据结构初始化完成',
  },
  {
    schemaVersion: 1,
    triggerAt: '2026-08-08T02:00:03.000Z',
    source: 'backend',
    traceId: 'docs-preview-trace',
    runId: 'docs-preview-run',
    jobId: 'stage-fetch-docs-preview',
    eventCode: 'fetch.success',
    stage: 'fetch',
    status: 'success',
    level: 'info',
    message: '公开示例内容抓取完成，共处理 12 条记录',
  },
  {
    schemaVersion: 1,
    triggerAt: '2026-08-08T02:00:04.000Z',
    source: 'backend',
    traceId: 'docs-preview-trace',
    runId: 'docs-preview-run',
    jobId: 'stage-generate-docs-preview',
    eventCode: 'generate.success',
    stage: 'generate',
    status: 'success',
    level: 'info',
    message: 'HTML 与 EPUB 内容生成完成',
  },
  {
    schemaVersion: 1,
    triggerAt: '2026-08-08T02:00:05.000Z',
    source: 'backend',
    traceId: 'docs-preview-trace',
    runId: 'docs-preview-run',
    jobId: 'generate-book-docs-preview',
    eventCode: 'output.created',
    stage: 'output',
    status: 'success',
    level: 'info',
    message: '公开示例电子书已生成',
  },
]

const runtimeLog = [
  '[10:00:00] 开始读取任务配置',
  '[10:00:01] 初始化缓存目录和数据结构',
  '[10:00:03] 抓取完成：12 条公开示例记录',
  '[10:00:04] 生成 HTML 内容与 EPUB 目录',
  '[10:00:05] 输出完成：知乎助手公开示例电子书',
].join('\n')

const databaseRecordList = [
  {
    key: 'docs-answer-1',
    id: 'docs-answer-1',
    name: '如何高效整理公开资料？',
    title: '如何高效整理公开资料？',
    subtitle: '公开示例问题 · 回答摘要',
    type: '回答',
    description: '从任务配置、内容抓取到本地电子书输出的完整公开示例。',
    recordKind: 'answer',
    contentHtml:
      '<p>先确定整理范围，再将公开内容按主题归档。知乎助手可以把任务结果统一输出为 HTML 和 EPUB，方便离线阅读与检索。</p>',
    sourceUrl: 'https://www.zhihu.com/question/100000000',
    author: {
      id: 'docs-preview-author',
      name: '公开示例用户',
      headline: '此资料仅用于产品文档演示',
      avatarUrl: '',
      url: '',
    },
    voteupCount: 128,
    commentCount: 8,
    createdAt: 1786118400,
    updatedAt: 1786204800,
  },
  {
    key: 'docs-article-1',
    id: 'docs-article-1',
    name: '用本地知识库保存公开内容',
    title: '用本地知识库保存公开内容',
    subtitle: '公开示例文章',
    type: '文章',
    description: '数据浏览器能够按内容类型查看本地缓存，并支持详情、分页和 JSON 导入导出。',
    recordKind: 'article',
    contentHtml: '<p>所有截图数据都来自隔离的文档 fixture，不会访问用户的 Cookie、配置文件或业务数据库。</p>',
    author: {
      id: 'docs-preview-editor',
      name: '文档示例编辑器',
      headline: '安全、可复现的公开 fixture',
      avatarUrl: '',
      url: '',
    },
    voteupCount: 96,
    commentCount: 5,
    createdAt: 1786032000,
    updatedAt: 1786204800,
  },
]

const resolved = <T>(value: T) => Promise.resolve(value)

export function installDocsScreenshotPreview() {
  const electronApi: IElectronAPI = {
    'get-debug-ipc-channel-list': () => resolved({ isDebug: false, channels: [] }),
    'get-task-default-title': (...args: unknown[]) => {
      const payload = (args[0] ?? {}) as { taskType?: string }
      return resolved(payload.taskType === 'answer' ? '精选回答' : '公开问题示例')
    },
    'get-common-config': () => resolved(previewConfig),
    'start-customer-task': () => resolved({ status: 'success', runId: 'docs-preview-run' }),
    'zhihu-http-get': () => resolved({ id: 'docs-preview-user', url_token: 'docs-preview-user' }),
    'open-output-dir': () => resolved(true),
    'open-devtools': () => resolved(true),
    'clear-all-session-storage': () => resolved(true),
    'get-db-summary-info': () =>
      resolved({
        answer: 12,
        article: 6,
        pin: 4,
        author: 5,
        question: 3,
        collection: 2,
        column: 2,
        topic: 4,
      }),
    'get-db-record-list': (...args: unknown[]) => {
      const payload = (args[0] ?? {}) as { pageNo?: number; pageSize?: number }
      return resolved({
        recordList: databaseRecordList,
        total: databaseRecordList.length,
        pageNo: payload.pageNo ?? 0,
        pageSize: payload.pageSize ?? 5,
      })
    },
    'export-db-record-json': () => resolved({ status: 'success', exportPath: 'docs-preview://export.json' }),
    'import-db-record-json': () => resolved({ status: 'canceled' }),
    'get-output-history': () =>
      resolved([
        {
          id: 'docs-output-1',
          createdAt: '2026-08-08T02:00:05.000Z',
          title: '知乎助手公开示例电子书',
          message: 'HTML 与 EPUB 已生成',
          status: 'success',
          outputPath: 'docs-preview://output',
          htmlOutputPath: 'docs-preview://output/html',
          epubOutputPath: 'docs-preview://output/epub',
          outputFormats: ['html', 'epub'],
        },
        {
          id: 'docs-output-2',
          createdAt: '2026-08-07T09:30:00.000Z',
          title: '公开文章合集',
          message: 'HTML 已生成',
          status: 'success',
          outputPath: 'docs-preview://output/articles',
          htmlOutputPath: 'docs-preview://output/articles/html',
          outputFormats: ['html'],
        },
      ]),
    'export-diagnostic-info': () => resolved({ status: 'success', diagnosticPath: 'docs-preview://diagnostic.json' }),
    'open-local-path': () => resolved(true),
    'get-log-content': () => resolved(runtimeLog),
    'clear-log-content': () => resolved(''),
    'get-runtime-jsonl-content': () => resolved(runtimeEventList.map((item) => JSON.stringify(item)).join('\n')),
    'clear-runtime-jsonl-content': () => resolved(''),
    'open-js-rpc-window-devtools': () => resolved(true),
    'append-frontend-log-batch': (payload) => resolved({ acceptedCount: payload.records.length }),
    loadPreferences: () => resolved(undefined),
  }

  Object.defineProperty(window, 'electronAPI', {
    configurable: false,
    enumerable: false,
    writable: false,
    value: Object.freeze(electronApi),
  })
  document.documentElement.dataset.docsScreenshotPreview = 'true'
}
