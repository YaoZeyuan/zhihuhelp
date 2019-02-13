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
import InitEnvCommand from '~/src/command/init_env'
import FetchActivityCommand from '~/src/command/fetch/activity'
import FetchAuthorCommand from '~/src/command/fetch/author'
import FetchCollectionCommand from '~/src/command/fetch/collection'
import FetchColumnCommand from '~/src/command/fetch/column'
import FetchTopicCommand from '~/src/command/fetch/topic'

import GenerateActivityCommand from '~/src/command/generate/activity'
import GenerateAuthorCommand from '~/src/command/generate/author'
import GenerateCollectionCommand from '~/src/command/generate/collection'
import GenerateColumnCommand from '~/src/command/generate/column'
import GenerateTopicCommand from '~/src/command/generate/topic'

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
    let initCommand = new InitEnvCommand()
    await initCommand.handle({}, {})
    let fetchCommand
    let generateCommand
    for (let taskConfig of taskConfigList) {
      switch (taskConfig.type) {
        case 'activity':
          fetchCommand = new FetchActivityCommand()
          await fetchCommand.handle({ account: taskConfig.id }, {})
          generateCommand = new GenerateActivityCommand()
          await generateCommand.handle({ account: taskConfig.id }, {})
          break
        case 'author':
          fetchCommand = new FetchAuthorCommand()
          await fetchCommand.handle({ account: taskConfig.id }, {})
          generateCommand = new GenerateAuthorCommand()
          await generateCommand.handle({ account: taskConfig.id }, {})
          break
        case 'collection':
          fetchCommand = new FetchCollectionCommand()
          await fetchCommand.handle({ collectionId: taskConfig.id }, {})
          generateCommand = new GenerateCollectionCommand()
          await generateCommand.handle({ collectionId: taskConfig.id }, {})
          break
        case 'column':
          fetchCommand = new FetchColumnCommand()
          await fetchCommand.handle({ columnId: taskConfig.id }, {})
          generateCommand = new GenerateColumnCommand()
          await generateCommand.handle({ columnId: taskConfig.id }, {})
          break
        case 'topic':
          fetchCommand = new FetchTopicCommand()
          await fetchCommand.handle({ topicId: taskConfig.id }, {})
          generateCommand = new GenerateTopicCommand()
          await generateCommand.handle({ topicId: taskConfig.id }, {})
          break
      }
    }
    this.log(`执行完毕`)
  }
}

export default DispatchCommand
