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
 * 该 workflow 会创建缓存/输出目录、按需重建数据库，并执行 SQLite schema。
 */
export default class InitWorkflow {
  async execute(input: InitWorkflowInput, context: RunContext): Promise<void> {
    Logger.event({
      runId: context.runId,
      stage: 'init',
      level: 'info',
      message: '初始化运行环境',
    })

    await this.checkUpgrade()
    this.createDirectories()

    if (input.rebase) {
      Logger.log(`isRebase => ${input.rebase}, 重置旧数据库`)
      if (fs.existsSync(CommonConfig.db_uri)) {
        shelljs.rm(CommonConfig.db_uri)
      }
      Logger.log('旧数据库删除完毕')
    }

    await this.initializeDatabase()
    Logger.event({
      runId: context.runId,
      stage: 'init',
      level: 'info',
      message: '运行环境初始化完毕',
    })
  }

  private async checkUpgrade(): Promise<void> {
    Logger.log(`检查更新`)
    const remoteVersionConfig = await http.rawInstance
      .get(CommonConfig.checkUpgradeUri, {
        params: {
          now: new Date().toISOString(),
        },
      })
      .then((res) => res.data as RemoteVersion)
      .catch(() => {
        return {
          version: '0.0.0',
        } as RemoteVersion
      })

    if (semver.gt(remoteVersionConfig.version, CommonConfig.version)) {
      Logger.log('有新版本')
      Logger.log(`请到${remoteVersionConfig.downloadUrl ?? ''}下载最新版本知乎助手`)
      Logger.log(`更新日期:${remoteVersionConfig.releaseAt ?? ''}`)
      Logger.log(`更新说明:${remoteVersionConfig.releaseNote ?? ''}`)
    }
  }

  private createDirectories(): void {
    Logger.log('初始化文件夹')
    for (const uri of PathConfig.allPathList) {
      shelljs.mkdir('-p', uri)
    }
    Logger.log('文件夹初始化完毕')
  }

  private async initializeDatabase(): Promise<void> {
    Logger.log('初始化数据库')
    shelljs.mkdir('-p', path.dirname(CommonConfig.db_uri))
    const sqlContent = fs
      .readFileSync(path.resolve(__dirname, '../../../infrastructure/sqlite/schema/init.sql'))
      .toString()
    for (let sql of sqlContent.split(';')) {
      sql = sql.trim()
      if (sql.length) {
        await knex.raw(sql, [])
      }
    }
    Logger.log('数据库初始化完毕')
  }
}
