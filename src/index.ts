// Modules to control application life and create native browser window
import Electron, { Menu } from 'electron'
import RequestConfig from '~/src/config/request'
import PathConfig from '~/src/config/path'
import CommonUtil from '~/src/library/util/common'
import Logger from '~/src/library/logger'
import * as FrontTools from '~/src/library/util/front_tools'
import { setBridgeFunc } from '~/src/library/zhihu_encrypt/index'
import MSummary from '~/src/model/summary'
import CacheJsonTransfer from '~/src/application/cache_transfer/json_transfer'
import http from '~/src/library/http'
import fs from 'fs'
import path from 'path'
import RunTaskWorkflow from '~/src/application/workflow/run_task/run_task_workflow'
import { TaskConfig, TaskType, taskTypeList } from '~/src/domain/task/task_config'
import { parseTaskConfig, readTaskConfig, writeTaskConfig } from '~/src/shared/config/task_config_parser'
import {
  LOG_SCHEMA_VERSION,
  LogEventCode,
  LogLevel,
  LogSource,
  LogStage,
  LogStatus,
  StructuredLogRecord,
} from '~/src/shared/logging/log_contract'
import { buildOutputHistory, parseJsonlRecords } from '~/src/shared/logging/output_history'
import { sanitizeDiagnosticLogTail } from '~/src/shared/logging/diagnostic'
import { AppErrorCode, ApplicationError } from '~/src/shared/error/application_error'
import { runWithLogCorrelation } from '~/src/shared/runtime/log_correlation_context'
import { isPathInsideRoot } from '~/src/shared/path/safe_output_path'
import { createRunId } from '~/src/shared/runtime/run_context'
import {
  parseDbRecordExportPayload,
  parseDbRecordListPayload,
  parseOpenLocalPathPayload,
} from '~/src/shared/ipc/payload'
import { assertIpcResponseSucceeded } from '~/src/shared/ipc/result'


let argv = process.argv
let isDebug = argv.includes('--zhihuhelp-debug')
Logger.setDebugMode(isDebug)
let { app, BrowserWindow, dialog, ipcMain, session, shell } = Electron
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow: Electron.BrowserWindow
// 用于执行远程通信
let jsRpcWindow: Electron.BrowserWindow

let isRunning = false
let activeRunId: string | undefined
const mainProcessStartedAt = new Date().toISOString()
const Const_Debug_Ipc_Channel_List = [
  'get-debug-ipc-channel-list',
  'open-output-dir',
  'get-common-config',
  'start-customer-task',
  'get-task-default-title',
  'get-db-summary-info',
  'get-db-record-list',
  'export-db-record-json',
  'import-db-record-json',
  'get-output-history',
  'export-diagnostic-info',
  'open-local-path',
  'clear-all-session-storage',
  'js-rpc-response',
  'zhihu-http-get',
  'get-log-content',
  'clear-log-content',
  'get-runtime-jsonl-content',
  'clear-runtime-jsonl-content',
  'append-frontend-log-batch',
  'open-devtools',
  'open-js-rpc-window-devtools',
]

type IpcTraceMetadata = {
  __zhihuhelpTraceId?: unknown
}

function resolveIpcTraceId(prefix: string, metadata?: IpcTraceMetadata) {
  const traceId = metadata?.__zhihuhelpTraceId
  if (typeof traceId === 'string' && traceId.trim() !== '' && traceId.length <= 160) {
    return traceId
  }
  return createTraceId(prefix)
}

function validateFrontendLogBatch(payload: unknown): StructuredLogRecord[] {
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new ApplicationError(AppErrorCode.LOG_PAYLOAD_INVALID, '前端日志 payload 必须是对象')
  }
  const records = (payload as { records?: unknown }).records
  if (Array.isArray(records) === false || records.length === 0 || records.length > 20) {
    throw new ApplicationError(AppErrorCode.LOG_PAYLOAD_INVALID, '前端日志批次必须包含 1 到 20 条记录')
  }
  const validLevelSet = new Set<string>(Object.values(LogLevel))
  const validStageSet = new Set<string>(Object.values(LogStage))
  const validStatusSet = new Set<string>(Object.values(LogStatus))
  for (const record of records) {
    if (record === null || typeof record !== 'object' || Array.isArray(record)) {
      throw new ApplicationError(AppErrorCode.LOG_PAYLOAD_INVALID, '前端日志记录必须是对象')
    }
    const item = record as Partial<StructuredLogRecord>
    if (
      item.schemaVersion !== LOG_SCHEMA_VERSION ||
      item.source !== LogSource.FRONTEND ||
      typeof item.triggerAt !== 'string' ||
      Number.isNaN(Date.parse(item.triggerAt)) ||
      typeof item.eventCode !== 'string' ||
      item.eventCode.trim() === '' ||
      item.eventCode.length > 160 ||
      typeof item.message !== 'string' ||
      item.message.length > 64 * 1024 ||
      typeof item.level !== 'string' ||
      validLevelSet.has(item.level) === false ||
      (item.stage !== undefined && validStageSet.has(item.stage) === false) ||
      (item.status !== undefined && validStatusSet.has(item.status) === false)
    ) {
      throw new ApplicationError(AppErrorCode.LOG_PAYLOAD_INVALID, '前端日志记录不符合 schema')
    }
    if (Buffer.byteLength(JSON.stringify(item), 'utf8') > 64 * 1024) {
      throw new ApplicationError(AppErrorCode.LOG_PAYLOAD_INVALID, '前端单条日志超过 64 KiB')
    }
  }
  return records as StructuredLogRecord[]
}

