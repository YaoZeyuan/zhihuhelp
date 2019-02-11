import Base from '~/src/command/base'
import knex from '~/src/library/knex'
import fs from 'fs'
import path from 'path'
import http from '~/src/library/http'
import TypeLocalConfig from '~/src/type/namespace/local_config'
import TypeTaskConfig from '~/src/type/namespace/task_config'
import CommonConfig from '~/src/config/common'
import shelljs from 'shelljs'
import DatabaseConfig from '~/src/config/database'
import PathConfig from '~/src/config/path'

// @todo(yaozeyuan) 目前执行抓取命令有问题, 需要再处理一下
class DispatchCommand extends Base {
  static get signature () {
    return `
      Dispatch:Task
     `
  }

  static get description () {
    return '根据task_config_list.json配置, 分发任务'
  }

  async execute (args: any, options: any) {
    this.log(`检查更新`)
    let taskConfigListJson = fs.readFileSync(PathConfig.taskConfigListUri)
    let taskConfigList: Array<TypeTaskConfig.Record> = JSON.parse(taskConfigListJson.toString())
    // 初始化运行环境
    shelljs.exec(`node dist${path.sep}ace.js Init:Env`)
    for (let taskConfig of taskConfigList) {
      switch (taskConfig.type) {
        case 'activity':
          shelljs.exec(`node dist${path.sep}ace.js Fetch:Activity ${taskConfig.id}`)
          shelljs.exec(`node dist${path.sep}ace.js Generate:Activity ${taskConfig.id}`)
          break
        case 'author':
          shelljs.exec(`node dist${path.sep}ace.js Fetch:Author ${taskConfig.id}`)
          shelljs.exec(`node dist${path.sep}ace.js Generate:Author ${taskConfig.id}`)
          break
        case 'collection':
          shelljs.exec(`node dist${path.sep}ace.js Fetch:Collection ${taskConfig.id}`)
          shelljs.exec(`node dist${path.sep}ace.js Generate:Collection ${taskConfig.id}`)
          break
        case 'column':
          shelljs.exec(`node dist${path.sep}ace.js Fetch:Column ${taskConfig.id}`)
          shelljs.exec(`node dist${path.sep}ace.js Generate:Column ${taskConfig.id}`)
          break
        case 'topic':
          shelljs.exec(`node dist${path.sep}ace.js Fetch:Topic ${taskConfig.id}`)
          shelljs.exec(`node dist${path.sep}ace.js Generate:Topic ${taskConfig.id}`)
          break
      }
    }
    this.log(`执行完毕`)
  }
}

export default DispatchCommand
