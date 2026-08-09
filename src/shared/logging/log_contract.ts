export const LOG_SCHEMA_VERSION = 1 as const

export const LogStatus = {
  START: 'start',
  PROGRESS: 'progress',
  SUCCESS: 'success',
  PARTIAL_SUCCESS: 'partial_success',
  FAILURE: 'failure',
  SKIP: 'skip',
} as const

export const LogStage = {
  APP: 'app',
  CLI: 'cli',
  CONFIG: 'config',
  INIT: 'init',
  FETCH: 'fetch',
  PERSIST: 'persist',
  GENERATE: 'generate',
  RENDER: 'render',
  OUTPUT: 'output',
  IPC: 'ipc',
  RPC: 'rpc',
  FRONTEND: 'frontend',
} as const

export const LogLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
} as const

export const LogSource = {
  BACKEND: 'backend',
  FRONTEND: 'frontend',
} as const

export const LogEventCode = {
  RUNTIME_GENERIC: 'runtime.generic',
  APP_START: 'app.start',
  APP_ERROR: 'app.error',
  IPC_REQUEST_START: 'ipc.request.start',
  IPC_REQUEST_SUCCESS: 'ipc.request.success',
  IPC_REQUEST_PARTIAL_SUCCESS: 'ipc.request.partial_success',
  IPC_REQUEST_FAILURE: 'ipc.request.failure',
  IPC_FRONTEND_LOG_ACCEPTED: 'ipc.frontend_log.accepted',
  IPC_FRONTEND_LOG_REJECTED: 'ipc.frontend_log.rejected',
  RPC_SIGN_START: 'rpc.sign.start',
  RPC_SIGN_SUCCESS: 'rpc.sign.success',
  RPC_SIGN_FAILURE: 'rpc.sign.failure',
  WORKFLOW_START: 'workflow.start',
  WORKFLOW_SUCCESS: 'workflow.success',
  WORKFLOW_FAILURE: 'workflow.failure',
  WORKFLOW_PARTIAL_SUCCESS: 'workflow.partial_success',
  CONFIG_CONTEXT_CREATED: 'config.context.created',
  CONFIG_READ_START: 'config.read.start',
  CONFIG_READ_SUCCESS: 'config.read.success',
  CONFIG_READ_FAILURE: 'config.read.failure',
  INIT_START: 'init.start',
  INIT_SUCCESS: 'init.success',
  INIT_FAILURE: 'init.failure',
  INIT_PARTIAL_SUCCESS: 'init.partial_success',
  FETCH_START: 'fetch.start',
  FETCH_SUCCESS: 'fetch.success',
  FETCH_FAILURE: 'fetch.failure',
  FETCH_PARTIAL_SUCCESS: 'fetch.partial_success',
  FETCH_SKIP: 'fetch.skip',
  PERSIST_START: 'persist.start',
  PERSIST_SUCCESS: 'persist.success',
  PERSIST_FAILURE: 'persist.failure',
  GENERATE_START: 'generate.start',
  GENERATE_SUCCESS: 'generate.success',
  GENERATE_FAILURE: 'generate.failure',
  GENERATE_PARTIAL_SUCCESS: 'generate.partial_success',
  RENDER_START: 'render.start',
  RENDER_SUCCESS: 'render.success',
  RENDER_FAILURE: 'render.failure',
  OUTPUT_START: 'output.start',
  OUTPUT_PROGRESS: 'output.progress',
  MARKDOWN_START: 'output.markdown.start',
  MARKDOWN_SUCCESS: 'output.markdown.success',
  MARKDOWN_FALLBACK: 'output.markdown.fallback',
  MARKDOWN_FAILURE: 'output.markdown.failure',
  OUTPUT_CREATED: 'output.created',
  OUTPUT_OPENED: 'output.opened',
  OUTPUT_FAILURE: 'output.failure',
  FRONTEND_APP_START: 'frontend.app.start',
  FRONTEND_ROUTE_CHANGE: 'frontend.route.change',
  FRONTEND_ACTION: 'frontend.action',
  FRONTEND_IPC_START: 'frontend.ipc.start',
  FRONTEND_IPC_SUCCESS: 'frontend.ipc.success',
  FRONTEND_IPC_FAILURE: 'frontend.ipc.failure',
  FRONTEND_REACT_ERROR: 'frontend.react.error',
  FRONTEND_GLOBAL_ERROR: 'frontend.global.error',
  FRONTEND_UNHANDLED_REJECTION: 'frontend.unhandled_rejection',
} as const

