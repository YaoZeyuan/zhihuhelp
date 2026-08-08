import {
  LogEventCode,
  LogLevel,
  LogSource,
  LogStage,
  LogStatus,
  createStructuredLogRecord,
  sanitizeLogValue,
  serializeLogError,
  type LogEventCodeValue,
  type LogStageValue,
  type LogStatusValue,
  type StructuredLogEntry,
  type StructuredLogRecord,
} from '@shared/logging/log_contract'

export type Type_Debug_Log_Level = 'info' | 'success' | 'warn' | 'error'

export type Type_Debug_Log_Item = {
  id: string
  triggerAt: string
  level: Type_Debug_Log_Level
  channel: string
  message: string
  eventCode?: LogEventCodeValue | string
  stage?: LogStageValue
  status?: LogStatusValue
  traceId?: string
  runId?: string
  jobId?: string
  durationMs?: number
  request?: unknown
  response?: unknown
  error?: unknown
  details?: Record<string, unknown>
}

type Type_Append_Debug_Log_Param = Omit<Type_Debug_Log_Item, 'id' | 'triggerAt'>

type Type_Trace_Metadata = {
  __zhihuhelpTraceId: string
}

const Const_Storage_Key = 'zhihuhelp.frontend.debugLog'
const Const_Change_Event_Name = 'zhihuhelp-frontend-debug-log-change'
const Const_Max_Log_Count = 200
const Const_Max_Batch_Count = 20
const Const_Flush_Interval_Ms = 500
const Const_Max_Record_Byte_Length = 64 * 1024
const Const_Failed_Batch_Record_Count = 200
const Const_Frontend_Log_Channel = 'append-frontend-log-batch' as const
const Const_Passive_Channel_Set = new Set([
  Const_Frontend_Log_Channel,
  'get-log-content',
  'get-runtime-jsonl-content',
])
const rawConsoleWarn = console.warn.bind(console)

