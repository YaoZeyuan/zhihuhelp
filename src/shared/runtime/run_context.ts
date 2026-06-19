import path from 'path'
import PathConfig from '~/src/config/path'
import CommonConfig from '~/src/config/common'
import Logger from '~/src/library/logger'

export type RunStage = 'cli' | 'config' | 'init' | 'fetch' | 'persist' | 'generate' | 'render' | 'output'

export type RunContextOptions = {
  configPath?: string
  databasePath?: string
  outputPath?: string
}

export type RunContext = {
  runId: string
  configPath: string
  databasePath: string
  outputPath: string
}

/**
 * 创建一次 CLI/GUI 任务运行上下文，并同步旧模块仍会读取的路径配置。
 */
export function createRunContext(options: RunContextOptions): RunContext {
  const configPath = path.resolve(options.configPath ?? PathConfig.configUri)
  const databasePath = path.resolve(options.databasePath ?? CommonConfig.db_uri)
  const outputPath = path.resolve(options.outputPath ?? PathConfig.outputPath)

  PathConfig.setConfigUri(configPath)
  PathConfig.setOutputPath(outputPath)
  CommonConfig.setDatabaseUri(databasePath)

  const runId = createRunId()
  Logger.event({
    runId,
    stage: 'config',
    status: 'success',
    level: 'info',
    message: '创建运行上下文',
    details: {
      configPath,
      databasePath,
      outputPath,
      runtimeLogPath: PathConfig.runtimeLogUri,
      runtimeJsonlPath: PathConfig.runtimeJsonlUri,
    },
  })

  return {
    runId,
    configPath,
    databasePath,
    outputPath,
  }
}

function createRunId(): string {
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '')
  const random = Math.random().toString(36).slice(2, 8)
  return `run-${timestamp}-${random}`
}