export type LogStatusValue = (typeof LogStatus)[keyof typeof LogStatus]
export type LogStageValue = (typeof LogStage)[keyof typeof LogStage]
export type LogLevelValue = (typeof LogLevel)[keyof typeof LogLevel]
export type LogSourceValue = (typeof LogSource)[keyof typeof LogSource]
export type LogEventCodeValue = (typeof LogEventCode)[keyof typeof LogEventCode]

export type SerializedError = {
  name: string
  message: string
  stack?: string
  code?: string
}

export type StructuredLogEntry = {
  traceId?: string
  runId?: string
  jobId?: string
  eventCode?: LogEventCodeValue | string
  source?: LogSourceValue
  stage?: LogStageValue
  status?: LogStatusValue
  taskType?: string
  entityType?: string
  entityId?: string
  durationMs?: number
  level: LogLevelValue
  errorCode?: string
  error?: SerializedError
  details?: Record<string, unknown>
  message: string
}

export type StructuredLogRecord = StructuredLogEntry & {
  schemaVersion: typeof LOG_SCHEMA_VERSION
  triggerAt: string
  eventCode: string
  source: LogSourceValue
}

const SENSITIVE_NORMALIZED_KEY_SET = new Set([
  'authorization',
  'auth',
  'password',
  'passwd',
  'secret',
  'header',
  'headers',
  'requestheader',
  'requestheaders',
  'responseheader',
  'responseheaders',
  'dc0',
  'xzse',
  'xzse93',
  'xzse96',
])
const CONTENT_NORMALIZED_KEY_SET = new Set([
  'body',
  'rawbody',
  'responsebody',
  'responsedata',
  'rawresponse',
  'rawjson',
  'html',
  'content',
  'text',
])
const MAX_STRING_LENGTH = 512
const MAX_STACK_LENGTH = 4000
const MAX_ARRAY_LENGTH = 50
const MAX_OBJECT_KEYS = 100
const MAX_DEPTH = 8
const OPERATIONAL_PATH_KEY_PATTERN = /^(?:outputPath|htmlOutputPath|markdownOutputPath|epubOutputPath|diagnosticPath|targetPath)$/i

function normalizeLogKey(key: string): string {
  return key.replace(/[^a-z0-9]/gi, '').toLowerCase()
}

function isSensitiveKey(key?: string): boolean {
  if (!key) {
    return false
  }
  const normalized = normalizeLogKey(key)
  return (
    SENSITIVE_NORMALIZED_KEY_SET.has(normalized) ||
    normalized.includes('cookie') ||
    normalized.endsWith('token')
  )
}

function isContentKey(key?: string): boolean {
  if (!key) {
    return false
  }
  return CONTENT_NORMALIZED_KEY_SET.has(normalizeLogKey(key))
}

