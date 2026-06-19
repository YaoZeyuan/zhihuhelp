import knex from '~/src/library/knex'
import fs from 'fs'
import path from 'path'
import http from '~/src/library/http'
import CommonConfig from '~/src/config/common'
import shelljs from 'shelljs'
import PathConfig from '~/src/config/path'
import semver from 'semver'
import Logger from '~/src/library/logger'
import { RunContext } from '~/src/shared/runtime/run_context'

type RemoteVersion = {
  downloadUrl?: string
  releaseAt?: string
  releaseNote?: string
  version: string
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
    await this.checkUpgrade(context)
    this.createDirectories(context)
    this.rebaseDatabaseIfNeeded(input, context)
    await this.initializeDatabase(context)
  }

  private async checkUpgrade(context: RunContext): Promise<void> {
    const startedAt = Date.now()
    Logger.event({
      runId: context.runId,
      stage: 'init',
      status: 'start',
      level: 'info',
      message: '检查应用版本更新',
      details: {
        currentVersion: CommonConfig.version,
        checkUpgradeUri: CommonConfig.checkUpgradeUri,
      },
    })

    let remoteVersionConfig: RemoteVersion
    try {
      remoteVersionConfig = await http.rawInstance
        .get(CommonConfig.checkUpgradeUri, {
          params: {
            now: new Date().toISOString(),
          },
        })
        .then((res) => res.data as RemoteVersion)
    } catch (error) {
      Logger.event({
        runId: context.runId,
        stage: 'init',
        status: 'skip',
        level: 'warn',
        message: '版本检查失败，已跳过更新提示',
        durationMs: Date.now() - startedAt,
        error: Logger.serializeError(error),
        details: {
          currentVersion: CommonConfig.version,
          checkUpgradeUri: CommonConfig.checkUpgradeUri,
        },
      })
      return
    }

    const hasNewVersion = semver.gt(remoteVersionConfig.version, CommonConfig.version)
    Logger.event({
      runId: context.runId,
      stage: 'init',
      status: 'success',
      level: hasNewVersion ? 'warn' : 'info',
      message: hasNewVersion ? '发现新版本，请按需更新' : '版本检查完成，当前已是最新或无需提示',
      durationMs: Date.now() - startedAt,
      details: {
        currentVersion: CommonConfig.version,
        remoteVersion: remoteVersionConfig.version,
        downloadUrl: remoteVersionConfig.downloadUrl,
        releaseAt: remoteVersionConfig.releaseAt,
        releaseNote: remoteVersionConfig.releaseNote,
      },
    })
  }

  private createDirectories(context: RunContext): void {
    const startedAt = Date.now()
    Logger.event({
      runId: context.runId,
      stage: 'init',
      status: 'start',
      level: 'info',
      message: '初始化运行目录',
      details: {
        pathList: PathConfig.allPathList,
      },
    })
    try {
      for (const uri of PathConfig.allPathList) {
        shelljs.mkdir('-p', uri)
      }
      Logger.event({
        runId: context.runId,
        stage: 'init',
        status: 'success',
        level: 'info',
        message: '运行目录初始化完成',
        durationMs: Date.now() - startedAt,
        details: {
          pathList: PathConfig.allPathList,
        },
      })
    } catch (error) {
      Logger.event({
        runId: context.runId,
        stage: 'init',
        status: 'failure',
        level: 'error',
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
        stage: 'init',
        status: 'skip',
        level: 'info',
        message: '未启用 rebase，保留现有数据库',
        details: {
          databasePath: CommonConfig.db_uri,
          databaseExists: fs.existsSync(CommonConfig.db_uri),
        },
      })
      return
    }

    const startedAt = Date.now()
    Logger.event({
      runId: context.runId,
      stage: 'init',
      status: 'start',
      level: 'warn',
      message: '开始重置旧数据库',
      details: {
        databasePath: CommonConfig.db_uri,
        databaseExists: fs.existsSync(CommonConfig.db_uri),
      },
    })
    try {
      if (fs.existsSync(CommonConfig.db_uri)) {
        shelljs.rm(CommonConfig.db_uri)
      }
      Logger.event({
        runId: context.runId,
        stage: 'init',
        status: 'success',
        level: 'info',
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
        stage: 'init',
        status: 'failure',
        level: 'error',
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
    const schemaPath = path.resolve(__dirname, '../../../infrastructure/sqlite/schema/init.sql')
    Logger.event({
      runId: context.runId,
      stage: 'init',
      status: 'start',
      level: 'info',
      message: '初始化 SQLite 数据库',
      details: {
        databasePath: CommonConfig.db_uri,
        schemaPath,
      },
    })
    try {
      shelljs.mkdir('-p', path.dirname(CommonConfig.db_uri))
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
        stage: 'init',
        status: 'success',
        level: 'info',
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
        stage: 'init',
        status: 'failure',
        level: 'error',
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
