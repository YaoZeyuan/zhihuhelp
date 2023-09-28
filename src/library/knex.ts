import "reflect-metadata"
import knex from 'knex'
import * as typeorm from 'typeorm'
import * as sqljs from 'sql.js'
import { Activity } from '~/src/database/entity/activity'

import CommonConfig from '~/src/config/common'

import { DataSource } from "typeorm"

const AppDataSource = new DataSource({
  type: "sqljs",
  entities: [Activity],
  synchronize: true,
})

AppDataSource.initialize()

export default AppDataSource