function summarizeString(value: string, key?: string): string {
  if (isSensitiveKey(key) || isContentKey(key)) {
    return '[REDACTED]'
  }

  value = value
    .replace(
      /(["']?\b(?:cookie|authorization|set-cookie|access-token|refresh-token|d_c0|x-zse-96)["']?\s*[:=]\s*)(?:["'][^"'\r\n]*["']|[^\s,;}\r\n]+)/gi,
      '$1[REDACTED]',
    )
    .replace(/\b(bearer)\s+[a-z0-9._~+\/-]+=*/gi, '$1 [REDACTED]')
    .replace(/\b(d_c0|token|access_token|refresh_token)\s*=\s*[^;\s,&]+/gi, '$1=[REDACTED]')

  value = value.replace(/https?:\/\/[^\s"'<>]+/gi, (rawUrl) => {
    try {
      const url = new URL(rawUrl)
      return `${url.origin}${url.pathname}${url.search ? '?[REDACTED]' : ''}`
    } catch {
      return rawUrl
    }
  })

  if (/^[a-zA-Z]:[\\/]/.test(value) && !OPERATIONAL_PATH_KEY_PATTERN.test(key ?? '')) {
    const normalized = value.replace(/\\/g, '/')
    const parts = normalized.split('/')
    if (parts.length > 3) {
      value = `${parts[0]}/.../${parts.slice(-2).join('/')}`
    }
  }

  if (value.length > MAX_STRING_LENGTH) {
    return `${value.slice(0, MAX_STRING_LENGTH)}...[truncated:${value.length}]`
  }
  return value
}

export function serializeLogError(error: unknown): SerializedError {
  if (error instanceof Error) {
    const errorWithCode = error as Error & { code?: unknown }
    return {
      name: summarizeString(error.name || 'Error'),
      message: summarizeString(error.message),
      stack: error.stack ? summarizeString(error.stack.slice(0, MAX_STACK_LENGTH)) : undefined,
      code: typeof errorWithCode.code === 'string' ? summarizeString(errorWithCode.code) : undefined,
    }
  }
  return {
    name: 'NonError',
    message: summarizeString(safeStringify(sanitizeLogValue(error))),
  }
}

function safeStringify(value: unknown): string {
  if (typeof value === 'string') {
    return value
  }
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

export function sanitizeLogValue(
  value: unknown,
  key?: string,
  depth = 0,
  seen: WeakSet<object> = new WeakSet<object>(),
): unknown {
  if (isSensitiveKey(key) || isContentKey(key)) {
    return '[REDACTED]'
  }
  if (value === null || value === undefined || typeof value === 'boolean' || typeof value === 'number') {
    return value
  }
  if (typeof value === 'string') {
    return summarizeString(value, key)
  }
  if (typeof value === 'bigint') {
    return value.toString()
  }
  if (typeof value === 'function' || typeof value === 'symbol') {
    return `[${typeof value}]`
  }
  if (value instanceof Error) {
    return serializeLogError(value)
  }
  if (value instanceof Date) {
    return value.toISOString()
  }
  if (depth >= MAX_DEPTH) {
    return '[MaxDepth]'
  }
  if (typeof value !== 'object') {
    return summarizeString(String(value), key)
  }
  if (seen.has(value)) {
    return '[Circular]'
  }
  seen.add(value)

  if (Array.isArray(value)) {
    const result = value
      .slice(0, MAX_ARRAY_LENGTH)
      .map((item) => sanitizeLogValue(item, undefined, depth + 1, seen))
    if (value.length > MAX_ARRAY_LENGTH) {
      result.push(`[truncated:${value.length - MAX_ARRAY_LENGTH}]`)
    }
    return result
  }

  const record = value as Record<string, unknown>
  const result: Record<string, unknown> = {}
  const keyList = Object.keys(record)
  for (const currentKey of keyList.slice(0, MAX_OBJECT_KEYS)) {
    result[currentKey] = sanitizeLogValue(record[currentKey], currentKey, depth + 1, seen)
  }
  if (keyList.length > MAX_OBJECT_KEYS) {
    result.__truncatedKeys = keyList.length - MAX_OBJECT_KEYS
  }
  return result
}

export function sanitizeStructuredLogEntry(entry: StructuredLogEntry): StructuredLogEntry {
  const sanitized = sanitizeLogValue(entry) as StructuredLogEntry
  return {
    ...sanitized,
    level: entry.level,
    message: summarizeString(entry.message),
    error: entry.error
      ? {
          name: summarizeString(entry.error.name || 'Error'),
          message: summarizeString(entry.error.message),
          stack: entry.error.stack ? summarizeString(entry.error.stack.slice(0, MAX_STACK_LENGTH)) : undefined,
          code: entry.error.code ? summarizeString(entry.error.code) : undefined,
        }
      : undefined,
  }
}

export function createStructuredLogRecord(
  entry: StructuredLogEntry,
  triggerAt = new Date().toISOString(),
): StructuredLogRecord {
  const sanitized = sanitizeStructuredLogEntry(entry)
  return {
    ...sanitized,
    schemaVersion: LOG_SCHEMA_VERSION,
    triggerAt,
    eventCode:
      sanitized.eventCode ??
      (sanitized.stage && sanitized.status
        ? `${sanitized.stage}.${sanitized.status}`
        : LogEventCode.RUNTIME_GENERIC),
    source: sanitized.source ?? LogSource.BACKEND,
  }
}
