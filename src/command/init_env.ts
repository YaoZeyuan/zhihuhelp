import Base from '~/src/command/base'
import knex from '~/src/library/knex'
import fs from 'fs'
import path from 'path'
import http from '~/src/library/http'
import CommonConfig from '~/src/config/common'
import shelljs from 'shelljs'
import { args, flags } from '@adonisjs/ace'
import PathConfig from '~/src/config/path'
import semver from 'semver'

type Type_Res_Version = {
  downloadUrl: 'http://www.baidu.com' | string
  releaseAt: '2019年2月11日12点08分' | string
  releaseNote: '' | string
  version: '1.0.0' | string
}

class InitEnv extends Base {
  public static commandName = 'Init:Env'
  public static description = '初始化运行环境'

  @flags.boolean({ description: '是否重建数据库' })
  rebase: boolean = false

  async execute() {
    let isRebase = this.rebase
    console.log('isRebase => ', isRebase)
    this.log(`检查更新`)
    let remoteVersionConfig: Type_Res_Version = await http.rawInstance
      .get(CommonConfig.checkUpgradeUri, {
        params: {
          now: new Date().toISOString(),
        },
      })
      .then(res => {
        return res.data
      })
      .catch((e) => {
        return {
          version: '0.0.0',
        } as any
      })
    // 已经通过Electron拿到了最新知乎cookie并写入了配置文件中, 因此不需要再填写配置文件了
    if (semver.gt(remoteVersionConfig.version, CommonConfig.version)) {
      this.log('有新版本')
      this.log(`请到${remoteVersionConfig.downloadUrl}下载最新版本知乎助手`)
      this.log(`更新日期:${remoteVersionConfig.releaseAt}`)
      this.log(`更新说明:${remoteVersionConfig.releaseNote}`)
      return
    }

    this.log('初始化文件夹')
    for (let uri of PathConfig.allPathList) {
      shelljs.mkdir('-p', uri)
    }
    this.log('文件夹初始化完毕')

    if (isRebase) {
      this.log(`isRebase => ${isRebase}, 重置旧代码`)
      this.log('重建数据库')
      this.log('删除旧数据库')
      shelljs.rm(CommonConfig.db_uri)
      this.log('旧数据库删除完毕')
    }
    this.log('初始化数据库')
    const sqlContent = fs.readFileSync(path.resolve(__dirname, './init.sql')).toString()
    for (let sql of sqlContent.split(';')) {
      // 一次只能执行一行
      sql = sql.trim()
      if (sql.length) {
        await knex.raw(sql)
      }
    }
    this.log('数据库初始化完毕')
  }
}

export default InitEnv
