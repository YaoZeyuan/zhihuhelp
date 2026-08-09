import fs from 'fs'
import path from 'path'
import moment from 'moment'
import * as DATE_FORMAT from '~/src/constant/date_format.js'
import PathConfig from '~/src/config/path.js'
import {
  createStructuredLogRecord,
  LogLevel,
  LogSource,
  LogStatus,
  sanitizeLogValue,
  serializeLogError,
  SerializedError,
  StructuredLogEntry,
  StructuredLogRecord,
} from '~/src/shared/logging/log_contract.js'
import { getLogCorrelationContext } from '~/src/shared/runtime/log_correlation_context.js'
import { parseRuntimeSessionErrorList } from '~/src/shared/logging/session_error.js'

export type { SerializedError, StructuredLogEntry, StructuredLogRecord }

export type LogFileKind = 'runtime-text' | 'runtime-jsonl' | 'frontend-jsonl'

const LOG_RETENTION_DAYS = 5

const LOG_FILE_PATTERN_MAP: Record<LogFileKind, RegExp> = {
  'runtime-text': /^runtime\.\d{4}-\d{2}-\d{2}\.log$/,
  'runtime-jsonl': /^runtime\.\d{4}-\d{2}-\d{2}\.jsonl$/,
  'frontend-jsonl': /^frontend\.runtime\.\d{4}-\d{2}-\d{2}\.jsonl$/,
}

function isMissingPathError(error: unknown): boolean {
  return error !== null
    && typeof error === 'object'
    && (error as { code?: unknown }).code === 'ENOENT'
}

class Logger {
  private static lastWriteFailure = ''
  private static isDebugMode = process.env.NODE_ENV === 'test'

  private static throwStrictIoFailure(message: string, error: unknown): never {
    const serialized = serializeLogError(error)
    Logger.lastWriteFailure = serialized.message
    console.error(`[Logger] ${message}: ${serialized.message}`)
    throw error
  }

  private static shouldWriteRecord(record: StructuredLogRecord): boolean {
    if (Logger.isDebugMode) {
      return true
    }
    if (
      record.level === LogLevel.WARN ||
      record.level === LogLevel.ERROR ||
      record.status === LogStatus.FAILURE ||
      record.status === LogStatus.PARTIAL_SUCCESS
    ) {
      return true
    }
    if (record.jobId === undefined) {
      return true
    }
    if (
      record.jobId.startsWith('stage-')
      && (
        record.status === LogStatus.START
        || record.status === LogStatus.SUCCESS
      )
    ) {
      return true
    }
    return /^(?:app|ipc|rpc|workflow|output|frontend|config)\./.test(record.eventCode)
  }

  private static formatArgument(...argumentList: unknown[]) {
    const triggerAt = moment().format(DATE_FORMAT.Const_Display_By_Millsecond)
    const stringLogItemList = argumentList.map((item) => {
      const safeItem = sanitizeLogValue(item)
      if (typeof safeItem === 'string') {
        return ` ${safeItem} `
      }
      try {
        return JSON.stringify(safeItem, null, 2)
      } catch {
        return '[Unserializable]'
      }
    })
    return `${triggerAt}:${stringLogItemList.join('')}`
  }

  private static ensureLogDirectory() {
    fs.mkdirSync(PathConfig.logPath, { recursive: true })
  }

  private static appendFile(logUri: string, content: string, kind: LogFileKind): boolean {
    try {
      Logger.ensureLogDirectory()
      fs.appendFileSync(logUri, content, { encoding: 'utf8' })
      Logger.cleanupExpiredFiles(kind)
      Logger.lastWriteFailure = ''
      return true
    } catch (error) {
      const serialized = serializeLogError(error)
      Logger.lastWriteFailure = serialized.message
      console.error(`[Logger] 写入日志失败: ${serialized.message}`)
      return false
    }
  }

  private static cleanupExpiredFiles(kind: LogFileKind) {
    const fileList = Logger.getLogFileList(kind, true)
    for (const filePath of fileList.slice(LOG_RETENTION_DAYS)) {
      try {
        fs.unlinkSync(filePath)
      } catch (error) {
        console.error(`[Logger] 清理过期日志失败: ${serializeLogError(error).message}`)
      }
    }
  }

  private static getCurrentFileUri(kind: LogFileKind): string {
    if (kind === 'runtime-text') {
      return PathConfig.runtimeLogUri
    }
    if (kind === 'frontend-jsonl') {
      return PathConfig.frontendRuntimeJsonlUri
    }
    return PathConfig.runtimeJsonlUri
  }

  private static getLogFileListStrict(kind: LogFileKind, newestFirst = false): string[] {
    let logPathStat: fs.Stats
    try {
      logPathStat = fs.statSync(PathConfig.logPath)
    } catch (error) {
      if (isMissingPathError(error)) {
        return []
      }
      return Logger.throwStrictIoFailure('读取日志目录失败', error)
    }
    if (logPathStat.isDirectory() === false) {
      return Logger.throwStrictIoFailure('读取日志目录失败', new Error(`日志路径不是目录：${PathConfig.logPath}`))
    }
    const pattern = LOG_FILE_PATTERN_MAP[kind]
    let fileNameList: string[]
    try {
      fileNameList = fs.readdirSync(PathConfig.logPath)
    } catch (error) {
      return Logger.throwStrictIoFailure('读取日志目录失败', error)
    }
    const fileList = fileNameList
      .filter((fileName) => pattern.test(fileName))
      .sort()
      .map((fileName) => path.resolve(PathConfig.logPath, fileName))
    return newestFirst ? fileList.reverse() : fileList
  }