function createTraceId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function summarizeIpcResponse(response: unknown) {
  if (Array.isArray(response)) {
    return {
      type: 'array',
      length: response.length,
    }
  }
  if (response && typeof response === 'object') {
    const record = response as Record<string, unknown>
    const data = record.data
    return {
      type: 'object',
      keys: Object.keys(record).slice(0, 30),
      dataType: Array.isArray(data) ? 'array' : typeof data,
      dataLength: Array.isArray(data) ? data.length : undefined,
    }
  }
  return {
    type: typeof response,
  }
}

function readRuntimeEventList() {
  return parseJsonlRecords(Logger.readRecentLogContent('runtime-jsonl'))
}

async function runLoggedIpc<T>(
  channel: string,
  metadata: IpcTraceMetadata | undefined,
  action: () => Promise<T> | T,
): Promise<T> {
  const traceId = resolveIpcTraceId(channel, metadata)
  const jobId = `ipc-${channel}-${traceId}`
  const startedAt = Date.now()
  return runWithLogCorrelation({ traceId, jobId }, async () => {
    Logger.event({
      eventCode: LogEventCode.IPC_REQUEST_START,
      stage: LogStage.IPC,
      status: LogStatus.START,
      level: LogLevel.INFO,
      message: `收到 IPC 请求：${channel}`,
      details: { channel },
    })
    try {
      const response = assertIpcResponseSucceeded(await action(), channel)
      const isPartialSuccess = response !== null
        && typeof response === 'object'
        && (response as { status?: unknown }).status === LogStatus.PARTIAL_SUCCESS
      const status = isPartialSuccess ? LogStatus.PARTIAL_SUCCESS : LogStatus.SUCCESS
      Logger.event({
        eventCode: isPartialSuccess
          ? LogEventCode.IPC_REQUEST_PARTIAL_SUCCESS
          : LogEventCode.IPC_REQUEST_SUCCESS,
        stage: LogStage.IPC,
        status,
        level: isPartialSuccess ? LogLevel.WARN : LogLevel.INFO,
        durationMs: Date.now() - startedAt,
        message: isPartialSuccess ? `IPC 请求部分完成：${channel}` : `IPC 请求完成：${channel}`,
        details: {
          channel,
          response: summarizeIpcResponse(response),
        },
      })
      return response
    } catch (error) {
      Logger.event({
        eventCode: LogEventCode.IPC_REQUEST_FAILURE,
        stage: LogStage.IPC,
        status: LogStatus.FAILURE,
        level: LogLevel.ERROR,
        durationMs: Date.now() - startedAt,
        error: Logger.serializeError(error),
        message: `IPC 请求失败：${channel}`,
        details: { channel },
      })
      throw error
    }
  })
}

function asyncBuildOutputHistory() {
  return buildOutputHistory(readRuntimeEventList())
}

async function openLocalPath(targetPath: string): Promise<boolean> {
  if (typeof targetPath !== 'string' || targetPath.trim() === '') {
    return false
  }
  const resolvedPath = path.resolve(targetPath)
  if (isPathInsideRoot(PathConfig.outputPath, resolvedPath) === false || fs.existsSync(resolvedPath) === false) {
    return false
  }
  try {
    const stat = fs.statSync(resolvedPath)
    if (stat.isDirectory()) {
      const errorMessage = await shell.openPath(resolvedPath)
      return errorMessage === ''
    }
    shell.showItemInFolder(resolvedPath)
    return true
  } catch (error) {
    Logger.warn('打开本地输出路径失败', error)
    return false
  }
}

function maskTaskConfigForDiagnostic(config: TaskConfig) {
  return {
    ...config,
    request: {
      uaLength: config.request.ua.length,
      hasCookie: config.request.cookie.trim().length > 0,
      cookieLength: config.request.cookie.length,
    },
  }
}

const isMacOS = process.platform === 'darwin'

