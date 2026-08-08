import path from 'path'
import PathConfig from '~/src/config/path'
import CommonConfig from '~/src/config/common'
import Logger from '~/src/library/logger'
import { LogEventCode, LogLevel, LogStage, LogStatus } from '~/src/shared/logging/log_contract'

export type RunStage = 'cli' | 'config' | 'init' | 'fetch' | 'persist' | 'generate' | 'render' | 'output'

export type RunContextOptions = {
  runId?: string
  configPath?: string
  databasePath?: string
  outputPath?: string
  cachePath?: string
  logPath?: string
  traceId?: string
  skipUpgradeCheck?: boolean
  trigger?: 'cli' | 'gui'
}

export type RunContext = {
  runId: string
  configPath: string
  databasePath: string
  outputPath: string
  cachePath: string
  logPath: string
  traceId?: string
  skipUpgradeCheck: boolean
  trigger: 'cli' | 'gui'
  outcomeStatus: typeof LogStatus.SUCCESS | typeof LogStatus.PARTIAL_SUCCESS
}

/**
 * 创建一次 CLI/GUI 任务运行上下文，并同步旧模块仍会读取的路径配置。
 */
export function createRunContext(options: RunContextOptions): RunContext {
  const configPath = path.resolve(options.configPath ?? PathConfig.configUri)
  const databasePath = path.resolve(options.databasePath ?? CommonConfig.db_uri)
  const outputPath = path.resolve(options.outputPath ?? PathConfig.outputPath)
  const cachePath = path.resolve(options.cachePath ?? PathConfig.cachePath)
  const logPath = path.resolve(options.logPath ?? PathConfig.logPath)

  PathConfig.setConfigUri(configPath)
  PathConfig.setOutputPath(outputPath)
  PathConfig.setCachePath(cachePath)
  PathConfig.setLogPath(logPath)
  CommonConfig.setDatabaseUri(databasePath)

  const runId = options.runId ?? createRunId()
  const traceId = options.traceId ?? createTraceId()
  Logger.event({
    traceId,
    runId,
    eventCode: LogEventCode.CONFIG_CONTEXT_CREATED,
    stage: LogStage.CONFIG,
    status: LogStatus.SUCCESS,
    level: LogLevel.INFO,
    message: '创建运行上下文',
    details: {
      configPath,
      databasePath,
      outputPath,
      cachePath,
      logPath,
      runtimeLogPath: PathConfig.runtimeLogUri,
      runtimeJsonlPath: PathConfig.runtimeJsonlUri,
    },
  })

  return {
    runId,
    configPath,
    databasePath,
    outputPath,
    cachePath,
    logPath,
    traceId,
    skipUpgradeCheck: options.skipUpgradeCheck ?? false,
    trigger: options.trigger ?? 'cli',
    outcomeStatus: LogStatus.SUCCESS,
  }
}

export function createRunId(): string {
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '')
  const random = Math.random().toString(36).slice(2, 8)
  return `run-${timestamp}-${random}`
}

function createTraceId(): string {
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '')
  const random = Math.random().toString(36).slice(2, 8)
  return `command-${timestamp}-${random}`
}