  static getLogFileList(kind: LogFileKind, newestFirst = false): string[] {
    try {
      return Logger.getLogFileListStrict(kind, newestFirst)
    } catch {
      // 严格读取已经记录诊断；普通查看保持降级为空列表。
      return []
    }
  }

  static readRecentLogContent(kind: LogFileKind, maxLines?: number): string {
    const content = Logger.getLogFileList(kind)
      .slice(-LOG_RETENTION_DAYS)
      .map((filePath) => {
        try {
          return fs.readFileSync(filePath, 'utf8')
        } catch (error) {
          console.error(`[Logger] 读取日志失败: ${serializeLogError(error).message}`)
          return ''
        }
      })
      .filter((item) => item !== '')
      .join('\n')
    if (maxLines === undefined) {
      return content
    }
    return content.split('\n').slice(-maxLines).join('\n')
  }

  static readRuntimeSessionErrorList(sessionStartedAt: number): StructuredLogRecord[] {
    const content = Logger.getLogFileListStrict('runtime-jsonl')
      .slice(-LOG_RETENTION_DAYS)
      .map((filePath) => {
        try {
          return fs.readFileSync(filePath, 'utf8')
        } catch (error) {
          return Logger.throwStrictIoFailure('读取日志失败', error)
        }
      })
      .filter((item) => item !== '')
      .join('\n')
    return parseRuntimeSessionErrorList(content, sessionStartedAt)
  }

  static clearLogFiles(kind: LogFileKind): void {
    for (const filePath of Logger.getLogFileList(kind)) {
      try {
        fs.writeFileSync(filePath, '', 'utf8')
      } catch (error) {
        console.error(`[Logger] 清空日志失败: ${serializeLogError(error).message}`)
      }
    }
  }

  static clearLogFilesStrict(kind: LogFileKind): void {
    for (const filePath of Logger.getLogFileListStrict(kind)) {
      try {
        fs.writeFileSync(filePath, '', 'utf8')
      } catch (error) {
        Logger.throwStrictIoFailure('清空日志失败', error)
      }
    }
  }

  static log(...argumentList: unknown[]) {
    if (Logger.isDebugMode === false) {
      return
    }
    const logContent = Logger.formatArgument(...argumentList)
    Logger.appendFile(PathConfig.runtimeLogUri, `${logContent}\n`, 'runtime-text')
    console.log(logContent)
  }

  static warn(...argumentList: unknown[]) {
    const logContent = Logger.formatArgument(...argumentList)
    Logger.appendFile(PathConfig.runtimeLogUri, `${logContent}\n`, 'runtime-text')
    console.warn(logContent)
  }

  static event(entry: StructuredLogEntry): StructuredLogRecord {
    const correlation = getLogCorrelationContext()
    const record = createStructuredLogRecord({
      ...entry,
      traceId: entry.traceId ?? correlation.traceId,
      runId: entry.runId ?? correlation.runId,
      jobId: entry.jobId ?? correlation.jobId,
    })
    if (Logger.shouldWriteRecord(record) === false) {
      return record
    }
    const kind = record.source === LogSource.FRONTEND ? 'frontend-jsonl' : 'runtime-jsonl'
    Logger.appendFile(Logger.getCurrentFileUri(kind), `${JSON.stringify(record)}\n`, kind)

    const statusText = record.status ? `/${record.status}` : ''
    const durationText = record.durationMs === undefined ? '' : ` 耗时${record.durationMs}ms`
    const textMessage = `[${record.stage ?? 'runtime'}${statusText}] ${record.message}${durationText}`
    const logContent = Logger.formatArgument(textMessage)
    Logger.appendFile(PathConfig.runtimeLogUri, `${logContent}\n`, 'runtime-text')
    if (record.level === LogLevel.WARN || record.level === LogLevel.ERROR) {
      console.warn(logContent)
    } else if (Logger.isDebugMode) {
      console.log(logContent)
    }
    return record
  }

  static appendFrontendRecords(recordList: StructuredLogRecord[]): number {
    let acceptedCount = 0
    for (const inputRecord of recordList) {
      const { schemaVersion, triggerAt, ...entry } = inputRecord
      const record = createStructuredLogRecord(
        {
          ...entry,
          source: LogSource.FRONTEND,
        },
        triggerAt,
      )
      if (Logger.shouldWriteRecord(record) === false) {
        acceptedCount++
        continue
      }
      if (Logger.appendFile(PathConfig.frontendRuntimeJsonlUri, `${JSON.stringify(record)}\n`, 'frontend-jsonl')) {
        acceptedCount++
      }
    }
    return acceptedCount
  }

  static serializeError(error: unknown): SerializedError {
    return serializeLogError(error)
  }

  static getLastWriteFailure(): string {
    return Logger.lastWriteFailure
  }

  static setDebugMode(isDebugMode: boolean): void {
    Logger.isDebugMode = isDebugMode
  }
}

export default Logger
