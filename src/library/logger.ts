import moment from 'moment'
import lodash from 'lodash'
import * as DATE_FORMAT from '~/src/constant/date_format'
import PathConfig from '~/src/config/path'
import fs from 'fs'

export type StructuredLogEntry = {
  runId?: string
  stage?: 'cli' | 'config' | 'init' | 'fetch' | 'persist' | 'generate' | 'render' | 'output' | 'ipc'
  status?: 'start' | 'progress' | 'success' | 'skip' | 'failure'
  taskType?: string
  entityType?: string
  entityId?: string
  jobId?: string
  durationMs?: number
  level: 'debug' | 'info' | 'warn' | 'error'
  errorCode?: string
  error?: SerializedError
  details?: {
    [key: string]: unknown
  }
  message: string
}

export type SerializedError = {
  name: string
  message: string
  stack?: string
}

class Logger {
  private static formatArgument(...arg: any[]) {
    const triggerAt = moment().format(DATE_FORMAT.Const_Display_By_Millsecond)
    let stringLogItemList = []
    for (let logItem of [...arg]) {
      if (lodash.isString(logItem)) {
        stringLogItemList.push(` ${logItem} `)
      } else {
        stringLogItemList.push(JSON.stringify(logItem, null, 4))
      }
    }
    let logContent = `${triggerAt}:` + stringLogItemList.join('')
    return logContent
  }

  private static pushLogContentToFile(logContent: string) {
    fs.appendFileSync(PathConfig.runtimeLogUri, logContent + '\n', {
      encoding: 'utf8',
    })
    return
  }

  private static pushJsonLogContentToFile(entry: StructuredLogEntry) {
    const record = {
      triggerAt: new Date().toISOString(),
      ...entry,
    }
    fs.appendFileSync(PathConfig.runtimeJsonlUri, JSON.stringify(record) + '\n', {
      encoding: 'utf8',
    })
  }

  static log(...arg: any[]) {
    let logContent = Logger.formatArgument(...arg)
    // 将日志存入Electron全局变量中
    Logger.pushLogContentToFile(logContent)
    console.log(logContent)
  }
  static warn(...arg: any[]) {
    let logContent = Logger.formatArgument(...arg)
    Logger.pushLogContentToFile(logContent)
    console.warn(logContent)
  }

  static event(entry: StructuredLogEntry) {
    Logger.pushJsonLogContentToFile(entry)
    const statusText = entry.status ? `/${entry.status}` : ''
    const durationText = entry.durationMs === undefined ? '' : ` 耗时${entry.durationMs}ms`
    const textMessage = `[${entry.stage ?? 'runtime'}${statusText}] ${entry.message}${durationText}`
    if (entry.level === 'warn' || entry.level === 'error') {
      Logger.warn(textMessage)
      return
    }
    Logger.log(textMessage)
  }

  static serializeError(error: unknown): SerializedError {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
      }
    }
    return {
      name: 'NonError',
      message: Logger.stringifyUnknown(error),
    }
  }

  private static stringifyUnknown(value: unknown): string {
    if (lodash.isString(value)) {
      return value
    }
    try {
      return JSON.stringify(value)
    } catch (error) {
      return String(value)
    }
  }
}

export default Logger