function createLogId(prefix = 'frontend') {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function getRecordByteLength(record: StructuredLogRecord) {
  return new TextEncoder().encode(JSON.stringify(record)).byteLength
}

function normalizeRecordSize(record: StructuredLogRecord): StructuredLogRecord {
  let originalByteLength = 0
  try {
    originalByteLength = getRecordByteLength(record)
    if (originalByteLength <= Const_Max_Record_Byte_Length) {
      return record
    }
  } catch {
    originalByteLength = -1
  }

  return createStructuredLogRecord(
    {
      traceId: record.traceId,
      runId: record.runId,
      jobId: record.jobId,
      eventCode: record.eventCode,
      source: LogSource.FRONTEND,
      stage: record.stage,
      status: record.status,
      durationMs: record.durationMs,
      level: record.level,
      errorCode: record.errorCode,
      error: record.error,
      message: record.message,
      details: {
        truncated: true,
        reason: 'frontend_log_record_exceeded_64_kib',
        originalByteLength,
      },
    },
    record.triggerAt,
  )
}

function toWireLevel(level: Type_Debug_Log_Level) {
  if (level === 'error') {
    return LogLevel.ERROR
  }
  if (level === 'warn') {
    return LogLevel.WARN
  }
  return LogLevel.INFO
}

function getDefaultStatus(level: Type_Debug_Log_Level) {
  if (level === 'success') {
    return LogStatus.SUCCESS
  }
  if (level === 'error') {
    return LogStatus.FAILURE
  }
  return LogStatus.PROGRESS
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function readCorrelationId(args: unknown[], key: 'runId' | 'jobId') {
  for (const arg of args) {
    if (!isRecord(arg)) {
      continue
    }
    const directValue = arg[key]
    if (typeof directValue === 'string' && directValue.trim()) {
      return directValue
    }
    const context = arg.context
    if (isRecord(context)) {
      const contextValue = context[key]
      if (typeof contextValue === 'string' && contextValue.trim()) {
        return contextValue
      }
    }
  }
  return undefined
}

function summarizeIpcResponse(value: unknown): unknown {
  if (Array.isArray(value)) {
    return { type: 'array', length: value.length }
  }
  if (isRecord(value)) {
    const data = value.data
    const status = value.status
    return {
      type: 'object',
      keys: Object.keys(value).slice(0, 30),
      status: typeof status === 'string' || typeof status === 'number' ? status : undefined,
      dataType: Array.isArray(data) ? 'array' : typeof data,
      dataLength: Array.isArray(data) ? data.length : undefined,
    }
  }
  if (typeof value === 'string') {
    return { type: 'string', length: value.length }
  }
  return value
}

export default class DebugLog {
  static readonly changeEventName = Const_Change_Event_Name
  private static isGlobalRecorderInstalled = false
  private static pendingRecordList: StructuredLogRecord[] = []
  private static failedRecordList: StructuredLogRecord[] = []
  private static flushTimer: ReturnType<typeof setTimeout> | undefined
  private static flushPromise: Promise<void> | undefined
  private static hasReportedTransportFailure = false

  static readList(): Type_Debug_Log_Item[] {
    try {
      const rawContent = localStorage.getItem(Const_Storage_Key)
      if (!rawContent) {
        return []
      }
      const record = JSON.parse(rawContent)
      if (!Array.isArray(record)) {
        return []
      }
      return record.map((item) => sanitizeLogValue(item) as Type_Debug_Log_Item)
    } catch {
      return []
    }
  }

  static append(param: Type_Append_Debug_Log_Param) {
    const triggerAt = new Date().toISOString()
    const safeError = param.error === undefined ? undefined : serializeLogError(param.error)
    const responseSummary = summarizeIpcResponse(param.response)
    const logItem: Type_Debug_Log_Item = {
      id: createLogId('log'),
      triggerAt,
      ...param,
      message: sanitizeLogValue(param.message, 'message') as string,
      request: sanitizeLogValue(param.request, 'request'),
      response: sanitizeLogValue(responseSummary),
      error: safeError,
      details: sanitizeLogValue(param.details, 'details') as Record<string, unknown> | undefined,
    }

    try {
      const logList = [...DebugLog.readList(), logItem].slice(-Const_Max_Log_Count)
      localStorage.setItem(Const_Storage_Key, JSON.stringify(logList))
      window.dispatchEvent(new CustomEvent(Const_Change_Event_Name))
    } catch (error) {
      rawConsoleWarn('[frontend-log] 无法写入本地调试记录', serializeLogError(error))
    }

    const entry: StructuredLogEntry = {
      traceId: param.traceId,
      runId: param.runId,
      jobId: param.jobId,
      eventCode: param.eventCode ?? LogEventCode.FRONTEND_ACTION,
      source: LogSource.FRONTEND,
      stage: param.stage ?? LogStage.FRONTEND,
      status: param.status ?? getDefaultStatus(param.level),
      durationMs: param.durationMs,
      level: toWireLevel(param.level),
      error: safeError,
      message: param.message,
      details: {
        channel: param.channel,
        request: param.request,
        response: responseSummary,
        ...param.details,
      },
    }
    const record = normalizeRecordSize(createStructuredLogRecord(entry, triggerAt))
    DebugLog.enqueueRecord(record, param.level === 'error')
  }

  static clear() {
    try {
      localStorage.removeItem(Const_Storage_Key)
      window.dispatchEvent(new CustomEvent(Const_Change_Event_Name))
    } catch (error) {
      rawConsoleWarn('[frontend-log] 无法清除本地调试记录', serializeLogError(error))
    }
  }

  static getFailedRecordCount(): number {
    return DebugLog.failedRecordList.length
  }

  static subscribe(listener: () => void) {
    window.addEventListener(Const_Change_Event_Name, listener)
    return () => {
      window.removeEventListener(Const_Change_Event_Name, listener)
    }
  }

  static installElectronApiRecorder() {
    // Electron contextBridge exposes a frozen API object. IPC calls are recorded
    // through invokeElectronApi instead of mutating that object at runtime.
  }

  static installGlobalErrorRecorder() {
    if (DebugLog.isGlobalRecorderInstalled) {
      return
    }

    window.addEventListener('error', (event) => {
      DebugLog.append({
        level: 'error',
        channel: 'window.error',
        eventCode: LogEventCode.FRONTEND_GLOBAL_ERROR,
        stage: LogStage.FRONTEND,
        status: LogStatus.FAILURE,
        message: event.message || '前端发生未捕获异常',
        error: event.error ?? event.message,
        details: {
          filename: event.filename,
          line: event.lineno,
          column: event.colno,
        },
      })
    })

    window.addEventListener('unhandledrejection', (event) => {
      DebugLog.append({
        level: 'error',
        channel: 'window.unhandledrejection',
        eventCode: LogEventCode.FRONTEND_UNHANDLED_REJECTION,
        stage: LogStage.FRONTEND,
        status: LogStatus.FAILURE,
        message: '前端发生未处理的 Promise rejection',
        error: event.reason,
      })
    })

    window.addEventListener('pagehide', () => {
      void DebugLog.flush()
    })
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        void DebugLog.flush()
      }
    })
    DebugLog.isGlobalRecorderInstalled = true
  }

  static async invokeSilentElectronApi<T = unknown>(
    channel: keyof Window['electronAPI'],
    args: unknown[] = [],
  ): Promise<T> {
    const rawMethod = DebugLog.getRawElectronApiMethod<T>(String(channel))
    return rawMethod(...args)
  }

  static async invokeElectronApi<T = unknown>(
    channel: keyof Window['electronAPI'],
    args: unknown[] = [],
    option: {
      message?: string
    } = {},
  ): Promise<T> {
    const channelName = String(channel)
    const rawMethod = DebugLog.getRawElectronApiMethod<T>(channelName)
    return DebugLog.callElectronApiWithLog(channelName, rawMethod, args, option)
  }

  static async flush(): Promise<void> {
    if (DebugLog.flushTimer !== undefined) {
      clearTimeout(DebugLog.flushTimer)
      DebugLog.flushTimer = undefined
    }
    if (DebugLog.flushPromise) {
      await DebugLog.flushPromise
      if (DebugLog.pendingRecordList.length > 0) {
        await DebugLog.flush()
      }
      return
    }
    if (DebugLog.pendingRecordList.length === 0) {
      return
    }

    const batch = DebugLog.pendingRecordList.splice(0, Const_Max_Batch_Count)
    const transport = window.electronAPI?.[Const_Frontend_Log_Channel]
    if (typeof transport !== 'function') {
      DebugLog.saveFailedBatch(batch, new Error(`IPC 方法不存在：${Const_Frontend_Log_Channel}`))
      if (DebugLog.pendingRecordList.length > 0) {
        DebugLog.scheduleFlush(0)
      }
      return
    }

    DebugLog.flushPromise = Promise.resolve(transport({ records: batch }))
      .then((result) => {
        const acceptedCount = isRecord(result) ? result.acceptedCount : undefined
        if (acceptedCount !== batch.length) {
          throw new Error(`前端日志批次仅写入 ${String(acceptedCount)}/${batch.length} 条`)
        }
      })
      .catch((error) => {
        DebugLog.saveFailedBatch(batch, error)
      })
      .finally(() => {
        DebugLog.flushPromise = undefined
        if (DebugLog.pendingRecordList.length > 0) {
          DebugLog.scheduleFlush(0)
        }
      })
    await DebugLog.flushPromise
  }

  private static getRawElectronApiMethod<T>(channel: string) {
    const api = window.electronAPI as unknown as Record<string, (...args: unknown[]) => Promise<T>>
    const rawMethod = api?.[channel]
    if (typeof rawMethod !== 'function') {
      throw new Error(`未找到 IPC 方法：${channel}`)
    }
    return rawMethod.bind(api)
  }

  private static async callElectronApiWithLog<T>(
    channel: string,
    method: (...args: unknown[]) => Promise<T>,
    args: unknown[] = [],
    option: {
      message?: string
    } = {},
  ): Promise<T> {
    if (Const_Passive_Channel_Set.has(channel)) {
      return method(...args)
    }

    const startAt = Date.now()
    const traceId = createLogId('trace')
    const requestPayload = args.length === 1 ? args[0] : args
    const runId = readCorrelationId(args, 'runId')
    const jobId = readCorrelationId(args, 'jobId')
    DebugLog.append({
      level: 'info',
      channel,
      eventCode: LogEventCode.FRONTEND_IPC_START,
      stage: LogStage.IPC,
      status: LogStatus.START,
      traceId,
      runId,
      jobId,
      message: option.message ?? `开始调用 IPC：${channel}`,
      request: requestPayload,
    })
    try {
      const traceMetadata: Type_Trace_Metadata = { __zhihuhelpTraceId: traceId }
      const response = await method(...args, traceMetadata)
      if (channel === 'open-local-path' && response === false) {
        throw new Error('输出路径不存在、超出允许目录或无法打开')
      }
      const isPartialSuccess = isRecord(response) && response.status === LogStatus.PARTIAL_SUCCESS
      DebugLog.append({
        level: isPartialSuccess ? 'warn' : 'success',
        channel,
        eventCode: LogEventCode.FRONTEND_IPC_SUCCESS,
        stage: LogStage.IPC,
        status: isPartialSuccess ? LogStatus.PARTIAL_SUCCESS : LogStatus.SUCCESS,
        traceId,
        runId,
        jobId,
        message: isPartialSuccess ? `IPC 调用部分完成：${channel}` : `IPC 调用成功：${channel}`,
        durationMs: Date.now() - startAt,
        request: requestPayload,
        response,
      })
      return response
    } catch (error) {
      DebugLog.append({
        level: 'error',
        channel,
        eventCode: LogEventCode.FRONTEND_IPC_FAILURE,
        stage: LogStage.IPC,
        status: LogStatus.FAILURE,
        traceId,
        runId,
        jobId,
        message: `IPC 调用失败：${channel}`,
        durationMs: Date.now() - startAt,
        request: requestPayload,
        error,
      })
      throw error
    }
  }

  private static enqueueRecord(record: StructuredLogRecord, flushImmediately: boolean) {
    DebugLog.pendingRecordList.push(record)
    if (flushImmediately || DebugLog.pendingRecordList.length >= Const_Max_Batch_Count) {
      void DebugLog.flush()
      return
    }
    DebugLog.scheduleFlush(Const_Flush_Interval_Ms)
  }

  private static scheduleFlush(delayMs: number) {
    if (DebugLog.flushTimer !== undefined) {
      return
    }
    DebugLog.flushTimer = setTimeout(() => {
      DebugLog.flushTimer = undefined
      void DebugLog.flush()
    }, delayMs)
  }

  private static saveFailedBatch(recordList: StructuredLogRecord[], error: unknown) {
    DebugLog.failedRecordList = [...DebugLog.failedRecordList, ...recordList].slice(-Const_Failed_Batch_Record_Count)
    if (!DebugLog.hasReportedTransportFailure) {
      DebugLog.hasReportedTransportFailure = true
      rawConsoleWarn('[frontend-log] 日志 IPC 写入失败，已降级保存在页面内存中', serializeLogError(error))
    }
  }
}
