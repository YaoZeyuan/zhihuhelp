import knex from '~/src/library/knex'
import fs from 'fs'
import path from 'path'
import http from '~/src/library/http'
import CommonConfig from '~/src/config/common'
import PathConfig from '~/src/config/path'
import semver from 'semver'
import Logger from '~/src/library/logger'
import { RunContext } from '~/src/shared/runtime/run_context'
import { LogEventCode, LogLevel, LogStage, LogStatus } from '~/src/shared/logging/log_contract'
import { AppErrorCode, ApplicationError } from '~/src/shared/error/application_error'

type RemoteVersion = {
  downloadUrl?: string
  releaseAt?: string
  releaseNote?: string
  version?: unknown
}

export type InitWorkflowInput = {
  rebase: boolean
}

/**
 * 初始化运行环境。
 *
 * 负责创建缓存/输出目录、按需重建数据库，并执行 SQLite schema。
 */
export default class InitWorkflow {
  async execute(input: InitWorkflowInput, context: RunContext): Promise<void> {
    if (context.skipUpgradeCheck) {
      Logger.event({
        traceId: context.traceId,
        runId: context.runId,
        eventCode: LogEventCode.INIT_PARTIAL_SUCCESS,
        stage: LogStage.INIT,
        status: LogStatus.SKIP,
        level: LogLevel.INFO,
        message: '运行上下文要求跳过版本联网检查',
      })
    } else {
      await this.checkUpgrade(context)
    }
    this.createDirectories(context)
    this.rebaseDatabaseIfNeeded(input, context)
    await this.initializeDatabase(context)
  }

  private async checkUpgrade(context: RunContext): Promise<void> {
    const startedAt = Date.now()
    const jobId = 'init-upgrade-check'
    Logger.event({
      runId: context.runId,
      traceId: context.traceId,
      jobId,
      eventCode: LogEventCode.INIT_START,
      stage: LogStage.INIT,
      status: LogStatus.START,
      level: LogLevel.INFO,
      message: '检查应用版本更新',
      details: {
        currentVersion: CommonConfig.version,
        checkUpgradeUri: CommonConfig.checkUpgradeUri,
      },
    })

    let remoteVersionConfig: RemoteVersion
    let remoteVersion: string
    let hasNewVersion: boolean
    try {
      const responseData = await http.rawInstance
        .get(CommonConfig.checkUpgradeUri, {
          params: {
            now: new Date().toISOString(),
          },
        })
        .then((res) => res.data as unknown)
      remoteVersionConfig =
        responseData !== null && typeof responseData === 'object' && Array.isArray(responseData) === false
          ? responseData as RemoteVersion
          : {}
      const normalizedRemoteVersion =
        typeof remoteVersionConfig.version === 'string' ? semver.valid(remoteVersionConfig.version) : null
      const normalizedCurrentVersion = semver.valid(CommonConfig.version)
      if (normalizedRemoteVersion === null) {
        throw new ApplicationError(
          AppErrorCode.VERSION_CHECK_FAILED,
          '版本检查响应缺少有效的 semver version',
        )
      }
      if (normalizedCurrentVersion === null) {
        throw new ApplicationError(
          AppErrorCode.VERSION_CHECK_FAILED,
          '本地应用版本无法按 semver 解析',
        )
      }
      remoteVersion = normalizedRemoteVersion
      try {
        hasNewVersion = semver.gt(remoteVersion, normalizedCurrentVersion)
      } catch (error) {
        throw new ApplicationError(AppErrorCode.VERSION_CHECK_FAILED, 'semver 版本比较失败', error)
      }
    } catch (error) {
      const diagnosticError =
        error instanceof ApplicationError && error.code === AppErrorCode.VERSION_CHECK_FAILED
          ? error
          : new ApplicationError(AppErrorCode.VERSION_CHECK_FAILED, '版本检查请求或版本比较失败', error)
      context.outcomeStatus = LogStatus.PARTIAL_SUCCESS
      Logger.event({
        runId: context.runId,
        traceId: context.traceId,
        jobId,
        eventCode: LogEventCode.INIT_PARTIAL_SUCCESS,
        stage: LogStage.INIT,
        status: LogStatus.PARTIAL_SUCCESS,
        level: LogLevel.WARN,
        message: '版本检查失败，已跳过更新提示',
        durationMs: Date.now() - startedAt,
        errorCode: AppErrorCode.VERSION_CHECK_FAILED,
        error: Logger.serializeError(diagnosticError),
        details: {
          currentVersion: CommonConfig.version,
          checkUpgradeUri: CommonConfig.checkUpgradeUri,
        },
      })
      return
    }

    Logger.event({
      runId: context.runId,
      traceId: context.traceId,
      jobId,
      eventCode: LogEventCode.INIT_SUCCESS,
      stage: LogStage.INIT,
      status: LogStatus.SUCCESS,
      level: hasNewVersion ? LogLevel.WARN : LogLevel.INFO,
      message: hasNewVersion ? '发现新版本，请按需更新' : '版本检查完成，当前已是最新或无需提示',
      durationMs: Date.now() - startedAt,
      details: {
        currentVersion: CommonConfig.version,
        remoteVersion,
        downloadUrl: remoteVersionConfig.downloadUrl,
        releaseAt: remoteVersionConfig.releaseAt,
        releaseNote: remoteVersionConfig.releaseNote,
      },
    })
  }