async function asyncCreateWindow() {
  if (process.platform === 'darwin') {
    const template = [
      {
        label: 'Application',
        submenu: [
          {
            label: 'Quit',
            accelerator: 'Command+Q',
            click: function () {
              app.quit()
            },
          },
        ],
      },
      {
        label: 'Edit',
        submenu: [
          { label: 'Copy', accelerator: 'CmdOrCtrl+C', selector: 'copy:' },
          { label: 'Paste', accelerator: 'CmdOrCtrl+V', selector: 'paste:' },
        ],
      },
    ]
    Menu.setApplicationMenu(Menu.buildFromTemplate(template))
  } else {
    Menu.setApplicationMenu(null)
  }

  const { screen } = Electron
  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width,
    height,
    // 自动隐藏菜单栏
    autoHideMenuBar: true,
    // 窗口的默认标题
    title: '知乎助手',
    // 在屏幕中间展示窗口
    center: true,
    // 展示原生窗口栏
    frame: true,
    // 禁用web安全功能 --> 个人软件, 要啥自行车
    webPreferences: {
      // 使用preload.js, 以进行rpc通信
      preload: path.join(__dirname, 'preload.js'),
      // 开启 DevTools.
      devTools: true,
      // 禁用同源策略, 允许加载任何来源的js
      webSecurity: false,
      // 允许 https 页面运行 http url 里的资源
      allowRunningInsecureContent: true,
      // 禁用node支持-从而有效加快页面启动速度
      // nodeIntegration: false,
      // Electron12后, 启用node支持时还需要关闭上下文隔离
      // contextIsolation: false,
      // 启用webview标签
      webviewTag: true,
    },
  })
  // 专门启动一个窗口, 用于通过jsRpc计算签名
  jsRpcWindow = new BrowserWindow({
    enableLargerThanScreen: true,
    width: 760,
    height: 500,
    // 负责渲染的子窗口不需要显示出来, 避免被用户误关闭
    show: isDebug ? true : false,
    // 禁用web安全功能 --> 个人软件, 要啥自行车
    webPreferences: {
      // 开启 DevTools.
      devTools: true,
      // 禁用同源策略, 允许加载任何来源的js
      webSecurity: false,
      // // js-rpc需要
      // contextIsolation: true,
      // 启用webview标签
      webviewTag: true,
      // 启用preload.js, 以进行rpc通信
      preload: path.join(__dirname, 'public', 'js-rpc', 'preload.js'),
    },
  })

  // and load the index.html of the app.
  // and load the index.html of the app.
  if (isDebug) {
    // 本地调试 & 打开控制台
    // mainWindow.loadFile('./client/index.html')
    mainWindow.loadURL('http://localhost:8080')
    mainWindow.webContents.openDevTools()

    let jsRpcUri = path.resolve(__dirname, 'public', 'js-rpc', 'index.html')
    if (isMacOS) {
      // mac上载入url时必须明确指明协议, 否则无法载入
      jsRpcUri = "file://" + jsRpcUri
    }
    jsRpcWindow.loadURL(jsRpcUri)
    jsRpcWindow.webContents.openDevTools()
  } else {
    // 线上地址
    // 构建出来后所有文件都位于dist目录中
    // mac上载入url时必须明确指明协议, 否则无法载入
    let webviewUri = path.resolve(__dirname, 'client', 'index.html')
    if (isMacOS) {
      // 针对macos的特殊hack, mac上只有这样mainWindow才能加载html
      mainWindow.loadFile('./dist/client/index.html')
    } else {
      mainWindow.loadFile(webviewUri)
    }

    // mainWindow.webContents.openDevTools()

    let jsRpcUri = path.resolve(__dirname, 'public', 'js-rpc', 'index.html')
    if (isMacOS) {
      // mac上载入url时必须明确指明协议, 否则无法载入
      jsRpcUri = "file://" + jsRpcUri
    }
    jsRpcWindow.loadURL(jsRpcUri)
    // jsRpcWindow.webContents.openDevTools()
  }

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    // @ts-ignore
    mainWindow = null
    // 主窗口关闭时, 子窗口也要跟着关闭, 避免程序退不掉
    jsRpcWindow.close()
    // @ts-ignore
    jsRpcWindow = null
  })

  // 设置ua
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['User-Agent'] =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36'
    callback({ cancel: false, requestHeaders: details.requestHeaders })
  })
}

async function asyncUpdateCookie(): Promise<string> {
  let cookieContent = ''
  let cookieList = await mainWindow.webContents.session.cookies.get({})
  for (let cookie of cookieList) {
    cookieContent = `${cookie.name}=${cookie.value};${cookieContent}`
  }
  Logger.log(`重新载入cookie配置`)
  RequestConfig.setRequestConfig({
    ua: RequestConfig.ua,
    cookie: cookieContent,
  })
  return cookieContent
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', asyncCreateWindow)

process.on('uncaughtExceptionMonitor', (error) => {
  Logger.event({
    eventCode: LogEventCode.APP_ERROR,
    stage: LogStage.APP,
    status: LogStatus.FAILURE,
    level: LogLevel.ERROR,
    message: '主进程发生未捕获异常',
    error: Logger.serializeError(error),
  })
})

process.on('unhandledRejection', (reason) => {
  Logger.event({
    eventCode: LogEventCode.APP_ERROR,
    stage: LogStage.APP,
    status: LogStatus.FAILURE,
    level: LogLevel.ERROR,
    message: '主进程发生未处理 Promise rejection',
    error: Logger.serializeError(reason),
  })
})

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.

})

