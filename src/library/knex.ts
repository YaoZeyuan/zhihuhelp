import knex, { Knex as KnexType } from 'knex'
import CommonConfig from '~/src/config/common'

let activeClient: KnexType | undefined
let activeDatabaseUri = ''

function createClient(databaseUri: string): KnexType {
  return knex({
    client: 'sqlite3',
    connection: {
      filename: databaseUri,
    },
    useNullAsDefault: true,
    pool: {
      max: 1,
      min: 0,
      idleTimeoutMillis: 100,
      reapIntervalMillis: 150,
    },
    acquireConnectionTimeout: 60000,
  })
}

function getClient(): KnexType {
  if (activeClient === undefined || activeDatabaseUri !== CommonConfig.db_uri) {
    if (activeClient !== undefined) {
      activeClient.destroy()
    }
    activeDatabaseUri = CommonConfig.db_uri
    activeClient = createClient(activeDatabaseUri)
  }
  return activeClient
}

const Knex = {
  queryBuilder(): KnexType.QueryBuilder {
    return getClient().queryBuilder()
  },

  raw(...params: Parameters<KnexType['raw']>): ReturnType<KnexType['raw']> {
    return getClient().raw(...params)
  },

  async destroy(): Promise<void> {
    if (activeClient !== undefined) {
      await activeClient.destroy()
      activeClient = undefined
      activeDatabaseUri = ''
    }
  },
}

export default Knex
