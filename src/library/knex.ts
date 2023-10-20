import "reflect-metadata"
import knex from 'knex'
import * as typeorm from 'typeorm'
import * as sqljs from 'sql.js'
import { Activity } from '~/src/database/entity/activity'
import { Answer } from '~/src/database/entity/answer'
import { Article } from '~/src/database/entity/article'
import { Author } from '~/src/database/entity/author'
import { AuthorAskQuestion } from '~/src/database/entity/author_ask_question'
import { Collection } from '~/src/database/entity/collection'
import { Column } from '~/src/database/entity/column'
import { Pin } from '~/src/database/entity/pin'
import { Topic } from '~/src/database/entity/topic'

import CommonConfig from '~/src/config/common'

import { DataSource } from "typeorm"

const AppDataSource = new DataSource({
  type: "sqljs",
  entities: [Activity, Answer, Article, Author, AuthorAskQuestion, Collection, Column, Pin, Topic],
  synchronize: true,
  // 两者同时打开后, 可以自动保存数据库修改
  // 见中文文档: https://github.com/typeorm/typeorm/blob/master/docs/zh_CN/connection-options.md#sqljs
  "autoSave": true,
  "location": CommonConfig.db_uri
})

// AppDataSource.initialize()

export default AppDataSource