app.whenReady().then(() => {
  Logger.event({
    eventCode: LogEventCode.APP_START,
    stage: LogStage.APP,
    status: LogStatus.SUCCESS,
    level: LogLevel.INFO,
    message: 'Electron 主进程已就绪',
    details: {
      isDebug,
      pid: process.pid,
      startedAt: mainProcessStartedAt,
    },
  })
  ipcMain.handle('get-debug-ipc-channel-list', async (event, metadata?: IpcTraceMetadata) => {
    return runLoggedIpc('get-debug-ipc-channel-list', metadata, () => ({
      isDebug,
      pid: process.pid,
      startedAt: mainProcessStartedAt,
      channels: Const_Debug_Ipc_Channel_List,
    }))
  })

  // 打开输出文件夹
  ipcMain.handle('open-output-dir', async (event, metadata?: IpcTraceMetadata) => {
    return runLoggedIpc('open-output-dir', metadata, async () => {
      const errorMessage = await shell.openPath(PathConfig.outputPath)
      if (errorMessage !== '') {
        throw new Error(`输出目录打开失败: ${errorMessage}`)
      }
      return true
    })
  })

  // 获取任务配置
  ipcMain.handle('get-common-config', (event, metadata?: IpcTraceMetadata) => {
    const traceId = resolveIpcTraceId('get-common-config', metadata)
    const startedAt = Date.now()
    Logger.event({
      traceId,
      eventCode: LogEventCode.CONFIG_READ_START,
      stage: LogStage.CONFIG,
      status: LogStatus.START,
      level: LogLevel.INFO,
      message: '开始读取任务配置',
    })
    try {
      const config = readTaskConfig(PathConfig.configUri)
      Logger.event({
        traceId,
        eventCode: LogEventCode.CONFIG_READ_SUCCESS,
        stage: LogStage.CONFIG,
        status: LogStatus.SUCCESS,
        level: LogLevel.INFO,
        durationMs: Date.now() - startedAt,
        message: '任务配置读取完成',
      })
      return config
    } catch (error) {
      Logger.event({
        traceId,
        eventCode: LogEventCode.CONFIG_READ_FAILURE,
        stage: LogStage.CONFIG,
        status: LogStatus.FAILURE,
        level: LogLevel.ERROR,
        durationMs: Date.now() - startedAt,
        error: Logger.serializeError(error),
        message: '任务配置读取失败；旧 schema 不会自动迁移',
      })
      throw error
    }
  })

  // 启动任务
  ipcMain.handle('start-customer-task', async (event, payload: unknown, metadata?: IpcTraceMetadata) => {
    const traceId = resolveIpcTraceId('start-customer-task', metadata)
    const ipcJobId = `ipc-start-customer-task-${traceId}`
    const startedAt = Date.now()
    const logRequestStart = (runId?: string, details?: Record<string, unknown>) => {
      Logger.event({
        traceId,
        runId,
        jobId: ipcJobId,
        eventCode: LogEventCode.IPC_REQUEST_START,
        stage: LogStage.IPC,
        status: LogStatus.START,
        level: LogLevel.INFO,
        message: 'GUI 任务启动请求已接收',
        details,
      })
    }
    let config: TaskConfig
    try {
      if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
        throw new Error('start-customer-task payload 必须是对象')
      }
      config = parseTaskConfig((payload as { config?: unknown }).config)
    } catch (error) {
      logRequestStart(undefined, { payloadValid: false })
      Logger.event({
        traceId,
        jobId: ipcJobId,
        eventCode: LogEventCode.IPC_REQUEST_FAILURE,
        stage: LogStage.IPC,
        status: LogStatus.FAILURE,
        level: LogLevel.ERROR,
        errorCode: AppErrorCode.LOG_PAYLOAD_INVALID,
        error: Logger.serializeError(error),
        durationMs: Date.now() - startedAt,
        message: 'GUI 任务启动请求参数无效',
      })
      throw new ApplicationError(AppErrorCode.LOG_PAYLOAD_INVALID, 'GUI 任务配置不符合当前 schema', error)
    }
    if (isRunning) {
      logRequestStart(activeRunId, { ignored: true, reason: 'already-running' })
      Logger.event({
        traceId,
        runId: activeRunId,
        jobId: ipcJobId,
        eventCode: LogEventCode.IPC_REQUEST_SUCCESS,
        stage: LogStage.IPC,
        status: LogStatus.SUCCESS,
        level: LogLevel.WARN,
        durationMs: Date.now() - startedAt,
        message: '已有任务正在执行，忽略重复启动请求',
        details: { ignored: true, reason: 'already-running' },
      })
      return {
        status: 'running',
        message: '目前尚有任务执行，请稍后',
      }
    }
    const runId = createRunId()
    activeRunId = runId
    logRequestStart(runId, {
      taskCount: config.tasks.length,
      outputFormats: config.generate.outputFormats,
    })
    isRunning = true
    try {
      Logger.log('开始工作')
      // 将 GUI 配置转换为新 schema 并写入本地
      const cookieContent = await asyncUpdateCookie()
      config.request.cookie = cookieContent
      writeTaskConfig(PathConfig.configUri, config)

      Logger.log(`开始执行任务`)

      const context = await new RunTaskWorkflow().run({
        configPath: PathConfig.configUri,
        traceId,
        runId,
        trigger: 'gui',
      })
      Logger.log(`所有任务执行完毕, 打开电子书文件夹 => `, PathConfig.outputPath)
      Logger.event({
        traceId,
        runId,
        jobId: ipcJobId,
        eventCode:
          context.outcomeStatus === LogStatus.PARTIAL_SUCCESS
            ? LogEventCode.IPC_REQUEST_PARTIAL_SUCCESS
            : LogEventCode.IPC_REQUEST_SUCCESS,
        stage: LogStage.IPC,
        status: context.outcomeStatus,
        level: context.outcomeStatus === LogStatus.PARTIAL_SUCCESS ? LogLevel.WARN : LogLevel.INFO,
        message: context.outcomeStatus === LogStatus.PARTIAL_SUCCESS ? 'GUI 任务部分完成' : 'GUI 任务执行完毕',
        durationMs: Date.now() - startedAt,
        details: {
          outputPath: PathConfig.outputPath,
          title: config.generate.title,
          outputFormats: config.generate.outputFormats,
        },
      })
      // 打开文件夹属于独立的系统 shell 操作，失败不能反转已经完成的任务终态。
      const openJobId = `open-output-${Date.now()}`
      Logger.event({
        traceId,
        runId: context.runId,
        jobId: openJobId,
        stage: LogStage.OUTPUT,
        status: LogStatus.START,
        level: LogLevel.INFO,
        message: '开始请求系统打开输出目录',
        details: { outputPath: PathConfig.outputPath },
      })
      try {
        const openErrorMessage = await shell.openPath(PathConfig.outputPath)
        if (openErrorMessage !== '') {
          throw new Error(openErrorMessage)
        }
        Logger.event({
          traceId,
          runId: context.runId,
          jobId: openJobId,
          eventCode: LogEventCode.OUTPUT_OPENED,
          stage: LogStage.OUTPUT,
          status: LogStatus.SUCCESS,
          level: LogLevel.INFO,
          message: '已请求系统打开输出目录',
          details: { outputPath: PathConfig.outputPath },
        })
      } catch (error) {
        Logger.event({
          traceId,
          runId: context.runId,
          jobId: openJobId,
          eventCode: LogEventCode.OUTPUT_FAILURE,
          stage: LogStage.OUTPUT,
          status: LogStatus.FAILURE,
          level: LogLevel.WARN,
          error: Logger.serializeError(error),
          message: '系统未能打开输出目录，任务产物仍已生成',
          details: { outputPath: PathConfig.outputPath },
        })
      }

      return {
        status: context.outcomeStatus,
        runId: context.runId,
        outputPath: PathConfig.outputPath,
      }
    } catch (error) {
      Logger.event({
        traceId,
        runId,
        jobId: ipcJobId,
        eventCode: LogEventCode.IPC_REQUEST_FAILURE,
        stage: LogStage.IPC,
        status: LogStatus.FAILURE,
        level: LogLevel.ERROR,
        message: 'GUI 任务执行失败',
        durationMs: Date.now() - startedAt,
        error: Logger.serializeError(error),
        details: {
          outputPath: PathConfig.outputPath,
          title: config?.generate.title,
        },
      })
      throw error
    } finally {
      isRunning = false
      if (activeRunId === runId) {
        activeRunId = undefined
      }
    }
  })


  ipcMain.handle('get-task-default-title', async (event, payload: unknown, metadata?: IpcTraceMetadata) => {
    const traceId = resolveIpcTraceId('get-task-default-title', metadata)
    return runWithLogCorrelation({ traceId }, async () => {
      const startedAt = Date.now()
      Logger.event({
        traceId,
        eventCode: LogEventCode.IPC_REQUEST_START,
        stage: LogStage.IPC,
        status: LogStatus.START,
        level: LogLevel.INFO,
        message: '开始读取任务默认标题',
      })
      try {
        if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
          throw new Error('get-task-default-title payload 必须是对象')
        }
        const { taskId, taskType } = payload as { taskType?: unknown; taskId?: unknown }
        if (
          typeof taskId !== 'string'
          || taskId.trim() === ''
          || typeof taskType !== 'string'
          || taskTypeList.includes(taskType as TaskType) === false
        ) {
          throw new Error('taskId/taskType 无效')
        }
        await asyncUpdateCookie()
        const title = await FrontTools.asyncGetTaskDefaultTitle(taskType as TaskType, taskId)
        Logger.event({
          traceId,
          eventCode: LogEventCode.IPC_REQUEST_SUCCESS,
          stage: LogStage.IPC,
          status: LogStatus.SUCCESS,
          level: LogLevel.INFO,
          durationMs: Date.now() - startedAt,
          message: '任务默认标题读取完成',
        })
        return title
      } catch (error) {
        Logger.event({
          traceId,
          eventCode: LogEventCode.IPC_REQUEST_FAILURE,
          stage: LogStage.IPC,
          status: LogStatus.FAILURE,
          level: LogLevel.ERROR,
          durationMs: Date.now() - startedAt,
          error: Logger.serializeError(error),
          message: '任务默认标题读取失败',
        })
        throw error
      }
    })
  })

  /**
   * 获取数据库内的汇总信息
   */
  ipcMain.handle('get-db-summary-info', async (event, metadata?: IpcTraceMetadata) => {
    return runLoggedIpc('get-db-summary-info', metadata, () => MSummary.asyncGetSummaryInfo())
  })

  ipcMain.handle('get-db-record-list', async (event, payload: unknown, metadata?: IpcTraceMetadata) => {
    return runLoggedIpc('get-db-record-list', metadata, () => {
      const { type, pageNo, pageSize, parentId } = parseDbRecordListPayload(payload)
      return MSummary.asyncGetTabList({
        type: type as Parameters<typeof MSummary.asyncGetTabList>[0]['type'],
        pageNo,
        pageSize,
        parentId,
      })
    })
  })

  ipcMain.handle('export-db-record-json', async (event, payload: unknown, metadata?: IpcTraceMetadata) => {
    return runLoggedIpc('export-db-record-json', metadata, async () => {
      const { type, parentId } = parseDbRecordExportPayload(payload)
      const result = await CacheJsonTransfer.exportDbRecordJson({
        type: type as Parameters<typeof CacheJsonTransfer.exportDbRecordJson>[0]['type'],
        parentId,
      })
      shell.showItemInFolder(result.exportPath)
      return result
    })
  })

  ipcMain.handle('import-db-record-json', async (event, metadata?: IpcTraceMetadata) => {
    return runLoggedIpc('import-db-record-json', metadata, async () => {
      const selectResult = await dialog.showOpenDialog(mainWindow, {
        title: '导入缓存 JSON',
        properties: ['openFile'],
        filters: [
          {
            name: 'JSON',
            extensions: ['json'],
          },
        ],
      })
      if (selectResult.canceled || selectResult.filePaths.length === 0) {
        return {
          status: 'canceled',
        }
      }
      return CacheJsonTransfer.importDbRecordJson(selectResult.filePaths[0])
    })
  })

  ipcMain.handle('get-output-history', async (event, metadata?: IpcTraceMetadata) => {
    // The log panel polls this passive channel; recording the read would make
    // merely opening the panel generate an endless stream of new logs.
    return asyncBuildOutputHistory()
  })

  ipcMain.handle('open-local-path', async (event, payload: unknown, metadata?: IpcTraceMetadata) => {
    return runLoggedIpc('open-local-path', metadata, async () => {
      const targetPath = parseOpenLocalPathPayload(payload)
      const opened = await openLocalPath(targetPath)
      if (opened === false) {
        throw new ApplicationError(AppErrorCode.LOG_PAYLOAD_INVALID, '路径不存在、超出输出目录或系统无法打开')
      }
      return true
    })
  })

  ipcMain.handle('export-diagnostic-info', async (event, metadata?: IpcTraceMetadata) => {
    return runLoggedIpc('export-diagnostic-info', metadata, async () => {
    const diagnosticDir = path.resolve(PathConfig.outputPath, 'diagnostics')
    if (fs.existsSync(PathConfig.outputPath) === false) {
      fs.mkdirSync(PathConfig.outputPath)
    }
    if (fs.existsSync(diagnosticDir) === false) {
      fs.mkdirSync(diagnosticDir)
    }
    let taskConfig: unknown = undefined
    try {
      taskConfig = maskTaskConfigForDiagnostic(readTaskConfig(PathConfig.configUri))
    } catch (error) {
      taskConfig = {
        error: Logger.serializeError(error),
      }
    }
    const databaseSummary = await MSummary.asyncGetSummaryInfo().catch((error) => {
      return {
        error: Logger.serializeError(error),
      }
    })
    const packageJson = JSON.parse(fs.readFileSync(PathConfig.packageJsonUri, 'utf-8'))
    const runtimeLogContent = Logger.readRecentLogContent('runtime-text')
    const runtimeJsonlContent = Logger.readRecentLogContent('runtime-jsonl')
    const frontendRuntimeJsonlContent = Logger.readRecentLogContent('frontend-jsonl')
    const diagnosticInfo = {
      createdAt: new Date().toISOString(),
      app: {
        name: packageJson.name,
        version: packageJson.version,
        electron: process.versions.electron,
        node: process.versions.node,
        platform: process.platform,
        arch: process.arch,
      },
      paths: {
        rootPath: PathConfig.rootPath,
        configUri: PathConfig.configUri,
        outputPath: PathConfig.outputPath,
        htmlOutputPath: PathConfig.htmlOutputPath,
        epubOutputPath: PathConfig.epubOutputPath,
        runtimeLogUri: PathConfig.runtimeLogUri,
        runtimeJsonlUri: PathConfig.runtimeJsonlUri,
        frontendRuntimeJsonlUri: PathConfig.frontendRuntimeJsonlUri,
        logPath: PathConfig.logPath,
      },
      databaseSummary,
      taskConfig,
      outputHistory: asyncBuildOutputHistory(),
      runtimeLogTail: sanitizeDiagnosticLogTail(runtimeLogContent),
      runtimeJsonlTail: sanitizeDiagnosticLogTail(runtimeJsonlContent),
      frontendRuntimeJsonlTail: sanitizeDiagnosticLogTail(frontendRuntimeJsonlContent),
    }
    const diagnosticPath = path.resolve(diagnosticDir, `diagnostic-${Date.now()}.json`)
    fs.writeFileSync(diagnosticPath, JSON.stringify(diagnosticInfo, null, 2), 'utf-8')
    shell.showItemInFolder(diagnosticPath)
    return {
      status: LogStatus.SUCCESS,
      diagnosticPath,
    }
    })
  })


  // 清空所有登录信息
  ipcMain.handle('clear-all-session-storage', async (event, metadata?: IpcTraceMetadata) => {
    return runLoggedIpc('clear-all-session-storage', metadata, async () => {
      await session.defaultSession.clearCache()
      await session.defaultSession.clearStorageData()
      await session.defaultSession.clearHostResolverCache()
      return true
    })
  })


  /**
   * jsRpc任务管理器
   */
  let taskMap = new Map<
    string,
    {
      method: string
      paramList: any[]
      reslove: (value: any) => void
      reject: (error: unknown) => void
      timeoutId: ReturnType<typeof setTimeout>
      traceId: string
      startedAt: number
    }
  >()
  let totalTaskCounter = 0

  async function asyncJsRpcTriggerFunc({ method, paramList, traceId: inputTraceId }: { method: string; paramList: any[]; traceId?: string }) {
    totalTaskCounter++
    let id = `task-${totalTaskCounter}-${Math.random()}`
    const traceId = inputTraceId ?? createTraceId('js-rpc')
    const startedAt = Date.now()
    Logger.event({
      traceId,
      jobId: id,
      eventCode: LogEventCode.RPC_SIGN_START,
      stage: LogStage.RPC,
      status: LogStatus.START,
      level: LogLevel.DEBUG,
      message: '开始执行签名 RPC',
      details: { method },
    })
    let task = new Promise((reslove, reject) => {
      jsRpcWindow.webContents.send(method, paramList, id)
      const timeoutId = setTimeout(() => {
        taskMap.delete(id)
        reject(new ApplicationError(AppErrorCode.SIGNATURE_FAILED, '签名 RPC 执行超时'))
      }, 30 * 1000)
      taskMap.set(id, {
        method,
        paramList,
        reslove: (value: any) => {
          reslove(value)
        },
        reject,
        timeoutId,
        traceId,
        startedAt,
      })
    })
    if (isDebug) {
      // Logger.log(
      //   `派发js-rpc请求, 任务id: ${id}, ${JSON.stringify(
      //     {
      //       method,
      //       paramList,
      //       id,
      //     },
      //     null,
      //     2,
      //   )}`,
      // )
    }
    let result
    try {
      result = await task
      Logger.event({
        traceId,
        jobId: id,
        eventCode: LogEventCode.RPC_SIGN_SUCCESS,
        stage: LogStage.RPC,
        status: LogStatus.SUCCESS,
        level: LogLevel.DEBUG,
        message: '签名 RPC 执行完成',
        durationMs: Date.now() - startedAt,
        details: { method },
      })
    } catch (error) {
      Logger.event({
        traceId,
        jobId: id,
        eventCode: LogEventCode.RPC_SIGN_FAILURE,
        stage: LogStage.RPC,
        status: LogStatus.FAILURE,
        level: LogLevel.ERROR,
        message: '签名 RPC 执行失败',
        durationMs: Date.now() - startedAt,
        error: Logger.serializeError(error),
        details: { method },
      })
      throw error
    }
    if (isDebug) {
      // Logger.log(`id:${id}的js-rpc请求完成`)
    }
    return result
  }
  // 使用js-rpc获取签名
  setBridgeFunc(asyncJsRpcTriggerFunc)

  // 工具函数, 用于在测试时手工触发js-rpc请求
  // ipcMain.handle('js-rpc-trigger', async (event, { method, paramList }) => {
  //   let result = await asyncJsRpcTriggerFunc({ method, paramList })
  //   return JSON.stringify(result)
  // })

  // 回收js-rpc调用响应值
  ipcMain.handle('js-rpc-response', async (event, { id, value }) => {
    // console.log('receive js-rpc-response => ', { id, value })
    if (taskMap.has(id)) {
      const task = taskMap.get(id)
      if (task !== undefined) {
        clearTimeout(task.timeoutId)
        task.reslove(value)
      }
      taskMap.delete(id)
    } else {
      Logger.log(`未找到${id}对应的任务`)
    }

    return true
  })

  ipcMain.handle('zhihu-http-get', async (
    event,
    { url, params }: { url: string; params: { [key: string]: any } },
    metadata?: IpcTraceMetadata,
  ) => {
    const traceId = resolveIpcTraceId('zhihu-http-get', metadata)
    const startAt = Date.now()
    Logger.event({
      traceId,
      eventCode: LogEventCode.IPC_REQUEST_START,
      stage: LogStage.IPC,
      status: LogStatus.START,
      level: LogLevel.INFO,
      message: '收到 IPC 请求：zhihu-http-get',
      details: {
        url,
        paramsKeys: Object.keys(params ?? {}),
      },
    })
    try {
      await asyncUpdateCookie()
      const res = await http.get(
        url,
        {
          params: params,
        },
        { traceId },
      )
      Logger.event({
        traceId,
        eventCode: LogEventCode.IPC_REQUEST_SUCCESS,
        stage: LogStage.IPC,
        status: LogStatus.SUCCESS,
        level: LogLevel.INFO,
        message: 'IPC 请求完成：zhihu-http-get',
        durationMs: Date.now() - startAt,
        details: {
          url,
          response: summarizeIpcResponse(res),
        },
      })
      return res
    } catch (error) {
      Logger.event({
        traceId,
        eventCode: LogEventCode.IPC_REQUEST_FAILURE,
        stage: LogStage.IPC,
        status: LogStatus.FAILURE,
        level: LogLevel.ERROR,
        message: 'IPC 请求异常：zhihu-http-get',
        durationMs: Date.now() - startAt,
        error: Logger.serializeError(error),
        details: {
          url,
        },
      })
      throw error
    }
  })
  ipcMain.handle('append-frontend-log-batch', async (event, payload: unknown) => {
    try {
      const recordList = validateFrontendLogBatch(payload)
      return {
        acceptedCount: Logger.appendFrontendRecords(recordList),
      }
    } catch (error) {
      Logger.event({
        eventCode: LogEventCode.IPC_FRONTEND_LOG_REJECTED,
        stage: LogStage.IPC,
        status: LogStatus.FAILURE,
        level: LogLevel.ERROR,
        errorCode: AppErrorCode.LOG_PAYLOAD_INVALID,
        message: '拒绝非法前端日志批次',
        error: Logger.serializeError(error),
      })
      throw error
    }
  })
  ipcMain.handle('get-log-content', async (event, metadata?: IpcTraceMetadata) => {
    return Logger.readRecentLogContent('runtime-text', 5000)
  })
  ipcMain.handle('clear-log-content', async (event, metadata?: IpcTraceMetadata) => {
    return runLoggedIpc('clear-log-content', metadata, () => {
      Logger.clearLogFiles('runtime-text')
      return ''
    })
  })
  ipcMain.handle('get-runtime-jsonl-content', async (event, metadata?: IpcTraceMetadata) => {
    return Logger.readRecentLogContent('runtime-jsonl', 5000)
  })
  ipcMain.handle('clear-runtime-jsonl-content', async (event, metadata?: IpcTraceMetadata) => {
    // Clear first, then record the clear operation itself so the new log still
    // contains a complete start/terminal pair.
    Logger.clearLogFiles('runtime-jsonl')
    return runLoggedIpc('clear-runtime-jsonl-content', metadata, () => '')
  })
  ipcMain.handle('open-devtools', async (event, metadata?: IpcTraceMetadata) => {
    return runLoggedIpc('open-devtools', metadata, () => {
      mainWindow.webContents.openDevTools()
      return true
    })
  })
  ipcMain.handle('open-js-rpc-window-devtools', async (event, metadata?: IpcTraceMetadata) => {
    return runLoggedIpc('open-js-rpc-window-devtools', metadata, () => {
      jsRpcWindow.show()
      jsRpcWindow.webContents.openDevTools()
      return true
    })
  })


  if (mainWindow === null) {
    console.log("开始创建窗口")
    asyncCreateWindow()
  }
})



// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