  private createDirectories(context: RunContext): void {
    const startedAt = Date.now()
    const jobId = 'init-directories'
    Logger.event({
      runId: context.runId,
      jobId,
      stage: LogStage.INIT,
      status: LogStatus.START,
      level: LogLevel.INFO,
      message: '初始化运行目录',
      details: {
        pathList: PathConfig.allPathList,
      },
    })
    try {
      for (const uri of PathConfig.allPathList) {
        fs.mkdirSync(uri, { recursive: true })
      }
      Logger.event({
        runId: context.runId,
        jobId,
        stage: LogStage.INIT,
        status: LogStatus.SUCCESS,
        level: LogLevel.INFO,
        message: '运行目录初始化完成',
        durationMs: Date.now() - startedAt,
        details: {
          pathList: PathConfig.allPathList,
        },
      })
    } catch (error) {
      Logger.event({
        runId: context.runId,
        jobId,
        stage: LogStage.INIT,
        status: LogStatus.FAILURE,
        level: LogLevel.ERROR,
        message: '运行目录初始化失败',
        durationMs: Date.now() - startedAt,
        error: Logger.serializeError(error),
        details: {
          pathList: PathConfig.allPathList,
        },
      })
      throw error
    }
  }

  private rebaseDatabaseIfNeeded(input: InitWorkflowInput, context: RunContext): void {
    if (input.rebase === false) {
      Logger.event({
        runId: context.runId,
        stage: LogStage.INIT,
        status: LogStatus.SKIP,
        level: LogLevel.INFO,
        message: '未启用 rebase，保留现有数据库',
        details: {
          databasePath: CommonConfig.db_uri,
          databaseExists: fs.existsSync(CommonConfig.db_uri),
        },
      })
      return
    }

    const startedAt = Date.now()
    const jobId = 'init-rebase-database'
    Logger.event({
      runId: context.runId,
      jobId,
      stage: LogStage.INIT,
      status: LogStatus.START,
      level: LogLevel.WARN,
      message: '开始重置旧数据库',
      details: {
        databasePath: CommonConfig.db_uri,
        databaseExists: fs.existsSync(CommonConfig.db_uri),
      },
    })
    try {
      if (fs.existsSync(CommonConfig.db_uri)) {
        fs.rmSync(CommonConfig.db_uri, { force: true })
      }
      Logger.event({
        runId: context.runId,
        jobId,
        stage: LogStage.INIT,
        status: LogStatus.SUCCESS,
        level: LogLevel.INFO,
        message: '旧数据库重置完成',
        durationMs: Date.now() - startedAt,
        details: {
          databasePath: CommonConfig.db_uri,
          databaseExistsAfterRebase: fs.existsSync(CommonConfig.db_uri),
        },
      })
    } catch (error) {
      Logger.event({
        runId: context.runId,
        jobId,
        stage: LogStage.INIT,
        status: LogStatus.FAILURE,
        level: LogLevel.ERROR,
        message: '旧数据库重置失败',
        durationMs: Date.now() - startedAt,
        error: Logger.serializeError(error),
        details: {
          databasePath: CommonConfig.db_uri,
        },
      })
      throw error
    }
  }

  private async initializeDatabase(context: RunContext): Promise<void> {
    const startedAt = Date.now()
    const jobId = 'init-database-schema'
    const schemaPath = path.resolve(__dirname, '../../../infrastructure/sqlite/schema/init.sql')
    Logger.event({
      runId: context.runId,
      jobId,
      stage: LogStage.INIT,
      status: LogStatus.START,
      level: LogLevel.INFO,
      message: '初始化 SQLite 数据库',
      details: {
        databasePath: CommonConfig.db_uri,
        schemaPath,
      },
    })
    try {
      fs.mkdirSync(path.dirname(CommonConfig.db_uri), { recursive: true })
      const sqlContent = fs.readFileSync(schemaPath).toString()
      const sqlList = sqlContent
        .split(';')
        .map((sql) => sql.trim())
        .filter((sql) => sql.length > 0)
      for (const sql of sqlList) {
        await knex.raw(sql, [])
      }
      Logger.event({
        runId: context.runId,
        jobId,
        stage: LogStage.INIT,
        status: LogStatus.SUCCESS,
        level: LogLevel.INFO,
        message: 'SQLite 数据库初始化完成',
        durationMs: Date.now() - startedAt,
        details: {
          databasePath: CommonConfig.db_uri,
          schemaPath,
          sqlStatementCount: sqlList.length,
        },
      })
    } catch (error) {
      Logger.event({
        runId: context.runId,
        jobId,
        stage: LogStage.INIT,
        status: LogStatus.FAILURE,
        level: LogLevel.ERROR,
        message: 'SQLite 数据库初始化失败',
        durationMs: Date.now() - startedAt,
        error: Logger.serializeError(error),
        details: {
          databasePath: CommonConfig.db_uri,
          schemaPath,
        },
      })
      throw error
    }
  }
}
